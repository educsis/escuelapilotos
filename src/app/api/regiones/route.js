import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const paisId = Number(params.get("paisId"));

    const regiones = await prisma.regiones.findMany({
      where: paisId ? { id_pais: paisId } : undefined,
      include: {
        departamentos: {
          orderBy: { nombre: "asc" },
        },
        pais: true,
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ data: regiones });
  } catch (error) {
    console.error("[GET /api/regiones]", error);
    return NextResponse.json(
      { error: "No fue posible obtener las regiones." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nombre = body?.nombre?.trim();
    const paisId = Number(body?.paisId);

    if (!nombre || !paisId) {
      return NextResponse.json(
        { error: "Nombre de la región y país son obligatorios." },
        { status: 400 }
      );
    }

    const region = await prisma.regiones.create({
      data: {
        nombre,
        id_pais: paisId,
      },
    });

    return NextResponse.json({ data: region }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/regiones]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe una región con ese nombre."
        : "No fue posible registrar la región.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

