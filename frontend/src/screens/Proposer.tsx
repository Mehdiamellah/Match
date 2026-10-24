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

export default function Proposer() {
  const [offres, setOffres] = useState<OffreMoi[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const [f, setF] = useState({ debut: '', fin: '', format: 'CINQ_VS_CINQ' as Format, niveauPrefere: '' });
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
    if (!f.debut || !f.fin) return setErrF('Choisis le début et la fin du créneau');
    const d = new Date(f.debut);
    const fi = new Date(f.fin);
    if (fi <= d) return setErrF('La fin du créneau doit être après le début');
    if (d.getTime() < Date.now()) return setErrF('Le créneau commence dans le passé — vise plus tard 🕒');
    setEnvoi(true);
    try {
      await api.creer({ debut: d.toISOString(), fin: fi.toISOString(), format: f.format, niveauPrefere: f.niveauPrefere.trim() || null });
      toast('Offre publiée ✓ Les joueurs du coin la verront dès maintenant');
      setF((x) => ({ ...x, debut: '', fin: '' }));
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
        <label className="field">Début
          <input type="datetime-local" required value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} />
        </label>
        <label className="field">Fin du créneau
          <input type="datetime-local" required value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} />
        </label>
        <label className="field">Niveau souhaité (facultatif)
          <input value={f.niveauPrefere} placeholder="Ex : loisir, intermédiaire…"
            onChange={(e) => setF({ ...f, niveauPrefere: e.target.value })} />
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
              {libelleStatutOffre(o.statut)}{o.niveauPrefere ? ` · ${o.niveauPrefere}` : ''} · jusqu'à {heure(o.fin)}
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
