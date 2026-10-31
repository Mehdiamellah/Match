// Profil : identité, stats V/N/D, correction de position, déconnexion.
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Profil } from '../types';
import { POSITIONS } from '../util';
import { Icone, Avatar, Chargement, Reessayer, toast } from '../ui';

export default function Profil({ surDeconnexion }: { surDeconnexion: () => void }) {
  const [p, setP] = useState<Profil | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);

  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [choix, setChoix] = useState(''); // '' = position actuelle
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    setErr('');
    api.profilMoi()
      .then((r) => setP(r as unknown as Profil))
      .catch((e) => setErr((e as Error).message));
  }, [tick]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setGps(null),
        { timeout: 6000, maximumAge: 300_000 },
      );
    }
  }, []);

  if (!p) {
    return err ? <Reessayer message={err} surClic={() => setTick((t) => t + 1)} /> : <Chargement texte="Chargement du profil…" />;
  }

  const joues = p.stats.victoires + p.stats.nuls + p.stats.defaites;

  // Position choisie dans la liste ('' = inchangée, 'gps' = GPS, sinon index POSITIONS)
  const nouvelle = (() => {
    if (choix === '') return null;
    if (choix === 'gps') return gps;
    const q = POSITIONS[Number(choix)];
    return { lat: q.lat, lon: q.lon };
  })();

  const majPosition = async () => {
    if (!nouvelle) return;
    setEnregistre(true);
    try {
      await api.majProfil({ latitude: nouvelle.lat, longitude: nouvelle.lon });
      toast('Position mise à jour ✓ Tes futures offres se verront autour');
      setTick((t) => t + 1);
      setChoix('');
    } catch (e) {
      toast((e as Error).message, 'erreur');
    } finally {
      setEnregistre(false);
    }
  };

  return (
    <div className="ecran-etroit">
      <div className="tete-profil">
        <Avatar nom={p.nom} photo={p.photo} plein />
        <div>
          <h2 className="c-titre" style={{ fontSize: 30 }}>{p.nom}</h2>
          <div className="muted petit">
            Membre depuis {new Date(p.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat v"><div className="num">{p.stats.victoires}</div><div className="lbl">Victoires</div></div>
        <div className="stat n"><div className="num">{p.stats.nuls}</div><div className="lbl">Nuls</div></div>
        <div className="stat d"><div className="num">{p.stats.defaites}</div><div className="lbl">Défaites</div></div>
      </div>

      <div className="cartef" style={{ marginTop: 16 }}>
        <div className="info-ligne">
          <Icone nom="tel" size={17} /> Téléphone
          <span className="valeur">{p.telephone}</span>
        </div>
        <div className="info-ligne">
          <Icone nom="pin" size={17} /> Position
          <span className="valeur">{p.latitude.toFixed(2)}, {p.longitude.toFixed(2)}</span>
        </div>
        <div className="info-ligne" style={{ borderBottom: 0 }}>
          <Icone nom="trophee" size={17} /> Matchs joués
          <span className="valeur">{joues}</span>
        </div>
      </div>

      <div className="cartef">
        <h2 style={{ fontSize: 20 }}>Corriger ma position</h2>
        <p className="petit muted" style={{ margin: '0 0 12px' }}>
          Elle sert à te trouver des matchs près de toi (et à situer tes offres publiées).
        </p>
        <label className="field">Nouvelle position
          <select value={choix} onChange={(e) => setChoix(e.target.value)}>
            <option value="">Position actuelle où je suis…</option>
            {gps && <option value="gps">📍 Ma position GPS (précise)</option>}
            {POSITIONS.map((q, i) => <option key={q.nom} value={String(i)}>{q.nom}</option>)}
          </select>
        </label>
        <button className="btn vert grand" disabled={enregistre || !nouvelle} onClick={majPosition}>
          {enregistre ? 'Enregistrement…' : 'Mettre à jour ma position'}
        </button>
      </div>

      <p className="petit muted" style={{ marginTop: 8 }}>
        Les stats se remplissent quand l'organisateur note le résultat après-match.
      </p>

      <button className="btn rouge grand" style={{ marginTop: 18 }} onClick={surDeconnexion}>
        Se déconnecter
      </button>
    </div>
  );
}
