/*
  Warnings:

  - You are about to drop the column `creneauHoraire` on the `OffreMatch` table. All the data in the column will be lost.
  - You are about to drop the column `jour` on the `OffreMatch` table. All the data in the column will be lost.
  - Added the required column `debut` to the `OffreMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fin` to the `OffreMatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OffreMatch" DROP COLUMN "creneauHoraire",
DROP COLUMN "jour",
ADD COLUMN     "debut" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fin" TIMESTAMP(3) NOT NULL;
