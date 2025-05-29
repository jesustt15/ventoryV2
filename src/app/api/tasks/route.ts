import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/database';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany();
    console.log('tasks:',tasks);
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = await prisma.task.create({
      data: body,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating task' }, { status: 500 });
  }
}
