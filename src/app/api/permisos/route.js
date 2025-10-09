import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const permisos = await prisma.permisos.findMany({
      include: {
        roles: {
          include: { rol: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ data: permisos });
  } catch (error) {
    console.error("[GET /api/permisos]", error);
    return NextResponse.json(
      { error: "No fue posible obtener los permisos." },
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
        { error: "El nombre del permiso es obligatorio." },
        { status: 400 }
      );
    }

    const permiso = await prisma.permisos.create({
      data: {
        nombre,
        descripcion,
      },
    });

    return NextResponse.json({ data: permiso }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/permisos]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe un permiso con ese nombre."
        : "No fue posible crear el permiso.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

