import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/database';

interface Params {
  id: string;
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const task = await prisma.task.update({
      where: {
        id: id,
      },
      data: body,
    });

    return NextResponse.json({ message: 'PUT Task', task }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error updating task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;

    await prisma.task.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'DELETE Task' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error deleting task' }, { status: 500 });
  }
}
