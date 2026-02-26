import prisma from './prisma.js';
import { hashSenha } from '../utils/bcrypt.js';

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Deletar dados existentes
  await prisma.pagamento.deleteMany({});
  await prisma.presenca.deleteMany({});
  await prisma.inscricao.deleteMany({});
  await prisma.aula.deleteMany({});
  await prisma.usuario.deleteMany({});

  // Hash da senha de teste
  const senhaHash = await hashSenha('qualquer_senha');

  // Criar usuários
  const professor1 = await prisma.usuario.create({
    data: {
      email: 'leo@futevolei.com',
      nome: 'Léo Professor',
      senha: senhaHash,
    },
  });

  const professor2 = await prisma.usuario.create({
    data: {
      email: 'carlos@futevolei.com',
      nome: 'Carlos Professor',
      senha: senhaHash,
    },
  });

  const aluno1 = await prisma.usuario.create({
    data: {
      email: 'joao@example.com',
      nome: 'João Silva',
      senha: senhaHash,
    },
  });

  const aluno2 = await prisma.usuario.create({
    data: {
      email: 'maria@example.com',
      nome: 'Maria Santos',
      senha: senhaHash,
    },
  });

  const aluno3 = await prisma.usuario.create({
    data: {
      email: 'pedro@example.com',
      nome: 'Pedro Costa',
      senha: senhaHash,
    },
  });

  // Criar aulas
  const aula1 = await prisma.aula.create({
    data: {
      titulo: 'Futevolei Intermediário',
      descricao: 'Aula para quem já sabe o básico',
      professor_id: professor1.id,
      data: new Date('2026-02-05T19:00:00'),
      horario: '19:00',
      duracao: 60,
      local: 'Quadra Central',
      preco: 45.0,
      vagas: 10,
      vagasDisponiveis: 7,
      status: 'aberta',
    },
  });

  const aula2 = await prisma.aula.create({
    data: {
      titulo: 'Futevolei Avançado',
      descricao: 'Para jogadores experientes',
      professor_id: professor1.id,
      data: new Date('2026-02-06T20:00:00'),
      horario: '20:00',
      duracao: 90,
      local: 'Quadra Central',
      preco: 55.0,
      vagas: 8,
      vagasDisponiveis: 3,
      status: 'aberta',
    },
  });

  const aula3 = await prisma.aula.create({
    data: {
      titulo: 'Futevolei Básico',
      descricao: 'Para iniciantes',
      professor_id: professor2.id,
      data: new Date('2026-02-07T18:00:00'),
      horario: '18:00',
      duracao: 60,
      local: 'Quadra Norte',
      preco: 35.0,
      vagas: 15,
      vagasDisponiveis: 15,
      status: 'aberta',
    },
  });

  // Criar inscrições
  const inscricao1 = await prisma.inscricao.create({
    data: {
      aluno_id: aluno1.id,
      aula_id: aula1.id,
      status: 'confirmada',
    },
  });

  const inscricao2 = await prisma.inscricao.create({
    data: {
      aluno_id: aluno2.id,
      aula_id: aula1.id,
      status: 'confirmada',
    },
  });

  const inscricao3 = await prisma.inscricao.create({
    data: {
      aluno_id: aluno3.id,
      aula_id: aula2.id,
      status: 'confirmada',
    },
  });

  // Criar pagamentos
  await prisma.pagamento.create({
    data: {
      aluno_id: aluno1.id,
      inscricao_id: inscricao1.id,
      valor: 45.0,
      metodo: 'pix',
      status: 'confirmado',
      pixQrCode: 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6e',
      pixCopyPaste: '00020126580014br.gov.bcb.brcode01051.0.063047d6c90',
    },
  });

  await prisma.pagamento.create({
    data: {
      aluno_id: aluno2.id,
      inscricao_id: inscricao2.id,
      valor: 45.0,
      metodo: 'pix',
      status: 'pendente',
    },
  });

  await prisma.pagamento.create({
    data: {
      aluno_id: aluno3.id,
      inscricao_id: inscricao3.id,
      valor: 55.0,
      metodo: 'cartao',
      status: 'confirmado',
    },
  });

  // Criar presenças
  await prisma.presenca.create({
    data: {
      inscricao_id: inscricao1.id,
      aula_id: aula1.id,
      presente: true,
    },
  });

  console.log('✅ Seed concluído com sucesso!\n');
  console.log('📊 Dados criados:');
  console.log(`   - 2 Professores`);
  console.log(`   - 3 Alunos`);
  console.log(`   - 3 Aulas`);
  console.log(`   - 3 Inscrições`);
  console.log(`   - 3 Pagamentos`);
  console.log(`   - 1 Presença\n`);
  console.log('🧪 Você pode fazer login com:');
  console.log('   Email: leo@futevolei.com');
  console.log('   Senha: qualquer_senha\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
