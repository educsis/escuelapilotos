import { randomBytes, scryptSync } from "node:crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

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

    const usuario = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        passwordHash: hashedPassword,
        id_rol: roleId,
      },
      include: {
        rol: true,
      },
    });

    return NextResponse.json({ data: usuario }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/usuarios]", error);
    const message =
      error.code === "P2002"
        ? "Ya existe un usuario registrado con ese correo."
        : "No fue posible crear el usuario.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

