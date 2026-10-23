/*
  Warnings:

  - Added the required column `motDePasse` to the `Utilisateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "motDePasse" TEXT NOT NULL;
