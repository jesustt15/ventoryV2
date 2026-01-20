// Script para crear un usuario de autenticación
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Creando usuario de autenticación...');

    // Datos del usuario
    const username = 'admin';
    const plainPassword = 'admin123'; // Cambia esto por la contraseña que quieras
    const role = 'admin'; // 'admin' o 'user'

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Crear o actualizar el usuario
    const user = await prisma.user.upsert({
        where: { username },
        update: {
            password: hashedPassword,
            role: role as 'admin' | 'user',
        },
        create: {
            username,
            password: hashedPassword,
            role: role as 'admin' | 'user',
        },
    });

    console.log('✅ Usuario creado/actualizado exitosamente:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password (plain): ${plainPassword}`);
    console.log(`\n🔑 Puedes usar estas credenciales para iniciar sesión:`);
    console.log(`   Usuario: ${username}`);
    console.log(`   Contraseña: ${plainPassword}`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
