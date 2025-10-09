import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_request, { params }) {
  try {
    const userId = Number(params?.id);

    if (!userId) {
      return NextResponse.json(
        { error: "Identificador de usuario inválido." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: userId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "El usuario no existe o ya fue eliminado." },
        { status: 404 }
      );
    }

    await prisma.usuarios.delete({
      where: { id_usuario: userId },
    });

    return NextResponse.json({ data: { id: userId } });
  } catch (error) {
    console.error("[DELETE /api/usuarios/:id]", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el usuario." },
      { status: 500 }
    );
  }
}

