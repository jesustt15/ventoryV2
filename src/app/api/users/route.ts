import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/database';

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newUser = await prisma.user.create({
      data: body,
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear user' }, { status: 500 });
  }
}
