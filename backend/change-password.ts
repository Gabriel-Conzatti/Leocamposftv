import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function changePassword() {
  const hash = await bcrypt.hash('admin123', 10);
  
  await prisma.usuario.update({
    where: { email: 'gabrielkreverconzatti@gmail.com' },
    data: { senha: hash }
  });
  
  console.log('Senha atualizada com sucesso para admin123!');
  await prisma.$disconnect();
}

changePassword();
