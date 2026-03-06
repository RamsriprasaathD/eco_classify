import { NextResponse } from "next/server";
import getDisposalDate from "../../../lib/groqDate";
import { parse } from "papaparse";

import prisma from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth";

export async function POST(req) {
try {
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

let formData;

try {
  formData = await req.formData();
} catch (err) {
  console.error("FormData error:", err);
  return NextResponse.json(
    { error: "Invalid form data" },
    { status: 400 }
  );
}

const csvFile = formData.get("csvFile");

if (!csvFile || !(csvFile instanceof Blob)) {
  return NextResponse.json(
    { error: "CSV file is required" },
    { status: 400 }
  );
}

const csvText = await csvFile.text();

const parsed = parse(csvText, {
  header: true,
  skipEmptyLines: true
});

if (!parsed.data || parsed.data.length === 0) {
  return NextResponse.json(
    { error: "CSV file is empty" },
    { status: 400 }
  );
}

const firstRow = parsed.data[0];

const headers = Object.keys(firstRow);

const wasteColumn = headers.find((h) => {
  const key = h.toLowerCase();
  return (
    key === "waste_name" ||
    key === "waste name" ||
    key === "wastename" ||
    key === "name"
  );
});

if (!wasteColumn) {
  return NextResponse.json(
    {
      error:
        'CSV must contain a column like "waste_name"'
    },
    { status: 400 }
  );
}

const results = [];

for (const row of parsed.data) {

  const wasteName = row[wasteColumn]?.trim();

  if (!wasteName) {
    results.push({
      wasteName: "(empty)",
      error: "Empty waste name"
    });
    continue;
  }

  try {

    let disposalDate = null;

    try {
      disposalDate = await getDisposalDate(wasteName);
    } catch (e) {
      console.error("AI error:", e);
    }

    if (!disposalDate) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 7);
      disposalDate = fallback.toISOString().split("T")[0];
    }

    /* STORE EVENT */

    await prisma.event.create({
      data: {
        title: `Dispose: ${wasteName}`,
        date: new Date(disposalDate),
        email: session.user.email
      }
    });

    results.push({
      wasteName,
      disposalDate
    });

  } catch (err) {

    console.error("Row error:", err);

    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 7);

    results.push({
      wasteName,
      disposalDate: fallback.toISOString().split("T")[0],
      error: "processing error"
    });
  }
}

const successCount = results.filter(r => !r.error).length;
const errorCount = results.filter(r => r.error).length;

return NextResponse.json({
  results,
  success: successCount,
  errors: errorCount
});

} catch (error) {

console.error("CSV processing error:", error);

return NextResponse.json(
  { error: "Server error" },
  { status: 500 }
);

}
}
