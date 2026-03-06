import { PrismaClient, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const gerencias = [
    { nombre: 'Gerencia General' },
    { nombre: 'Gerencia Forestal e Institucional' },
    { nombre: 'Gerencia Operaciones Industriales y Sum.' },
    { nombre: 'Gcia. de Personas,Cultura y Comunicación' },
    { nombre: 'Gerencia de Administracion y Finanzas' },
    { nombre: 'Gerencia SMS y PCP' },
    { nombre: 'Gerencia de Ventas Nacionales y Mercadeo' },
    { nombre: 'Gerencia Legal' },
];

const users = [
    { username: 'adminti', password: 'maveit2013', role: Role.admin },
    { username: 'monitor', password: 'Masisa,.2025', role: Role.user },
];

async function seedUsers(prisma: PrismaClient) {
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { username: user.username },
            update: {
                password: hashedPassword,
                role: user.role,
            },
            create: {
                username: user.username,
                password: hashedPassword,
                role: user.role,
            },
        });
    }
}

const prisma = new PrismaClient();

async function main() {
    for (const gerencia of gerencias) {
        await prisma.gerencia.upsert({
            where: {
                nombre: gerencia.nombre,
            },
            update: {},
            create: gerencia,
        });
    }

    await seedUsers(prisma);

    console.log('Gerencias y usuarios insertados correctamente');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
