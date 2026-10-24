// Connexion + inscription — la localisation est choisie explicitement
// (GPS si autorisé, sinon ville/quartier pour ne plus être bloqué sur Marrakech).
import { useEffect, useState, type FormEvent } from 'react';
import { api, setToken } from '../api';
import type { Profil } from '../types';
import { POSITIONS } from '../util';
import { toast } from '../ui';

const FALLBACK = { lat: 31.6295, lon: -7.9811 }; // centre Marrakech

export default function Auth({ surConnexion }: { surConnexion: (p: Profil) => void }) {
  const [mode, setMode] = useState<'login' | 'inscription'>('login');
  const [f, setF] = useState({ nom: '', telephone: '', motDePasse: '', photo: '' });
  const [err, setErr] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [choix, setChoix] = useState(''); // '' = GPS si dispo, sinon 1re proposition

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setGps({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => setGps(null),
        { timeout: 6000, maximumAge: 300_000 },
      );
    }
  }, []);

  // La position effective selon le choix de l'utilisateur
  const position = (() => {
    if (choix === 'gps') {
      if (gps) return { ...gps, texte: 'Ta position GPS précise 📍' };
      return { ...FALLBACK, texte: 'GPS indisponible — centre de Marrakech' };
    }
    if (choix !== '') {
      const p = POSITIONS[Number(choix)];
      return { lat: p.lat, lon: p.lon, texte: p.nom };
    }
    return gps
      ? { ...gps, texte: 'Ta position GPS précise 📍 (change-la dans la liste si besoin)' }
      : { lat: POSITIONS[0].lat, lon: POSITIONS[0].lon, texte: 'Marrakech — Guéliz par défaut (change-la dans la liste)' };
  })();

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (mode === 'inscription' && f.motDePasse.length < 6) return setErr('Mot de passe : 6 caractères minimum');
    setEnvoi(true);
    try {
      if (mode === 'inscription') {
        await api.inscription({
          nom: f.nom.trim(),
          telephone: f.telephone.trim(),
          motDePasse: f.motDePasse,
          photo: f.photo.trim() || null,
          latitude: position.lat,
          longitude: position.lon,
        });
      }
      const r = await api.connexion(f.telephone.trim(), f.motDePasse) as { token: string };
      setToken(r.token);
      const p = await api.profilMoi() as unknown as Profil;
      surConnexion(p);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const champsCommuns = (
    <>
      <label className="field">Téléphone
        <input value={f.telephone} inputMode="tel" required placeholder="06 xx xx xx xx"
          onChange={(e) => setF({ ...f, telephone: e.target.value })} />
      </label>
      <label className="field">Mot de passe
        <input type="password" value={f.motDePasse} required placeholder={mode === 'inscription' ? '6 caractères minimum' : ''}
          onChange={(e) => setF({ ...f, motDePasse: e.target.value })} />
      </label>
    </>
  );

  const selecteurPosition = (
    <label className="field">Localisation
      <select value={choix} onChange={(e) => setChoix(e.target.value)}>
        <option value="">{gps ? '📍 Ma position GPS (précise)' : '📍 Ma position GPS…'}</option>
        {POSITIONS.map((p, i) => <option key={p.nom} value={String(i)}>{p.nom}</option>)}
      </select>
    </label>
  );

  return (
    <form className="cartef" onSubmit={envoyer}>
      <h2>{mode === 'login' ? 'Connexion' : 'Rejoins le terrain'}</h2>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button type="button" aria-pressed={mode === 'login'}
          onClick={() => { setMode('login'); setErr(''); }}>J'ai un compte</button>
        <button type="button" aria-pressed={mode === 'inscription'}
          onClick={() => { setMode('inscription'); setErr(''); }}>Créer un compte</button>
      </div>
      {err && <p className="erreur">{err}</p>}
      {mode === 'inscription' ? (
        <>
          <label className="field">Ton nom (ou celui de ton équipe)
            <input value={f.nom} required placeholder="Ex : Atlas FC"
              onChange={(e) => setF({ ...f, nom: e.target.value })} />
          </label>
          <label className="field">Photo (lien, facultatif)
            <input value={f.photo} inputMode="url" placeholder="https://…"
              onChange={(e) => setF({ ...f, photo: e.target.value })} />
          </label>
          {champsCommuns}
          {selecteurPosition}
          <p className="petit muted" style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 14 }}>
            📍 {position.texte} — la recherche de matchs se fait par distance.
          </p>
        </>
      ) : (
        <>
          {champsCommuns}
          <p className="petit muted" style={{ marginTop: 12 }}>
            Pas encore de compte ? Bascule sur « Créer un compte », ça prend 30 secondes. 🌱
          </p>
        </>
      )}
      <button className="btn vert grand" disabled={envoi}>
        {envoi ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
      </button>
    </form>
  );
}
