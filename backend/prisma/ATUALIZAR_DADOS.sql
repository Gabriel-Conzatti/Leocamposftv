-- ================================================
-- SQL PARA ATUALIZAR DADOS NOVOS (executar no phpMyAdmin)
-- Data: 05/03/2026
-- ================================================

-- NOVO USUARIO (+1)
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmmdi7fqn000e333bnpqcecst', 'matheusdallabrida2004@gmail.com', 'Matheus Dallabrida ', '51995125232', '$2b$10$rXoGRiZ.jnZr.cXd4js1KOFVf3X8RlE4mYmRnLToE3haYyKwkv1ta', 0, '2026-03-05 16:31:01', '2026-03-05 16:31:01');

-- NOVAS INSCRICOES (+3)
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmdhys84000b333bu1xlcc67', NULL, 'cmmdheha80007333b2riioq5o', 'confirmada', 'LEONARDA', 'Marcou pelo WhatsApp', '2026-03-05 16:24:18', '2026-03-05 16:24:18');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmdhz143000d333b3eo7m05x', NULL, 'cmmdheha80007333b2riioq5o', 'confirmada', 'RENATA ', 'Marcou pelo WhatsApp', '2026-03-05 16:24:29', '2026-03-05 16:24:29');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmdidetn000k333bp603cznx', NULL, 'cmmdheha80007333b2riioq5o', 'confirmada', 'MATHEUS DALLABRIDA', 'Marcou pelo Instagram', '2026-03-05 16:35:40', '2026-03-05 16:35:40');

-- ================================================
-- Total: +1 usuário, +3 inscrições
-- ================================================
