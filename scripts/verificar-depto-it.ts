// Script para verificar el nombre exacto del departamento de IT
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deptos = await prisma.departamento.findMany({
        where: {
            nombre: {
                contains: 'IT',
            },
        },
    });

    console.log('Departamentos que contienen "IT":');
    deptos.forEach(d => {
        console.log(`- "${d.nombre}" (ID: ${d.id})`);
    });

    if (deptos.length === 0) {
        console.log('No se encontró ningún departamento con "IT" en el nombre');

        // Buscar variaciones
        const variaciones = await prisma.departamento.findMany({
            where: {
                OR: [
                    { nombre: { contains: 'Comunicaciones' } },
                    { nombre: { contains: 'Tecnologia' } },
                ],
            },
        });

        console.log('\nDepartamentos relacionados con IT/Comunicaciones:');
        variaciones.forEach(d => {
            console.log(`- "${d.nombre}" (ID: ${d.id})`);
        });
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
