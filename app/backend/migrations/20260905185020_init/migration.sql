-- CreateEnum
CREATE TYPE "Format" AS ENUM ('CINQ_VS_CINQ', 'SIX_VS_SIX');

-- CreateEnum
CREATE TYPE "StatutOffre" AS ENUM ('OUVERTE', 'MATCHEE');

-- CreateEnum
CREATE TYPE "StatutInteret" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'REFUSE');

-- CreateEnum
CREATE TYPE "Resultat" AS ENUM ('VICTOIRE_CREATEUR', 'VICTOIRE_INTERESSE', 'NUL');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "photo" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffreMatch" (
    "id" TEXT NOT NULL,
    "jour" TIMESTAMP(3) NOT NULL,
    "creneauHoraire" TEXT NOT NULL,
    "format" "Format" NOT NULL,
    "niveauPrefere" TEXT,
    "statut" "StatutOffre" NOT NULL DEFAULT 'OUVERTE',
    "resultat" "Resultat",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createurId" TEXT NOT NULL,

    CONSTRAINT "OffreMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interet" (
    "id" TEXT NOT NULL,
    "statut" "StatutInteret" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateurId" TEXT NOT NULL,
    "offreMatchId" TEXT NOT NULL,

    CONSTRAINT "Interet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_telephone_key" ON "Utilisateur"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Interet_utilisateurId_offreMatchId_key" ON "Interet"("utilisateurId", "offreMatchId");

-- AddForeignKey
ALTER TABLE "OffreMatch" ADD CONSTRAINT "OffreMatch_createurId_fkey" FOREIGN KEY ("createurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interet" ADD CONSTRAINT "Interet_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interet" ADD CONSTRAINT "Interet_offreMatchId_fkey" FOREIGN KEY ("offreMatchId") REFERENCES "OffreMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
