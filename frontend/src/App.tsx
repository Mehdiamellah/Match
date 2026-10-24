import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

// À ADAPTER : valeurs de ton enum Prisma "Format".
const FORMATS = ['FUTSAL', 'FOOT_7', 'FOOT_11'];
const MARRAKECH = { lat: 31.6295, lon: -7.9811 };

type Offre = {
  id: string; debut: string; fin: string; format: string; niveauPrefere?: string; statut: string;
  createurNom?: string; distance_km?: number; _count?: { interets: number };
};

const jour = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const heure = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function Carte({ o, action }: { o: Offre; action?: React.ReactNode }) {
  return (
    <article className="carte">
      <div className="heure"><strong>{heure(o.debut)}</strong><span>{jour(o.debut)}</span></div>
      <div className="detail">
        <h3>{o.format.replace('_', ' ')}</h3>
        <p className="meta">
          {o.niveauPrefere ? `Niveau ${o.niveauPrefere}` : 'Tous niveaux'} · jusqu'à {heure(o.fin)}
          {o.createurNom ? ` · ${o.createurNom}` : ''}
        </p>
        <div className="pied">
          {o.distance_km !== undefined && <span>{o.distance_km.toFixed(1)} km</span>}
          {o._count && <span className="pastille gris">{o._count.interets} intéressé(s)</span>}
          {o.statut !== 'OUVERTE' && <span className="pastille">{o.statut.toLowerCase()}</span>}
          {action}
        </div>
      </div>
    </article>
  );
}

function Connexion({ onOk }: { onOk: () => void }) {
  const [tel, setTel] = useState('');
  const [mdp, setMdp] = useState('');
  const [err, setErr] = useState('');
  const envoyer = async () => {
    try {
      const r = await api.login(tel, mdp);
      setToken(r.token);
      onOk();
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); envoyer(); }}>
      <h2>Connexion</h2>
      {err && <p className="erreur">{err}</p>}
      <label>Téléphone<input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" /></label>
      <label>Mot de passe<input type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} /></label>
      <button className="btn vert">Se connecter</button>
    </form>
  );
}

function Decouvrir({ connecte, demanderConnexion }: { connecte: boolean; demanderConnexion: () => void }) {
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [format, setFormat] = useState('');
  const [err, setErr] = useState('');
  const [faits, setFaits] = useState<string[]>([]);

  useEffect(() => {
    setOffres(null);
    const chercher = (lat: number, lon: number) =>
      api.search(lat, lon, format || undefined).then(setOffres).catch((e) => setErr(e.message));
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition((p) => chercher(p.coords.latitude, p.coords.longitude),
          () => chercher(MARRAKECH.lat, MARRAKECH.lon))
      : chercher(MARRAKECH.lat, MARRAKECH.lon);
  }, [format]);

  const interesse = async (id: string) => {
    if (!connecte) return demanderConnexion();
    try { await api.interet(id); setFaits((f) => [...f, id]); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <>
      <label>Format
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="">Tous les formats</option>
          {FORMATS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </label>
      {err && <p className="erreur">{err}</p>}
      {offres === null && !err && <p className="vide">Recherche des matchs autour de toi…</p>}
      {offres?.length === 0 && <p className="vide">Aucun match dans ce rayon. Crée une offre pour lancer la partie.</p>}
      {offres?.map((o) => (
        <Carte key={o.id} o={o} action={
          <button className="btn" disabled={faits.includes(o.id)} onClick={() => interesse(o.id)}>
            {faits.includes(o.id) ? 'Demande envoyée' : 'Je suis intéressé'}
          </button>} />
      ))}
    </>
  );
}

function MesOffres() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [f, setF] = useState({ debut: '', fin: '', format: FORMATS[0], niveauPrefere: '' });
  const [err, setErr] = useState('');
  const charger = () => api.mesOffres().then(setOffres).catch((e) => setErr(e.message));
  useEffect(() => { charger(); }, []);

  const creer = async () => {
    try {
      setErr('');
      await api.creer({ ...f, debut: new Date(f.debut).toISOString(), fin: new Date(f.fin).toISOString() });
      charger();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); creer(); }}>
        <h2>Proposer un match</h2>
        {err && <p className="erreur">{err}</p>}
        <label>Début<input type="datetime-local" required value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} /></label>
        <label>Fin<input type="datetime-local" required value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
        <label>Format
          <select value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}>
            {FORMATS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>Niveau souhaité<input value={f.niveauPrefere} onChange={(e) => setF({ ...f, niveauPrefere: e.target.value })} placeholder="Facultatif" /></label>
        <button className="btn vert">Publier l'offre</button>
      </form>
      <h2 className="section">Mes offres</h2>
      {offres.length === 0 && <p className="vide">Tu n'as pas encore proposé de match.</p>}
      {offres.map((o) => <Carte key={o.id} o={o} />)}
    </>
  );
}

export default function App() {
  const [onglet, setOnglet] = useState<'decouvrir' | 'mes'>('decouvrir');
  const [connecte, setConnecte] = useState(!!getToken());
  const [connexion, setConnexion] = useState(false);
  const deconnecter = () => { setToken(null); setConnecte(false); };

  return (
    <div className="app">
      <header>
        <h1>Match de quartier</h1>
        <p>Trouve des joueurs, fixe un créneau, joue.</p>
      </header>
      {connexion && !connecte ? <Connexion onOk={() => { setConnecte(true); setConnexion(false); }} />
        : onglet === 'decouvrir' ? <Decouvrir connecte={connecte} demanderConnexion={() => setConnexion(true)} />
        : connecte ? <MesOffres /> : <Connexion onOk={() => setConnecte(true)} />}
      <nav>
        <button aria-current={onglet === 'decouvrir'} onClick={() => { setConnexion(false); setOnglet('decouvrir'); }}>Découvrir</button>
        <button aria-current={onglet === 'mes'} onClick={() => setOnglet('mes')}>Mes offres</button>
        {connecte && <button onClick={deconnecter}>Déconnexion</button>}
      </nav>
    </div>
  );
}
