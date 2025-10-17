import { randomBytes, scryptSync } from "node:crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function GET() {
  try {
    const usuarios = await prisma.usuarios.findMany({
      include: {
        rol: true,
        departamento: {
          include: {
            region: {
              include: {
                pais: true,
              },
            },
          },
        },
        permisos: {
          include: {
            permiso: true,
            pais: true,
            region: {
              include: {
                pais: true,
              },
            },
            departamento: {
              include: {
                region: {
                  include: {
                    pais: true,
                  },
                },
              },
            },
          },
          orderBy: {
            permiso: {
              nombre: "asc",
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ data: usuarios });
  } catch (error) {
    console.error("[GET /api/usuarios]", error);
    return NextResponse.json(
      { error: "No fue posible obtener los usuarios." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const nombre = body?.nombre?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password;
    const roleId = Number(body?.roleId);
    const departamentoId = normalizeOptionalNumber(body?.departamentoId);
    const scopes = Array.isArray(body?.scopes) ? body.scopes : [];

    if (!nombre || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "Nombre, correo, contraseña y rol son obligatorios." },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const formattedScopes = scopes
      .map((scope) => {
        const permissionId = Number(scope?.permissionId);
        if (!permissionId || Number.isNaN(permissionId)) {
          return null;
        }

        const paisId = normalizeOptionalNumber(scope?.paisId);
        const regionId = normalizeOptionalNumber(scope?.regionId);
        const departamentoScopeId = normalizeOptionalNumber(
          scope?.departamentoId
        );

        return {
          permissionId,
          paisId,
          regionId,
          departamentoId: departamentoScopeId,
        };
      })
      .filter(Boolean);

    const usuario = await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuarios.create({
        data: {
          nombre,
          email,
          passwordHash: hashedPassword,
          id_rol: roleId,
          id_departamento: departamentoId,
        },
        include: {
          rol: true,
          departamento: {
            include: {
              region: {
                include: { pais: true },
              },
            },
          },
        },
      });

      if (formattedScopes.length > 0) {
        await tx.usuarioPermisos.createMany({
          data: formattedScopes.map((scope) => ({
            id_usuario: nuevoUsuario.id_usuario,
            id_permiso: scope.permissionId,
            id_pais: scope.paisId,
            id_region: scope.regionId,
            id_departamento: scope.departamentoId,
          })),
          skipDuplicates: true,
        });
      }

      return nuevoUsuario;
    });

    const usuarioConPermisos = await prisma.usuarios.findUnique({
      where: { id_usuario: usuario.id_usuario },
      include: {
        rol: true,
        departamento: {
          include: {
            region: {
              include: {
                pais: true,
              },
            },
          },
        },
        permisos: {
          include: {
            permiso: true,
            pais: true,
            region: {
              include: {
                pais: true,
              },
            },
            departamento: {
              include: {
                region: {
                  include: {
                    pais: true,
                  },
                },
              },
            },
          },
          orderBy: {
            permiso: {
              nombre: "asc",
            },
          },
        },
      },
    });

    return NextResponse.json({ data: usuarioConPermisos }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/usuarios]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe un usuario registrado con ese correo."
        : "No fue posible crear el usuario.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
