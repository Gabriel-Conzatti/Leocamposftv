const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://futevolei_user:tTULMY4xnRFGz5RD4HLUnEftMBEs4KiL@dpg-d6fp2mjuibrs7398j1h0-a.oregon-postgres.render.com/futevolei',
  ssl: { rejectUnauthorized: false }
});

async function exportData() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL do Render!\n');

    // Exportar usuarios
    const usuarios = await client.query('SELECT * FROM usuarios');
    console.log(`📦 Usuarios encontrados: ${usuarios.rows.length}`);
    
    // Exportar aulas
    const aulas = await client.query('SELECT * FROM aulas');
    console.log(`📦 Aulas encontradas: ${aulas.rows.length}`);
    
    // Exportar inscricoes
    const inscricoes = await client.query('SELECT * FROM inscricoes');
    console.log(`📦 Inscrições encontradas: ${inscricoes.rows.length}`);
    
    // Exportar presencas
    const presencas = await client.query('SELECT * FROM presencas');
    console.log(`📦 Presenças encontradas: ${presencas.rows.length}`);
    
    // Exportar pagamentos
    const pagamentos = await client.query('SELECT * FROM pagamentos');
    console.log(`📦 Pagamentos encontrados: ${pagamentos.rows.length}`);

    console.log('\n--- GERANDO SQL PARA MYSQL ---\n');

    // Gerar INSERT para usuarios
    if (usuarios.rows.length > 0) {
      console.log('-- USUARIOS');
      for (const u of usuarios.rows) {
        const telefone = u.telefone ? `'${u.telefone}'` : 'NULL';
        const sql = `INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('${u.id}', '${u.email}', '${u.nome.replace(/'/g, "''")}', ${telefone}, '${u.senha}', ${u.isAdmin ? 1 : 0}, '${u.createdAt.toISOString().slice(0, 19).replace('T', ' ')}', '${u.updatedAt.toISOString().slice(0, 19).replace('T', ' ')}');`;
        console.log(sql);
      }
      console.log('');
    }

    // Gerar INSERT para aulas
    if (aulas.rows.length > 0) {
      console.log('-- AULAS');
      for (const a of aulas.rows) {
        const descricao = a.descricao ? `'${a.descricao.replace(/'/g, "''")}'` : 'NULL';
        const sql = `INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('${a.id}', '${a.titulo.replace(/'/g, "''")}', ${descricao}, '${a.professor_id}', '${a.data.toISOString().slice(0, 19).replace('T', ' ')}', '${a.horario}', ${a.duracao}, '${a.local.replace(/'/g, "''")}', ${a.preco}, ${a.vagas}, ${a.vagasDisponiveis}, '${a.status}', '${a.createdAt.toISOString().slice(0, 19).replace('T', ' ')}', '${a.updatedAt.toISOString().slice(0, 19).replace('T', ' ')}');`;
        console.log(sql);
      }
      console.log('');
    }

    // Gerar INSERT para inscricoes
    if (inscricoes.rows.length > 0) {
      console.log('-- INSCRICOES');
      for (const i of inscricoes.rows) {
        const alunoId = i.aluno_id ? `'${i.aluno_id}'` : 'NULL';
        const nomeManual = i.nomeManual ? `'${i.nomeManual.replace(/'/g, "''")}'` : 'NULL';
        const observacao = i.observacao ? `'${i.observacao.replace(/'/g, "''")}'` : 'NULL';
        const sql = `INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('${i.id}', ${alunoId}, '${i.aula_id}', '${i.status}', ${nomeManual}, ${observacao}, '${i.createdAt.toISOString().slice(0, 19).replace('T', ' ')}', '${i.updatedAt.toISOString().slice(0, 19).replace('T', ' ')}');`;
        console.log(sql);
      }
      console.log('');
    }

    // Gerar INSERT para presencas
    if (presencas.rows.length > 0) {
      console.log('-- PRESENCAS');
      for (const p of presencas.rows) {
        const sql = `INSERT INTO presencas (id, inscricao_id, aula_id, presente, createdAt, updatedAt) VALUES ('${p.id}', '${p.inscricao_id}', '${p.aula_id}', ${p.presente ? 1 : 0}, '${p.createdAt.toISOString().slice(0, 19).replace('T', ' ')}', '${p.updatedAt.toISOString().slice(0, 19).replace('T', ' ')}');`;
        console.log(sql);
      }
      console.log('');
    }

    // Gerar INSERT para pagamentos
    if (pagamentos.rows.length > 0) {
      console.log('-- PAGAMENTOS');
      for (const p of pagamentos.rows) {
        const pixQrCode = p.pixQrCode ? `'${p.pixQrCode}'` : 'NULL';
        const pixCopyPaste = p.pixCopyPaste ? `'${p.pixCopyPaste}'` : 'NULL';
        const mercadoPagoId = p.mercadoPagoId ? `'${p.mercadoPagoId}'` : 'NULL';
        const sql = `INSERT INTO pagamentos (id, aluno_id, inscricao_id, valor, metodo, status, pixQrCode, pixCopyPaste, mercadoPagoId, createdAt, updatedAt) VALUES ('${p.id}', '${p.aluno_id}', '${p.inscricao_id}', ${p.valor}, '${p.metodo}', '${p.status}', ${pixQrCode}, ${pixCopyPaste}, ${mercadoPagoId}, '${p.createdAt.toISOString().slice(0, 19).replace('T', ' ')}', '${p.updatedAt.toISOString().slice(0, 19).replace('T', ' ')}');`;
        console.log(sql);
      }
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

exportData();
