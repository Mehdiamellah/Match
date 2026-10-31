# UX Brief — « Match de quartier » v2

> Livrable 1/3 — rôle : UX designer

## Utilisateurs & scénarios clés

Deux personas : **l'organisateur** (a un créneau et un terrain, cherche 9 autres joueurs)
et **le joueur** (veut jouer samedi, cherche un match près de lui). Toutes les actions
métier subissent la latence « humaine » : les demandes attendent une confirmation —
le design doit donc rendre **le temps de l'attente lisible et rassurant**.

## Flux principaux (job stories)

| # | Flux | Écrans |
|---|------|--------|
| F1 | Je veux voir ce qui se joue vers moi → filtrer → demander à participer | Découvrir (+ filtres) |
| F2 | Je veux proposer un créneau et gérer les demandes | Proposer (form + « mes offres ») → feuille « Intéressés » |
| F3 | Après confirmation, j'ai besoin du contact de l'adversaire | Demandes → contact tél / WhatsApp |
| F4 | Le match a eu lieu, j'alimente mon historique | Proposer → fiche matchée → « après-match » |
| F5 | Je veux voir mon bilan | Profil (stats V/N/D) |

## Information architecture

Tab bar mobile (4 onglets, langage app native) :

```
[Découvrir] [Proposer] [Demandes] [Profil]
```

- **Découvrir** est public (browsing sans compte) ;
- **Proposer / Demandes / Profil** exigent l'authentification → l'écran Auth
  (connexion / inscription, un seul écran à 2 onglets) prend le relais.
- La gestion des offres créées vit sous l'onglet **Proposer** (création + pilotage
  au même endroit) — évite un 5e onglet.

## Décisions d'expérience

1. **Contact récompensé, jamais donné trop tôt** : le téléphone du créateur ne
   s'affiche dans « Demandes » que si l'intérêt est CONFIRMÉ (règle back-end
   respectée et mise en scène : badge « 🔓 Contact débloqué »).
2. **Confirmation = événement bruyant** : quand l'organisateur confirme, on lui
   dit combien de demandes sont auto-refusées (le back le renvoie) → toast explicite.
3. **Recherche par défaut** : géoloc navigateur, fallback Marrakech, rayon
   réglable (5 / 10 / 20 / 50 km), filtre format (Tous / 5v5 / 6v6).
4. **Création d'offre** : durée naturellement validée côté client (`fin > début`)
   AVANT le back, erreurs métier (301 conflit de créneau) affichées en clair.
5. **Après-match** : sur une offre MATCHÉE sans résultat, 3 choices franches
   (Nous / Nul / Eux) → PATCH `/offres-match/:id/resultat`.
6. **États systématiques** : chaque écran a loading (skeleton/spinner), vide
   (approche positif + CTA), erreur (message back replâtre + bouton réessayer).
7. Pas d'intérêt sur sa propre offre ni 2× : l'UI l'empêche (bouton devient
   « Demande envoyée ✓ ») et les erreurs back servent de filet.
