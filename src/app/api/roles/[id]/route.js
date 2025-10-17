import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const roleId = Number(id);

    if (!roleId) {
      return NextResponse.json(
        { error: "Identificador de rol inválido." },
        { status: 400 }
      );
    }

    const role = await prisma.roles.findUnique({
      where: { id_rol: roleId },
      include: {
        permisos: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "El rol no existe o ya fue eliminado." },
        { status: 404 }
      );
    }

    if (role.permisos.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el rol porque tiene permisos asignados. Retira los permisos primero.",
        },
        { status: 409 }
      );
    }

    await prisma.roles.delete({
      where: { id_rol: roleId },
    });

    return NextResponse.json({ data: { id: roleId } });
  } catch (error) {
    console.error("[DELETE /api/roles/:id]", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el rol." },
      { status: 500 }
    );
  }
}

