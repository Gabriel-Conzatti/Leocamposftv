-- ================================================
-- SQL COMPLETO PARA MYSQL (HOSTINGER)
-- Executar no phpMyAdmin do banco u278435480_leocampostfvBD
-- ================================================

-- ================================================
-- PARTE 1: CRIAR TABELAS
-- ================================================

-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `senha` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_telefone_key`(`telefone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulas` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `professor_id` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `horario` VARCHAR(191) NOT NULL,
    `duracao` INTEGER NOT NULL,
    `local` VARCHAR(191) NOT NULL,
    `preco` DOUBLE NOT NULL,
    `vagas` INTEGER NOT NULL,
    `vagasDisponiveis` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'aberta',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inscricoes` (
    `id` VARCHAR(191) NOT NULL,
    `aluno_id` VARCHAR(191) NULL,
    `aula_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `nomeManual` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inscricoes_aluno_id_aula_id_key`(`aluno_id`, `aula_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presencas` (
    `id` VARCHAR(191) NOT NULL,
    `inscricao_id` VARCHAR(191) NOT NULL,
    `aula_id` VARCHAR(191) NOT NULL,
    `presente` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `presencas_inscricao_id_key`(`inscricao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos` (
    `id` VARCHAR(191) NOT NULL,
    `aluno_id` VARCHAR(191) NOT NULL,
    `inscricao_id` VARCHAR(191) NOT NULL,
    `valor` DOUBLE NOT NULL,
    `metodo` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `pixQrCode` VARCHAR(191) NULL,
    `pixCopyPaste` VARCHAR(191) NULL,
    `mercadoPagoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pagamentos_inscricao_id_key`(`inscricao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de controle do Prisma (necessária para migrations)
CREATE TABLE `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `aulas` ADD CONSTRAINT `aulas_professor_id_fkey` FOREIGN KEY (`professor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscricoes` ADD CONSTRAINT `inscricoes_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscricoes` ADD CONSTRAINT `inscricoes_aula_id_fkey` FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presencas` ADD CONSTRAINT `presencas_inscricao_id_fkey` FOREIGN KEY (`inscricao_id`) REFERENCES `inscricoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presencas` ADD CONSTRAINT `presencas_aula_id_fkey` FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_inscricao_id_fkey` FOREIGN KEY (`inscricao_id`) REFERENCES `inscricoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Inserir registro de migration (para o Prisma reconhecer)
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `started_at`, `applied_steps_count`)
VALUES (UUID(), 'manual_mysql_setup', NOW(), '20260305000000_init_mysql', NOW(), 1);

-- ================================================
-- PARTE 2: INSERIR DADOS MIGRADOS DO RENDER
-- ================================================

-- USUARIOS (21 registros)
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm2qskd90001pualstwcbmcn', 'joaostrelow1999@gmail.com', 'Joao Strelow', '5499651608', '$2b$10$IGJ81j0nllRxWLS8QjS1IuRqH/EP8oKUh2GYAXenIMWZERMq1GWB.', 0, '2026-02-26 03:45:56', '2026-02-26 03:45:56');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm2qrnn70000pualiik0hqr8', 'gabrielkreverconzatti@gmail.com', 'Gabriel Krever Conzatti', '51998813450', '$2b$10$OSHxDzEZUSemGJ/CcWTFiuSURpRJ9ESVCXBddlIe5yuL.zWNcJI0C', 1, '2026-02-26 03:45:14', '2026-02-26 03:50:51');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm4v70gw0002v0uuvwx1yy6l', 'gkreverconzatti@gmail.com', 'gabriel krever conzatti', '51998813440', '$2b$10$D5rA077HpBSg0RGH2pdUu.uGa.Gb/VbKYc/A9titApujhRb9nCGB6', 0, '2026-02-27 15:24:41', '2026-02-27 15:24:41');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm4veg29000dv0uuym9k05o2', 'leo1907campos@hotmail.com', 'Leo Campos', '51997555895', '$2b$10$XA/v10q3lfCLjpRcnwwIUurc9hGA29quWjt.uUYp9lWJL1oVZURx2', 1, '2026-02-27 15:30:28', '2026-02-27 15:34:55');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm4w1wvo0000zi4om97j0cnd', 'teste@teste.com', 'Usuario Teste', NULL, '$2b$10$AQ.5qmrQOjkvyo4ep07lpez0X7NXx65chYVOxF3WsreOJy6eAjfQ6', 0, '2026-02-27 15:48:43', '2026-02-27 15:48:43');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm4w2wxz0000xfctvjz2urtf', 'aaa@aaa.com', 'Jose', NULL, '$2b$10$OUnRld1svb9M2a4IilbvjOHMTMxgLXhPSQavrT4ivU9/.hBJ0jOR2', 0, '2026-02-27 15:49:29', '2026-02-27 15:49:29');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm50q0sv0000qn6tel4444ts', 'teste2@gmail.com', 'teste', '51999999999', '$2b$10$g/hZoc1MY1Idohm9HhaVQe.tpZ.gOY6njSOBX6HjfAIy3RocGuxeG', 0, '2026-02-27 17:59:26', '2026-02-27 17:59:26');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm9504e5000011209qg6k7jm', 'keyllafernandes18@gmail.com', 'Keila Fernandes ', '51997828674', '$2b$10$fH0nYeuI.opk33QSpNLlx.ZGzoVtgSjYAcSh5aDlSK1PxKQNBfPbG', 0, '2026-03-02 15:10:20', '2026-03-02 15:10:20');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm953irs00051120njb071b8', 'brunovf9@gmail.com', 'Bruno Freitas', '51999454503', '$2b$10$S00X6Ob4zCN6P4ezLU2xKefJGO0QEOCOfugTrPEl6GQO8kfKkSzfK', 0, '2026-03-02 15:12:59', '2026-03-02 15:12:59');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm953w750006112052my82ol', 'leonardavs962@gmail.com', 'leonarda vargas', '51994789874', '$2b$10$bCe4s/TgLPgShYB/eGmG9.EADWqf2WYJINGmJENB9EhiUv0gSszT.', 0, '2026-03-02 15:13:16', '2026-03-02 15:13:16');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm954gyl00071120gj2u73kh', 'isasrocha@rede.ulbra.br', 'Isadora Souza da Rocha ', '51997529002', '$2b$10$UWAAqOHKBhRa9q1MgLEYwuS9eWxHNweA0qrfk/UBRVRqNLQfd6xUe', 0, '2026-03-02 15:13:43', '2026-03-02 15:13:43');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm957lj600081120q4orqxtk', 'joaomiguelferreira51@gmail.com', 'Joao Miguel Ferreira De Almeida', '51999458644', '$2b$10$ob1a5sklVe0AcQmXR0MFquaVbEeSCBI6T751xj.VpRXj3IpsoPRBq', 0, '2026-03-02 15:16:09', '2026-03-02 15:16:09');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm96lrce0000105nl3jh1nwt', 'isabellasaccon267@gmail.com', 'Isabella Saccon', '51995721509', '$2b$10$.KyIyXiw9vkKxELeYo1lHOySEHoNH94veb8PxwR5E4muI29slmtdO', 0, '2026-03-02 15:55:09', '2026-03-02 15:55:09');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm977u010000g0xsftgyci2n', 'ar3210529@gmail.com', 'Alexia Cristina da Silva Rodrigues ', '51997968847', '$2b$10$EHlnU1Gq8DJnNOWdgQ43/Oosf96BE2zMAFqcIYckNrdmIm.wR2teS', 0, '2026-03-02 16:12:19', '2026-03-02 16:12:19');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm97ckav0001g0xs7fx4bgmw', 'lauanycampos2007@gmail.com', 'Lauany campos Teixeira ', '51998628746', '$2b$10$yBhLLu1n0jTZeiS0RGzcYOJZk812.qjDZasXx6/jcnSHf9rfxuRXG', 0, '2026-03-02 16:16:00', '2026-03-02 16:16:00');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmm9d4k7s0000enxwm6fqv7tm', 'renatacamposs2004@gmail.com', 'Renata Campos ', '51994098087', '$2b$10$tOstd87dWoL1axl6.dycueZRo2hKz1Fr3Jk.IMgH53H0ooQOmozna', 0, '2026-03-02 18:57:44', '2026-03-02 18:57:44');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmmaj8gip0000q761tw2ldu0w', 'millenafaleirodeazeredo@gmail.com', 'Millena faleiro de azeredo', '51982733978', '$2b$10$NobRNr2GnU2k6pI0yAaV5..7IO.SGtbWbPFn6xr.y9KdWxQKghOz.', 0, '2026-03-03 14:36:30', '2026-03-03 14:36:30');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmmam5l2i000010oeg5qmoq9t', 'santiagogabriela084@gmail.com', 'Gabriela Santiago Brandão ', '51997164404', '$2b$10$rxQ8FYgdeCX3krhWCQMyE.O.tcsDUW.cU0Qak4mVCkRQjBhYBeU5a', 0, '2026-03-03 15:58:15', '2026-03-03 15:58:15');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmmav23il0000p5viiwutwq12', 'eduardocr.1997@gmail.com', 'Eduardo Costa Rodrigues ', '51981457365', '$2b$10$DY7fstWrBc8tGNK6mHa4vOPLSTjF1gJSGvBvxLzcTfmyBoK3sDCEm', 0, '2026-03-03 20:07:29', '2026-03-03 20:07:29');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmmavuei30001p5vi1g5f767m', 'bolivarpacheco662@gmail.com', 'bolívar pereira pacheco', '51999182423', '$2b$10$b7cWDCH82St7Hd64/cGpUuR3YBZDUbfy90tl9NP2/DyaehSUaZyqi', 0, '2026-03-03 20:29:29', '2026-03-03 20:29:29');
INSERT INTO usuarios (id, email, nome, telefone, senha, isAdmin, createdAt, updatedAt) VALUES ('cmmb8yrf60000wku43ye129nk', 'mariaclara13milani@gmail.com', 'Maria Clara Milani ', '51995803227', '$2b$10$um/B2u9N8prRUhbDT6/54OKutbbIRwjS9a5KJiLSRq0pOuacsLOdG', 0, '2026-03-04 02:36:48', '2026-03-04 02:36:48');

-- AULAS (6 registros)
INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('cmm4vbp0w000av0uue1u8zpp2', 'Aula Quarta-Feira', NULL, 'cmm2qrnn70000pualiik0hqr8', '2026-03-04 03:00:00', '19:00', 60, 'Arena Society Triunfo', 25, 6, 6, 'aberta', '2026-02-27 15:28:19', '2026-02-27 15:28:19');
INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('cmmdheha80007333b2riioq5o', 'TURMA QUINTA', NULL, 'cmm4veg29000dv0uuym9k05o2', '2026-03-05 03:00:00', '19:00', 60, 'ARENA DO BABÃO', 25.9, 6, 6, 'aberta', '2026-03-05 16:08:30', '2026-03-05 16:08:30');
INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('cmm2qztkw0003pual06ret3dc', 'TESTE', NULL, 'cmm2qrnn70000pualiik0hqr8', '2026-02-25 03:00:00', '21:59', 60, 'teste', 0.01, 8, 9, 'aberta', '2026-02-26 03:51:35', '2026-02-27 16:08:21');
INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('cmm575su10001lqwvzytr87ul', 'teste', NULL, 'cmm2qrnn70000pualiik0hqr8', '2026-02-27 03:00:00', '16:00', 60, 'teste', 0.01, 8, 8, 'aberta', '2026-02-27 20:59:40', '2026-02-27 20:59:40');
INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('cmm4vay1j0008v0uupzpk75c5', 'Aula Terça-Feira', NULL, 'cmm2qrnn70000pualiik0hqr8', '2026-03-03 03:00:00', '19:00', 60, 'Arena Society Triunfo', 25, 6, 6, 'aberta', '2026-02-27 15:27:44', '2026-02-27 20:59:41');
INSERT INTO aulas (id, titulo, descricao, professor_id, data, horario, duracao, local, preco, vagas, vagasDisponiveis, status, createdAt, updatedAt) VALUES ('cmmdgytyl0001333b2gwn18cn', 'AULA SEXTA', NULL, 'cmm2qrnn70000pualiik0hqr8', '2026-03-06 03:00:00', '19:00', 60, 'Arena do Babão', 25.9, 6, 6, 'aberta', '2026-03-05 15:56:20', '2026-03-05 15:56:20');

-- INSCRICOES (12 registros)
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmm576rk40007lqwvoff3g7gn', NULL, 'cmm4vay1j0008v0uupzpk75c5', 'confirmada', 'Maria Clara', 'Marcou pelo WhatsApp', '2026-02-27 21:00:25', '2026-02-27 21:00:25');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmm5766pt0003lqwv196of8co', 'cmm4w1wvo0000zi4om97j0cnd', 'cmm575su10001lqwvzytr87ul', 'confirmada', NULL, NULL, '2026-02-27 20:59:58', '2026-02-27 21:01:07');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmm958797000a11209ncruaf1', 'cmm957lj600081120q4orqxtk', 'cmm4vay1j0008v0uupzpk75c5', 'confirmada', NULL, NULL, '2026-03-02 15:16:37', '2026-03-02 15:20:59');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmaj8mwe0002q761420f07vl', 'cmmaj8gip0000q761tw2ldu0w', 'cmm4vay1j0008v0uupzpk75c5', 'confirmada', NULL, NULL, '2026-03-03 14:36:38', '2026-03-03 14:37:31');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmajh5ze0006q761ndhccehk', 'cmm97ckav0001g0xs7fx4bgmw', 'cmm4vay1j0008v0uupzpk75c5', 'confirmada', NULL, NULL, '2026-03-03 14:43:16', '2026-03-03 14:45:49');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmawwdyd00011gokfc4702en', NULL, 'cmm4vay1j0008v0uupzpk75c5', 'confirmada', 'Miguel', 'Adicionado manualmente pelo admin', '2026-03-03 20:59:02', '2026-03-03 20:59:02');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmc3ldz30001100jozd8f1kg', NULL, 'cmm4vbp0w000av0uue1u8zpp2', 'confirmada', 'Lauany Campos', 'Marcou presencialmente.', '2026-03-04 16:54:12', '2026-03-04 16:54:12');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmc3zg5c0005100j5jky3625', NULL, 'cmm4vbp0w000av0uue1u8zpp2', 'confirmada', 'Alexia ', 'Marcou pelo WhatsApp', '2026-03-04 17:05:08', '2026-03-04 17:05:08');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmc41uc80007100jdsp6544p', NULL, 'cmm4vbp0w000av0uue1u8zpp2', 'confirmada', 'Keila Fernandes ', 'Marcou pelo WhatsApp.', '2026-03-04 17:07:00', '2026-03-04 17:07:00');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmceoz68000112vr2l4eowx7', NULL, 'cmm4vbp0w000av0uue1u8zpp2', 'confirmada', 'João Miguel', 'Marcou pelo WhatsApp', '2026-03-04 22:04:55', '2026-03-04 22:04:55');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmdh2q2m0003333bmkrqot5a', 'cmmaj8gip0000q761tw2ldu0w', 'cmmdgytyl0001333b2gwn18cn', 'confirmada', NULL, NULL, '2026-03-05 15:59:22', '2026-03-05 16:00:44');
INSERT INTO inscricoes (id, aluno_id, aula_id, status, nomeManual, observacao, createdAt, updatedAt) VALUES ('cmmdhfh1w0009333buelsfqhs', NULL, 'cmmdheha80007333b2riioq5o', 'confirmada', 'MILENA FALEIRO DE AZEREDO', 'Marcou direto com o Leo', '2026-03-05 16:09:17', '2026-03-05 16:09:17');

-- PAGAMENTOS (5 registros)
INSERT INTO pagamentos (id, aluno_id, inscricao_id, valor, metodo, status, pixQrCode, pixCopyPaste, mercadoPagoId, createdAt, updatedAt) VALUES ('cmmdh2q2u0005333b6jqi21ck', 'cmmaj8gip0000q761tw2ldu0w', 'cmmdh2q2m0003333bmkrqot5a', 25.9, 'mercado_pago', 'confirmado', NULL, NULL, '148225221199', '2026-03-05 15:59:22', '2026-03-05 16:00:44');
INSERT INTO pagamentos (id, aluno_id, inscricao_id, valor, metodo, status, pixQrCode, pixCopyPaste, mercadoPagoId, createdAt, updatedAt) VALUES ('cmm5766q00005lqwvo4tsesfk', 'cmm4w1wvo0000zi4om97j0cnd', 'cmm5766pt0003lqwv196of8co', 0.01, 'mercado_pago', 'confirmado', NULL, NULL, '148109234688', '2026-02-27 20:59:58', '2026-02-27 21:01:07');
INSERT INTO pagamentos (id, aluno_id, inscricao_id, valor, metodo, status, pixQrCode, pixCopyPaste, mercadoPagoId, createdAt, updatedAt) VALUES ('cmm95879c000c1120uucgfdd3', 'cmm957lj600081120q4orqxtk', 'cmm958797000a11209ncruaf1', 25, 'mercado_pago', 'confirmado', NULL, NULL, '148475924190', '2026-03-02 15:16:37', '2026-03-02 15:20:59');
INSERT INTO pagamentos (id, aluno_id, inscricao_id, valor, metodo, status, pixQrCode, pixCopyPaste, mercadoPagoId, createdAt, updatedAt) VALUES ('cmmaj8mwl0004q761lwa82rru', 'cmmaj8gip0000q761tw2ldu0w', 'cmmaj8mwe0002q761420f07vl', 25, 'mercado_pago', 'confirmado', NULL, NULL, '147914039059', '2026-03-03 14:36:38', '2026-03-03 14:37:31');
INSERT INTO pagamentos (id, aluno_id, inscricao_id, valor, metodo, status, pixQrCode, pixCopyPaste, mercadoPagoId, createdAt, updatedAt) VALUES ('cmmajh5zj0008q761v8knau2f', 'cmm97ckav0001g0xs7fx4bgmw', 'cmmajh5ze0006q761ndhccehk', 25, 'mercado_pago', 'confirmado', NULL, NULL, '147914295241', '2026-03-03 14:43:16', '2026-03-03 14:45:49');

-- ================================================
-- FIM DA MIGRAÇÃO
-- Total: 21 usuários, 6 aulas, 12 inscrições, 5 pagamentos
-- ================================================
