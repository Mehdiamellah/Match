import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
process.env.DATABASE_URL = env.match(/DATABASE_URL="?([^"\n]+)"?/)[1];
const prisma = new PrismaClient();

const main = async () => {
  for (const tel of ['0600112233', '0600112244', '0600112255']) {
    const u = await prisma.utilisateur.findUnique({ where: { telephone: tel } });
    const offres = await prisma.offreMatch.findMany({ where: { createurId: u.id }, orderBy: { debut: 'asc' } });
    console.log(`— ${u.nom} —`);
    for (const o of offres) console.log(' ', o.id.slice(0, 8), '|', o.debut.toISOString(), '→', o.fin.toISOString(), '|', o.statut);
  }
  await prisma.$disconnect();
};
main();
