import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const roleId = Number(body?.roleId);
    const permissionId = Number(body?.permissionId);

    if (!roleId || !permissionId) {
      return NextResponse.json(
        { error: "Debe seleccionar un rol y un permiso." },
        { status: 400 }
      );
    }

    const exists = await prisma.rolPermisos.findUnique({
      where: {
        id_rol_id_permiso: {
          id_rol: roleId,
          id_permiso: permissionId,
        },
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "El rol ya tiene asignado ese permiso." },
        { status: 409 }
      );
    }

    await prisma.rolPermisos.create({
      data: {
        id_rol: roleId,
        id_permiso: permissionId,
      },
    });

    const roleWithPermissions = await prisma.roles.findUnique({
      where: { id_rol: roleId },
      include: {
        permisos: {
          include: { permiso: true },
        },
      },
    });

    return NextResponse.json({ data: roleWithPermissions }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/roles/asignar]", error);
    return NextResponse.json(
      { error: "No fue posible asignar el permiso al rol." },
      { status: 500 }
    );
  }
}

