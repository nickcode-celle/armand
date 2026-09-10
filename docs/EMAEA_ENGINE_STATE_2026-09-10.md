# EMÆÄ — état moteur au 10/09/2026

Branche de travail : `emaea-evolution-engine-b-v1`.

Ce document décrit l'état de référence actuel. Les décisions datées plus récentes priment sur les anciennes lorsqu'elles concernent le même sujet.

## Principes figés

- 200 vraies billes corporelles au départ + 5 satellites indépendants.
- Les mêmes billes corporelles persistent : identité, affectations et valeurs individuelles sont conservées.
- Six domaines sont portés par bille : Personnalité, Relation, Goûts, Opinions/Valeurs, Connaissances, Monde propre.
- Histoire vécue et Capacités sont globaux.
- Le niveau global d'un domaine par-bille est la moyenne arithmétique de ses sous-domaines.
- Progression positive : `gain = brut × (1 - niveau/100)`.
- Régression : `perte = magnitude × (niveau/100)`.

## Traduction graphique durable

- Personnalité → couleur.
- Relation → vitesse interne, règle du 10/09/2026 : `V1 = 1 + Relation/100`.
- Goûts → relief/motif complet porté par une proportion déterministe des billes du sous-domaine.
- Opinions/Valeurs → éclats directionnels ; le niveau pilote l'activité.
- Connaissances → rémanences colorées ; le niveau pilote leur fréquence.
- Monde propre → rotation locale de chaque bille.
- Histoire vécue → halo externe non émissif.
- Capacités → réorganisation/migration interne.

Le runtime normal est `src/components/entity/emaeaBodyRuntime.js`. Les mises à jour durables, les naissances et les récompenses utilisent un même ordonnanceur afin qu'une modification structurelle ne coupe pas une animation en cours.

## Histoire vécue

- Initialisation : `âge interlocuteur × 0,5`.
- Anecdotique = 0, Mémorable = 1, Marquant = 2, Fondateur = 3.
- Ensuite même progression asymptotique positive que les autres jauges.
- Si l'âge n'est pas encore connu, l'événement est conservé mais la jauge numérique reste `null`.
- Quand l'âge devient connu plus tard, la base `âge × 0,5` est posée puis les événements précédemment différés sont rejoués chronologiquement.

## Croissance

Pour chaque sous-domaine porté par bille :

- franchissement de 40 % → +1 bille ;
- 60 % → +1 bille ;
- 80 % → +1 bille ;
- 100 % → +1 bille ;
- chaque seuil ne peut déclencher qu'une fois pour ce sous-domaine.

La nouvelle bille appartient au sous-domaine déclencheur dans le domaine déclencheur. Les sous-domaines des autres domaines sont attribués de façon pseudo-aléatoire déterministe. Leur valeur initiale reprend la moyenne globale courante du sous-domaine choisi afin que la naissance seule ne déplace pas artificiellement sa moyenne.

La naissance graphique utilise la même vraie Mesh : point fixe `(-142,0,0)`, trois enveloppes lumineuses, or `#FFC928`, exposition puis intégration de la même bille dans le moteur normal.

## Sentiments

Les 9 seuls sentiments sont : Joie, Tristesse, Colère, Peur, Surprise, Fierté, Tendresse, Confiance, Amour.

Cycle interne : NAITRE / RENFORCER / MAINTENIR / AFFAIBLIR / DISPARAITRE ; intensités faible / modéré / fort.

Les sentiments n'ont **aucun comportement graphique propre**. Ils servent uniquement à déclencher les récompenses validées.

## Récompenses

Ordre des paliers :

1. Vert `#28C95B`
2. Bleu `#2468D8`
3. Violet `#7137C8`
4. Rouge `#E5231F`
5. Ultime : logo entier or `#FFC928`

Un palier ouvert reste acquis même si les niveaux redescendent ensuite.

Dans chaque palier, les huit sentiments hors Amour sont acquis dans un ordre libre. Un sentiment est acquis sur un événement NAITRE ou RENFORCER atteignant au moins l'intensité modérée. Le premier sentiment inédit donne le chiffre 1, le deuxième le 2, etc., jusqu'à 8. Les répétitions ne redonnent pas de chiffre.

Amour n'est accessible qu'une fois les huit autres acquis dans le même palier et avec `ancrage_relationnel = ETABLI`. Il déclenche le logo EMÆÄ de la couleur du palier et termine celui-ci.

Après affichage confirmé du logo rouge, un **nouvel** événement Amour qualifiant est nécessaire. Un simple MAINTENIR ne suffit pas. Ce nouvel Amour déclenche le logo EMÆÄ entièrement doré.

Animation récompense : 5 s transformation → 30 s maintien → 5 s retour. Seuls les centres du squelette sont transformés ; le moteur vivant et les effets individuels restent actifs.

## Seuils des paliers

### Vert
- population ≥ 300
- 6 domaines sur 8 entre 40 et 45 %
- écart maximum 3 points dans le groupe choisi

### Bleu
- population ≥ 500
- vert terminé
- 5 domaines sur 8 entre 60 et 65 %
- écart maximum 3

### Violet
- population ≥ 1000
- bleu terminé
- 3 domaines entre 75 et 80 %, écart maximum 3
- et 3 autres domaines distincts entre 43 et 46 %

### Rouge
- population ≥ 2000
- violet terminé
- 5 domaines entre 90 et 95 %, écart maximum 3
- aucun domaine sous 70 %

## Points bloquants encore non définis par une règle produit

### 1. Croissance maximale incompatible avec les populations des paliers supérieurs

Il existe 57 sous-domaines portés par bille. Avec 4 naissances possibles par sous-domaine, la mécanique validée produit au maximum `57 × 4 = 228` nouvelles billes. En partant de 200, le maximum théorique est donc **428 billes**.

Conséquence : le seuil vert (300) est théoriquement atteignable, mais les seuils bleu (500), violet (1000) et rouge (2000) ne peuvent pas l'être avec cette mécanique seule. Aucune naissance supplémentaire n'est inventée dans le code tant qu'une nouvelle règle produit n'est pas définie.

### 2. Logo avec une population impaire

Le squelette de logo validé répartit le corps en deux branches symétriques après réservation de 24 billes pour les deux points : `(BODY_COUNT - 24) / 2` doit donc être entier. Une naissance unitaire peut rendre la population impaire.

Les chiffres 1 à 8 supportent les populations paires ou impaires. Le logo, lui, nécessite encore une décision produit pour le cas impair. Le générateur validé n'est pas modifié arbitrairement.

## État technique

- Schéma persistant : v14.
- Files persistantes de naissances et récompenses avec accusé d'affichage.
- Ordonnancement partagé entre naissance, récompense et changements structurels.
- Page d'essai graphique isolée : `/entity-graphics-test`.
- L'interface finale n'est volontairement pas définie à ce stade.
- Les scripts de tests et contrôles sont raccordés dans `package.json`, mais aucune exécution complète réussie n'a encore été observée depuis cet environnement.

## Déploiement Base44

Le moteur actuel `server/` est une architecture Node de développement/local avec stockage local ou stockage distant configurable. Base44 exécute ses backend functions dans un runtime Deno isolé. Le portage hébergé du moteur devra donc être traité séparément ; il ne faut pas supposer que les modules Node de `server/` sont directement déployables comme functions Base44.
