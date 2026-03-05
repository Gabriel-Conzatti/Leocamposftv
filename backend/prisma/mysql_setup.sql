-- SQL para criar as tabelas no MySQL da Hostinger
-- Execute este arquivo no phpMyAdmin

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
