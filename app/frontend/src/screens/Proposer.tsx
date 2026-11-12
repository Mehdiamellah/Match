// Proposer : création d'offre + pilotage (intéressés, confirmation, après-match).
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { FORMATS, type Format, type OffreMoi, type Interesse, type Resultat } from '../types';
import { jour, heure, libelleFormat, libelleStatutOffre, libelleResultat, dateComplete, whatsappLien } from '../util';
import { Feuille, Icone, Avatar, Vide, Chargement, Reessayer, toast } from '../ui';

const CHOIX_RESULTAT: { r: Resultat; texte: string }[] = [
  { r: 'VICTOIRE_CREATEUR', texte: 'Nous' },
  { r: 'NUL', texte: 'Nul' },
  { r: 'VICTOIRE_INTERESSE', texte: 'Eux' },
];

// Créneau simplifié : 3 jours possibles, coup d'envoi au curseur, match d'une heure.
// On ne programme pas un match à 8h du matin → de 11h jusqu'à minuit.
const JOURS: { j: number; texte: string }[] = [
  { j: 0, texte: "Aujourd'hui" },
  { j: 1, texte: 'Demain' },
  { j: 2, texte: 'Le lendemain' },
];
const H_MIN = 11;          // premier coup d'envoi : 11h00
const H_MAX = 23;          // dernier coup d'envoi : 23h00 → fin à minuit
const DUREE_MIN = 60;      // un match = une heure
const heureFin = (h: number) => `${(h + DUREE_MIN / 60) % 24}h00`;

export default function Proposer() {
  const [offres, setOffres] = useState<OffreMoi[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const [f, setF] = useState({ jour: 0, heure: 19, format: 'CINQ_VS_CINQ' as Format });
  const [errF, setErrF] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const [offreOuverte, setOffreOuverte] = useState<string | null>(null);
  const [interesses, setInteresses] = useState<Interesse[] | null>(null);
  const [errSheet, setErrSheet] = useState('');

  useEffect(() => {
    setErr('');
    api.mesOffres()
      .then((r) => setOffres(r as OffreMoi[]))
      .catch((e) => setErr((e as Error).message));
  }, [tick]);

  const creer = async (e: FormEvent) => {
    e.preventDefault();
    setErrF('');
    const d = new Date();
    d.setDate(d.getDate() + f.jour);
    d.setHours(f.heure, 0, 0, 0);
    const fi = new Date(d.getTime() + DUREE_MIN * 60_000);
    if (d.getTime() < Date.now()) return setErrF('Ce créneau est déjà passé — vise une heure plus tard 🕒');
    setEnvoi(true);
    try {
      // toISOString() : horodatage explicite avec fuseau → plus de décalage horaire, où que tourne le backend
      await api.creer({ debut: d.toISOString(), fin: fi.toISOString(), format: f.format });
      toast('Offre publiée ✓ Les joueurs du coin la verront dès maintenant');
      setTick((t) => t + 1);
    } catch (e2) {
      setErrF((e2 as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const ouvrirFeuille = (offreId: string) => {
    setOffreOuverte(offreId);
    setInteresses(null);
    setErrSheet('');
    api.interesses(offreId)
      .then((r) => setInteresses(r as Interesse[]))
      .catch((e) => setErrSheet((e as Error).message));
  };

  const confirmer = async (i: Interesse) => {
    try {
      const r = await api.confirmer(i.id) as { nombreRefuses: number };
      toast(`Match confirmé avec ${i.utilisateur.nom} ⚽ ${r.nombreRefuses} autre(s) demande(s) refusée(s)`);
      setInteresses((await api.interesses(offreOuverte!)) as Interesse[]);
      setTick((t) => t + 1);
    } catch (e) {
      toast((e as Error).message, 'erreur');
    }
  };

  const noter = async (offreId: string, resultat: Resultat) => {
    try {
      await api.enregistrerResultat(offreId, resultat);
      toast('Résultat enregistré ✓ Il alimente tes stats de profil');
      setTick((t) => t + 1);
    } catch (e) {
      toast((e as Error).message, 'erreur');
    }
  };

  return (
    <>
      <div className="bicolonne">
      <form className="cartef" onSubmit={creer}>
        <h2>Proposer un match</h2>
        {errF && <p className="erreur">{errF}</p>}
        <div className="seg" style={{ marginBottom: 13 }}>
          {FORMATS.map((x) => (
            <button key={x} type="button" aria-pressed={f.format === x} onClick={() => setF({ ...f, format: x })}>
              {libelleFormat(x)}
            </button>
          ))}
        </div>
        <label className="field">Jour
          <div className="seg" style={{ marginTop: 6 }}>
            {JOURS.map((x) => (
              <button key={x.j} type="button" aria-pressed={f.jour === x.j} onClick={() => setF({ ...f, jour: x.j })}>
                {x.texte}
              </button>
            ))}
          </div>
        </label>
        <label className="field">
          Coup d'envoi <strong style={{ color: 'var(--blanc, #fff)' }}>{f.heure}h00 → {heureFin(f.heure)}</strong> · match d'1 h
          <input type="range" min={H_MIN} max={H_MAX} step={1} value={f.heure}
            style={{ width: '100%', accentColor: 'var(--lime)', marginTop: 8 }}
            onChange={(e) => setF({ ...f, heure: Number(e.target.value) })} />
        </label>
        <button className="btn vert grand" disabled={envoi}>{envoi ? 'Publication…' : "Publier l'offre"}</button>
      </form>

      <div>
      <h2 className="section" style={{ marginTop: 6 }}>Mes offres {offres ? `(${offres.length})` : ''}</h2>
      {err && <Reessayer message={err} surClic={() => setTick((t) => t + 1)} />}
      {offres === null && !err && <Chargement />}
      {offres?.length === 0 && (
        <Vide
          titre="Rien de proposé pour l'instant"
          hint="Publie un créneau au-dessus : c'est le moyen le plus simple de trouver une équipe adverse."
        />
      )}
      <div className="grille">
      {offres?.map((o) => (
        <article className="carte" key={o.id}>
          <div className="heure"><strong>{heure(o.debut)}</strong><span>{jour(o.debut)}</span></div>
          <div className="corps">
            <h3>{libelleFormat(o.format)}</h3>
            <p className="meta">
              {libelleStatutOffre(o.statut)} · jusqu'à {heure(o.fin)}
            </p>
            <div className="pied">
              {o.resultat ? <span className="badge gris">{libelleResultat(o.resultat)}</span>
                : o.statut === 'MATCHEE' ? <span className="badge succes">Adversaire confirmé 🔒</span>
                : <span className="badge vert">Ouverte</span>}
              {o.statut === 'OUVERTE' && o._count.interets > 0 && (
                <span className="badge jaune">{o._count.interets} demande{o._count.interets > 1 ? 's' : ''}</span>
              )}
              {o.statut === 'OUVERTE' && (
                <button className="btn mini" onClick={() => ouvrirFeuille(o.id)}>
                  Voir les demandes
                </button>
              )}
            </div>
            {o.statut === 'MATCHEE' && !o.resultat && (
              <div style={{ marginTop: 10 }}>
                <div className="petit muted" style={{ margin: '2px 0 5px', fontWeight: 600 }}>
                  Après-match — qui a gagné ?
                </div>
                <div className="seg">
                  {CHOIX_RESULTAT.map((c) => (
                    <button key={c.r} onClick={() => noter(o.id, c.r)}>{c.texte}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      ))}
      </div>
      </div>
      </div>

      {offreOuverte && (
        <Feuille titre="Demandes reçues" fermer={() => setOffreOuverte(null)}>
          {errSheet && <p className="erreur">{errSheet}</p>}
          {interesses === null && !errSheet && <Chargement texte="Chargement des demandes…" />}
          {interesses && interesses.length === 0 && (
            <Vide icone="demandes" titre="Personne pour l'instant"
              hint="Ton offre est visible dans Découvrir pour tous les joueurs du rayon." />
          )}
          {interesses?.map((i) => (
            <div className="demandeur" key={i.id}>
              <Avatar nom={i.utilisateur.nom} photo={i.utilisateur.photo} />
              <div className="qui">
                <div className="nom">{i.utilisateur.nom}</div>
                <div className="sous">Demandé {dateComplete(i.dateDemande)}</div>
              </div>
              {i.statut === 'EN_ATTENTE' && (
                <button className="btn mini vert" onClick={() => confirmer(i)}>Confirmer</button>
              )}
              {i.statut === 'CONFIRME' && (
                <span className="badge succes">Confirmé
                  {i.utilisateur.telephone && (
                    <span className="contacts" style={{ marginLeft: 6 }}>
                      <a href={`tel:${i.utilisateur.telephone}`} aria-label="Appeler"><Icone nom="tel" size={13} /></a>
                      <a href={whatsappLien(i.utilisateur.telephone)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icone nom="bulle" size={13} /></a>
                    </span>
                  )}
                </span>
              )}
              {i.statut === 'REFUSE' && <span className="badge rouge">Refusé</span>}
            </div>
          ))}
          {interesses && interesses.length > 0 && (
            <p className="petit muted" style={{ marginTop: 12, marginBottom: 0 }}>
              Confirmer un joueur matche l'offre et refuse automatiquement les autres demandes. Le contact s'échange aux deux parties.
            </p>
          )}
        </Feuille>
      )}
    </>
  );
}
