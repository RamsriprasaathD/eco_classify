import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";

import getDisposalDate from "../../../lib/groqDate";
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

    const contentType = req.headers.get("content-type");

    let wasteName = "";
    let wasteImageData = null;

    /* ---------------- HANDLE FORM DATA ---------------- */

    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      wasteName = formData.get("wasteName") || "";

      const wasteImage = formData.get("wasteImage");

      if (wasteImage && wasteImage instanceof Blob) {
        const uploadDir = join(process.cwd(), "tmp", "uploads");

        await fs.mkdir(uploadDir, { recursive: true });

        const uniqueId = uuidv4();
        const extension = wasteImage.name
          ? wasteImage.name.split(".").pop()
          : "jpg";

        const filename = `${uniqueId}.${extension}`;

        const filepath = join(uploadDir, filename);

        const bytes = await wasteImage.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filepath, buffer);

        wasteImageData = {
          path: filepath,
          filename: filename,
        };

        if (!wasteName) {
          wasteName = "unidentified waste";
        }
      }
    } else {
      const body = await req.json();
      wasteName = body.wasteName || "";
    }

    if (!wasteName && !wasteImageData) {
      return NextResponse.json(
        { error: "Waste name or image required" },
        { status: 400 }
      );
    }

    /* ---------------- AI DISPOSAL DATE ---------------- */

    const disposalDate = await getDisposalDate(wasteName);

    if (!disposalDate) {
      return NextResponse.json(
        { error: "Failed to generate disposal date" },
        { status: 500 }
      );
    }

    /* ---------------- STORE EVENT IN DATABASE ---------------- */

    const event = await prisma.event.create({
      data: {
        title: `Dispose: ${wasteName}`,
        date: new Date(disposalDate),
        email: session.user.email,
      },
    });

    /* ---------------- CLEAN TEMP IMAGE ---------------- */

    if (wasteImageData) {
      try {
        await fs.unlink(wasteImageData.path);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    /* ---------------- RESPONSE ---------------- */

    return NextResponse.json({
      disposalDate,
      eventStored: true,
      eventId: event.id,
    });

  } catch (error) {
    console.error("Generate date API error:", error);

    return NextResponse.json(
      { error: "Service error" },
      { status: 500 }
    );
  }
}