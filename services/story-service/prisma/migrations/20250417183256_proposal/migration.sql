-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('PROPOSAL', 'VOTING');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "currentPhase" "Phase" NOT NULL DEFAULT 'PROPOSAL';
