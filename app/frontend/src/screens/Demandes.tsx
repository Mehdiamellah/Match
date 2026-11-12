// Demandes : le hub des demandes — reçues sur mes offres (rôle organisateur)
// et envoyées par moi (rôle joueur), avec le contact débloqué si confirmé.
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { DemandeRecue, MaDemande } from '../types';
import { jour, heure, libelleFormat, whatsappLien, dateComplete } from '../util';
import { Icone, Avatar, Vide, Chargement, Reessayer, toast } from '../ui';

export default function Demandes() {
  const [recues, setRecues] = useState<DemandeRecue[] | null>(null);
  const [envoyees, setEnvoyees] = useState<MaDemande[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setErr('');
    Promise.all([api.mesDemandes(), api.demandesRecues()])
      .then(([e, r]) => {
        setEnvoyees(e as MaDemande[]);
        setRecues(r as DemandeRecue[]);
      })
      .catch((x) => setErr((x as Error).message));
  }, [tick]);

  const confirmer = async (i: DemandeRecue) => {
    try {
      const r = await api.confirmer(i.id) as { nombreRefuses: number };
      toast(`Match confirmé avec ${i.demandeur.nom} ⚽ ${r.nombreRefuses} autre(s) demande(s) refusée(s)`);
      setTick((t) => t + 1); // recharge tout : la confirmation a aussi refusé d'autres demandes
    } catch (e) {
      toast((e as Error).message, 'erreur');
    }
  };

  const videPartout = recues?.length === 0 && envoyees?.length === 0;

  return (
    <>
      <h2 className="section" style={{ marginTop: 6 }}>
        Reçues sur mes offres {recues ? `(${recues.length})` : ''}
      </h2>
      {err && <Reessayer message={err} surClic={() => setTick((t) => t + 1)} />}
      {(recues === null || envoyees === null) && !err && <Chargement texte="Chargement des demandes…" />}

      {recues && recues.length === 0 && (
        <p className="petit muted" style={{ margin: '4px 0 20px' }}>
          Personne n'a encore demandé à rejoindre tes offres.
        </p>
      )}

      {recues && recues.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          {recues.map((i) => (
            <div className="demandeur" key={i.id}>
              <Avatar nom={i.demandeur.nom} photo={i.demandeur.photo} />
              <div className="qui">
                <div className="nom">{i.demandeur.nom}</div>
                <div className="sous">
                  {libelleFormat(i.offre.format)} · {jour(i.offre.debut)} {heure(i.offre.debut)}
                  {' · '}demandé {dateComplete(i.dateDemande)}
                </div>
              </div>
              {i.statut === 'EN_ATTENTE' && (
                <button className="btn mini vert" onClick={() => confirmer(i)}>Confirmer</button>
              )}
              {i.statut === 'CONFIRME' && (
                <span className="badge succes">Confirmé
                  {i.demandeur.telephone && (
                    <span className="contacts" style={{ marginLeft: 6 }}>
                      <a href={`tel:${i.demandeur.telephone}`} aria-label="Appeler"><Icone nom="tel" size={13} /></a>
                      <a href={whatsappLien(i.demandeur.telephone)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icone nom="bulle" size={13} /></a>
                    </span>
                  )}
                </span>
              )}
              {i.statut === 'REFUSE' && <span className="badge rouge">Refusé</span>}
            </div>
          ))}
        </div>
      )}

      <h2 className="section">Envoyées par moi {envoyees ? `(${envoyees.length})` : ''}</h2>

      {videPartout && (
        <Vide
          icone="eclair"
          titre="Aucune demande pour l'instant"
          hint="Publie une offre dans Proposer, ou clique « Je suis intéressé » dans Découvrir."
          action={null}
        />
      )}

      <div className="grille">
        {envoyees
          ?.slice()
          .sort((a, b) => new Date(a.offre.debut).getTime() - new Date(b.offre.debut).getTime())
          .map((d) => (
            <article className="carte" key={d.id}>
              <div className="heure">
                <strong>{heure(d.offre.debut)}</strong>
                <span>{jour(d.offre.debut)}</span>
              </div>
              <div className="corps">
                <h3>{libelleFormat(d.offre.format)} · {d.createur.nom}</h3>
                <p className="meta">Jusqu'à {heure(d.offre.fin)} · organisateur {d.createur.nom}</p>
                <div className="pied">
                  {d.statut === 'CONFIRME' && (
                    <span className="badge succes">
                      <Icone nom="trophee" size={13} /> Contact débloqué
                    </span>
                  )}
                  {d.statut === 'EN_ATTENTE' && (
                    <span className="badge jaune">En attente de confirmation</span>
                  )}
                  {d.statut === 'REFUSE' && <span className="badge rouge">Refusée</span>}
                  {d.statut === 'CONFIRME' && d.createur.telephone ? (
                    <span className="contacts" style={{ marginLeft: 'auto' }}>
                      <a href={`tel:${d.createur.telephone}`}>
                        <Icone nom="tel" size={14} /> Appeler
                      </a>
                      <a href={whatsappLien(d.createur.telephone)} target="_blank" rel="noreferrer">
                        <Icone nom="bulle" size={14} /> WhatsApp
                      </a>
                    </span>
                  ) : null}
                </div>
                {d.statut === 'EN_ATTENTE' && (
                  <p className="petit muted" style={{ margin: '8px 0 0' }}>
                    <Avatar nom={d.createur.nom} photo={d.createur.photo} />
                    <span style={{ display: 'block', marginTop: -40, marginLeft: 50 }}>
                      Quand {d.createur.nom.split(' ')[0]} confirme, son numéro apparaît ici et le vôtre chez lui.
                    </span>
                  </p>
                )}
              </div>
            </article>
          ))}
      </div>
    </>
  );
}
