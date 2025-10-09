import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_request, { params }) {
  try {
    const permisoId = Number(params?.id);

    if (!permisoId) {
      return NextResponse.json(
        { error: "Identificador de permiso inválido." },
        { status: 400 }
      );
    }

    const permiso = await prisma.permisos.findUnique({
      where: { id_permiso: permisoId },
      include: {
        roles: true,
      },
    });

    if (!permiso) {
      return NextResponse.json(
        { error: "El permiso no existe o ya fue eliminado." },
        { status: 404 }
      );
    }

    const [, deletedPermiso] = await prisma.$transaction([
      prisma.rolPermisos.deleteMany({
        where: { id_permiso: permisoId },
      }),
      prisma.permisos.delete({
        where: { id_permiso: permisoId },
      }),
    ]);

    return NextResponse.json({ data: deletedPermiso });
  } catch (error) {
    console.error("[DELETE /api/permisos/:id]", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el permiso." },
      { status: 500 }
    );
  }
}
