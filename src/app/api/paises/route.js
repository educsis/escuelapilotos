import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const paises = await prisma.paises.findMany({
      include: {
        regiones: {
          include: {
            departamentos: {
              orderBy: { nombre: "asc" },
            },
          },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ data: paises });
  } catch (error) {
    console.error("[GET /api/paises]", error);
    return NextResponse.json(
      { error: "No fue posible obtener la lista de países." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nombre = body?.nombre?.trim();

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del país es obligatorio." },
        { status: 400 }
      );
    }

    const pais = await prisma.paises.create({
      data: {
        nombre,
      },
    });

    return NextResponse.json({ data: pais }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/paises]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe un país con ese nombre."
        : "No fue posible registrar el país.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

