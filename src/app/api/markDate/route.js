import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth";

/* ---------------- FETCH EVENTS ---------------- */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { email: session.user.email },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ events });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/* ---------------- CREATE EVENT ---------------- */

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, date } = await request.json();

    if (!title || !date) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        email: session.user.email,
      },
    });

    return NextResponse.json({ event });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

/* ---------------- DELETE EVENT ---------------- */

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
    });

    if (!event || event.email !== session.user.email) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}