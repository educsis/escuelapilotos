import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const regionId = Number(params.get("regionId"));

    const departamentos = await prisma.departamentos.findMany({
      where: regionId ? { id_region: regionId } : undefined,
      include: {
        region: {
          include: {
            pais: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ data: departamentos });
  } catch (error) {
    console.error("[GET /api/departamentos]", error);
    return NextResponse.json(
      { error: "No fue posible obtener los departamentos." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nombre = body?.nombre?.trim();
    const regionId = Number(body?.regionId);

    if (!nombre || !regionId) {
      return NextResponse.json(
        { error: "Nombre del departamento y región son obligatorios." },
        { status: 400 }
      );
    }

    const departamento = await prisma.departamentos.create({
      data: {
        nombre,
        id_region: regionId,
      },
    });

    return NextResponse.json({ data: departamento }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/departamentos]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe un departamento con ese nombre."
        : "No fue posible registrar el departamento.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

