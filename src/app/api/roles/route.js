import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
      include: {
        permisos: {
          include: { permiso: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ data: roles });
  } catch (error) {
    console.error("[GET /api/roles]", error);
    return NextResponse.json(
      {
        error: "No fue posible obtener los roles.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nombre = body?.nombre?.trim();
    const descripcion = body?.descripcion?.trim() || null;

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del rol es obligatorio." },
        { status: 400 }
      );
    }

    const role = await prisma.roles.create({
      data: {
        nombre,
        descripcion,
      },
    });

    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/roles]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe un rol con ese nombre."
        : "No fue posible crear el rol.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

