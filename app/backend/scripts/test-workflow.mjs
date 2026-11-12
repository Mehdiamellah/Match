// Test du workflow "je publie une offre → les autres la voient"
// Usage : node scripts/test-workflow.mjs            (cible http://localhost:3000)
//         BASE_URL=http://localhost:8080/api node scripts/test-workflow.mjs
// Comptes fournis par le seed : telephone 0600112XXX, mot de passe foot2026
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const MDP = 'foot2026';

let ok = 0, ko = 0;
const check = (nom, cond, detail = '') => {
  cond ? ok++ : ko++;
  console.log(`${cond ? '✅' : '❌'} ${nom}${cond ? '' : ` — ${detail}`}`);
};

const api = async (methode, chemin, { token, body } = {}) => {
  const r = await fetch(BASE + chemin, {
    method: methode,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r;
};

const login = async (telephone) => {
  const r = await api('POST', '/auth/login', { body: { telephone, motDePasse: MDP } });
  if (!r.ok) throw new Error(`login ${telephone} → HTTP ${r.status}`);
  return (await r.json()).token;
};

const liste = (token, params) =>
  api('GET', `/offres-match?${params}`, { token }).then((r) => r.json());

// créneau demain 19:00 → 21:00 (aucun conflit avec le seed : offK1 est à J+2)
const demain = (h) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};
const creneau = { debut: demain(19), fin: demain(21), format: 'CINQ_VS_CINQ', niveauPrefere: 'loisir' };

console.log(`\n🌐 Cible : ${BASE}\n`);

// ── 1. Yassine (Guéliz) réchauffe le cache de sa recherche ──────────
const yassine = await login('0600112233');
const avant = await liste(yassine, 'latitude=31.6362&longitude=-8.0089&rayon=20');
check('1. recherche initiale Yassine (avant publication)', Array.isArray(avant), `reçu: ${JSON.stringify(avant).slice(0, 120)}`);

// ── 2. Karim (Médina, ~2 km) publie une offre ────────────────────────
const karim = await login('0600112244');
const rCreer = await api('POST', '/offres-match', { token: karim, body: creneau });
let offre;
if (rCreer.status === 201) {
  offre = await rCreer.json();
  check('2. Karim crée une offre demain 19:00', !!offre.id, JSON.stringify(offre).slice(0, 120));
} else if (rCreer.status === 409) {
  // script déjà lancé une fois : on retrouve l'offre existante dans "mes offres"
  const moi = await api('GET', '/offres-match/moi', { token: karim }).then((r) => r.json());
  offre = moi.find((o) => o.debut === creneau.debut);
  check('2. offre déjà existante (rerun) retrouvée', !!offre, '409 mais introuvable dans /moi');
} else {
  check('2. création de l\'offre', false, `HTTP ${rCreer.status} ${await rCreer.text()}`);
}

if (!offre) {
  console.log(`\n🛑 arrêt — impossible de continuer sans l'offre de test`);
  process.exit(1);
}

// ── 3. LE test clé : Yassine la voit-elle juste après ? (invalidation cache Redis) ──
const apres = await liste(yassine, 'latitude=31.6362&longitude=-8.0089&rayon=20');
check(
  '3. l\'offre de Karim apparaît chez Yassine (cache bien invalidé)',
  apres.some((o) => o.id === offre.id),
  `offre ${offre.id} absente des ${Array.isArray(apres) ? apres.length : '?'} résultats`
);

// ── 4. Karim ne doit PAS voir sa propre offre dans Découvrir ────────
const vueKarim = await liste(karim, 'latitude=31.6269&longitude=-7.9911&rayon=20');
check(
  '4. Karim ne voit pas sa propre offre',
  !vueKarim.some((o) => o.id === offre.id),
  `présente parmi ${Array.isArray(vueKarim) ? vueKarim.length : '?'} résultats`
);

// ── 5. Le rayon filtre vraiment : rayon 5 km depuis Guéliz ──────────
//     Karim ~2 km (doit être là) · Salma ~9 km (doit être dehors)
const rayon5 = await liste(yassine, 'latitude=31.6362&longitude=-8.0089&rayon=5');
check('5a. rayon 5 : offre de Karim (~2 km) visible', rayon5.some((o) => o.id === offre.id));
check(
  '5b. rayon 5 : aucune offre de Salma (~9 km)',
  !rayon5.some((o) => o.createurNom === 'Salma'),
  'une offre Salma s\'est faufilée dans le rayon'
);

// ── 6. Règle métier : deux offres qui se chevauchent → 409 ──────────
const rConflit = await api('POST', '/offres-match', { token: karim, body: creneau });
check('6. doublon de créneau refusé (409)', rConflit.status === 409, `HTTP ${rConflit.status}`);

// ── 7. Sans token : Découvrir reste accessible (mode invité) ────────
const anon = await liste(undefined, 'latitude=31.6362&longitude=-8.0089&rayon=20');
check(
  '7. recherche anonyme OK et inclut l\'offre de Karim',
  Array.isArray(anon) && anon.some((o) => o.id === offre.id),
  `HTTP anormal ou offre absente`
);

// ── 8. Filtre format : 6v6 ne doit pas ramener l'offre 5v5 ──────────
const sixVsSix = await liste(yassine, 'latitude=31.6362&longitude=-8.0089&rayon=20&format=SIX_VS_SIX');
check('8. filtre format 6v6 exclut l\'offre 5v5', !sixVsSix.some((o) => o.id === offre.id));

console.log(`\n📊 Résultat : ${ok} OK · ${ko} échec(s)\n`);
process.exit(ko > 0 ? 1 : 0);
