// purge totale : supprime TOUTES les offres et TOUS les intérêts (comptes conservés)
// sur les deux bases (compose 5433 + local 5432)
import { PrismaClient } from '@prisma/client';

const bases = [
  { nom: 'compose (:5433)', url: 'postgresql://postgresql:macth77@localhost:5433/foot_matchmaking' },
  { nom: 'local  (:5432)', url: 'postgresql://postgres:lwalida77@localhost:5432/foot_matchmaking' },
];

for (const b of bases) {
  const p = new PrismaClient({ datasources: { db: { url: b.url } } });
  const interets = await p.interet.deleteMany();
  const offres = await p.offreMatch.deleteMany();
  console.log(`${b.nom} → ${interets.count} intérêt(s) et ${offres.count} offre(s) supprimés · comptes conservés`);
  await p.$disconnect();
}
