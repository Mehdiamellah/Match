// Seed de démonstration — `npx prisma db seed` (ou `npm run seed`)
// ⚠️ Destructif en dev : efface puis recrée tout (intérêts, offres, utilisateurs).
// Contenu : 5 joueurs autour de Marrakech, offres ouvertes à venir, des demandes
// en attente, un match confirmé non noté, et un historique avec résultat (stats).
import { PrismaClient, StatutInteret, StatutOffre, Resultat, Format } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const MDP = 'foot2026';

/** Créneau du jour offset : debut = date+jours à hh:mm, fin = debut + durée (min). */
const creneau = (jours: number, hhmm: string, duree = 90) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + jours);
  d.setHours(h, m, 0, 0);
  return { debut: d, fin: new Date(d.getTime() + duree * 60_000) };
};

async function main() {
  const motDePasse = await bcrypt.hash(MDP, 10);

  await prisma.interet.deleteMany();
  await prisma.offreMatch.deleteMany();
  await prisma.utilisateur.deleteMany();

  // 5 joueurs, positions réalistes autour de Marrakech (km réels entre eux)
  const yassine = await prisma.utilisateur.create({
    data: { nom: 'Yassine', telephone: '0600112233', motDePasse, photo: null, latitude: 31.6362, longitude: -8.0089 },
  }); // Guéliz
  const karim = await prisma.utilisateur.create({
    data: { nom: 'Karim', telephone: '0600112244', motDePasse, photo: null, latitude: 31.6269, longitude: -7.9911 },
  }); // Médina ~ 2 km de Yassine
  const ahmed = await prisma.utilisateur.create({
    data: { nom: 'Ahmed', telephone: '0600112255', motDePasse, photo: null, latitude: 31.6019, longitude: -7.9906 },
  }); // Agdal ~ 4 km
  const salma = await prisma.utilisateur.create({
    data: { nom: 'Salma', telephone: '0600112266', motDePasse, photo: null, latitude: 31.5965, longitude: -7.9293 },
  }); // Mhamid ~ 7 km
  const omar = await prisma.utilisateur.create({
    data: { nom: 'Omar', telephone: '0600112277', motDePasse, photo: null, latitude: 31.674, longitude: -8.045 },
  }); // Sidi Ghanem ~ 6 km

  // ── Offres ouvertes à venir (= ce que Découvrir affiche) ──────────
  const offY1 = await prisma.offreMatch.create({
    data: { ...creneau(1, '19:00'), format: Format.CINQ_VS_CINQ, niveauPrefere: 'intermediaire', createurId: yassine.id },
  });
  const offY2 = await prisma.offreMatch.create({
    data: { ...creneau(3, '18:30'), format: Format.SIX_VS_SIX, niveauPrefere: null, createurId: yassine.id },
  });
  const offK1 = await prisma.offreMatch.create({
    data: { ...creneau(2, '21:00'), format: Format.CINQ_VS_CINQ, niveauPrefere: 'loisir', createurId: karim.id },
  });
  const offS1 = await prisma.offreMatch.create({
    data: { ...creneau(5, '18:00'), format: Format.SIX_VS_SIX, niveauPrefere: null, createurId: salma.id },
  });

  // ── Demandes en attente (ce que « Voir les demandes » déroule) ────
  for (const [j, o] of [[karim, offY1], [ahmed, offY1], [omar, offY2], [omar, offS1]] as const) {
    await prisma.interet.create({
      data: { utilisateurId: j.id, offreMatchId: o.id, statut: StatutInteret.EN_ATTENTE, dateDemande: new Date(Date.now() - 3600_000) },
    });
  }

  // ── Match confirmé, pas encore joué (briques « Adversaire confirmé » + après-match) ──
  const offM1 = await prisma.offreMatch.create({
    data: { ...creneau(4, '19:30'), format: Format.CINQ_VS_CINQ, statut: StatutOffre.MATCHEE, resultat: null, createurId: ahmed.id },
  });
  await prisma.interet.create({
    data: { utilisateurId: karim.id, offreMatchId: offM1.id, statut: StatutInteret.CONFIRME, dateDemande: new Date(Date.now() - 86_400_000) },
  });

  // ── Historique noté (= stats V/N/D du profil) ─────────────────────
  const offP1 = await prisma.offreMatch.create({
    data: { ...creneau(-7, '19:00'), format: Format.CINQ_VS_CINQ, statut: StatutOffre.MATCHEE, resultat: Resultat.VICTOIRE_CREATEUR, createurId: yassine.id },
  });
  await prisma.interet.create({
    data: { utilisateurId: omar.id, offreMatchId: offP1.id, statut: StatutInteret.CONFIRME, dateDemande: new Date(Date.now() - 8 * 86_400_000) },
  });
  // Un nul pour Salma le jour réel suivant
  const offP2 = await prisma.offreMatch.create({
    data: { ...creneau(-3, '18:00'), format: Format.SIX_VS_SIX, statut: StatutOffre.MATCHEE, resultat: Resultat.NUL, createurId: salma.id },
  });
  await prisma.interet.create({
    data: { utilisateurId: ahmed.id, offreMatchId: offP2.id, statut: StatutInteret.CONFIRME, dateDemande: new Date(Date.now() - 4 * 86_400_000) },
  });

  console.log('✅ Seed OK — mot de passe de tous les comptes :', MDP);
  console.log('   5 joueurs (Yassine, Karim, Ahmed, Salma, Omar) · 4 ouvertes · 4 demandes · 1 confirmé · 1 match en attente · 2 matchs notés');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
