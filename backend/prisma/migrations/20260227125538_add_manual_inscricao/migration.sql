-- AlterTable
ALTER TABLE "inscricoes" ADD COLUMN     "nomeManual" TEXT,
ADD COLUMN     "observacao" TEXT,
ALTER COLUMN "aluno_id" DROP NOT NULL;
