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
- Relation → vitesse interne : `V1 = 1 + Relation/100`.
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

## Croissance par évolution des sous-domaines

Pour chaque sous-domaine porté par bille, une nouvelle bille naît au premier franchissement de chacun des seuils suivants :

`40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100 %`.

Chaque seuil ne peut déclencher qu'une fois pour ce sous-domaine.

La nouvelle bille appartient au sous-domaine déclencheur dans le domaine déclencheur. Les sous-domaines des autres domaines sont attribués de façon pseudo-aléatoire déterministe. Leur valeur initiale reprend la moyenne globale courante du sous-domaine choisi afin que la naissance seule ne déplace pas artificiellement sa moyenne.

Avec 57 sous-domaines et 13 seuils, cette mécanique peut produire jusqu'à 741 naissances, soit 941 billes en partant de 200.

## Naissance gratuite quotidienne

- Une échéance gratuite existe chaque jour à 08:00, fuseau `Europe/Paris` par défaut.
- Si EMÆÄ est connectée au moment où 08:00 survient, la bille naît en direct pendant la session.
- Si EMÆÄ n'est pas connectée à 08:00, la bille naît à la connexion suivante.
- En cas d'absence prolongée, le rattrapage est limité à 2 billes ; les échéances plus anciennes sont perdues.
- Une bille quotidienne est une vraie bille persistante et utilise exactement la même animation de naissance que les autres.
- Comme elle n'a pas de sous-domaine déclencheur, chacun de ses sous-domaines est attribué pseudo-aléatoirement et reprend la moyenne globale courante correspondante afin de rester neutre sur les niveaux.

Le déclenchement live est pris en charge par `emaeaDailyBirthBridge.js`, raccordé au contrôleur graphique commun.

## Billes achetées

Le joueur pourra acheter des billes. Le prix, les packs et le fournisseur de paiement ne sont pas encore définis.

Le moteur contient uniquement la couche sûre d'application d'un achat **déjà confirmé** :

- aucune bille n'est attribuée sur simple demande client ;
- un identifiant d'achat déjà appliqué ne peut pas recréer les mêmes billes ;
- chaque bille achetée est une vraie bille persistante ;
- ses sous-domaines sont attribués comme pour une naissance neutre ;
- le système de paiement devra appeler cette couche uniquement après confirmation fiable du paiement.

## Animation de naissance

La naissance graphique utilise la même vraie Mesh : point fixe `(-142,0,0)`, trois enveloppes lumineuses, or `#FFC928`, exposition puis intégration de la même bille dans le moteur normal.

La population visible n'est pas agrandie avant la fin de l'animation : les billes persistées mais encore en attente d'intégration graphique sont retirées de l'état initial visible puis ajoutées par leur animation réelle.

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

Dans chaque palier, les huit sentiments hors Amour sont acquis dans l'ordre réel où ils apparaissent. Un sentiment est acquis sur un événement NAITRE ou RENFORCER atteignant au moins l'intensité modérée. Le premier sentiment inédit donne le chiffre 1, le deuxième le 2, etc., jusqu'à 8. Les répétitions ne redonnent pas de chiffre.

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

Les seuils violet et rouge peuvent être atteints grâce à la combinaison évolution des sous-domaines + naissances quotidiennes + billes achetées.

## Logo et populations impaires

Le logo EMÆÄ utilise toutes les billes disponibles dès lors que le minimum de population du palier est atteint. Le nombre de billes n'a pas besoin d'être pair.

Les 24 billes réservées aux deux points restent réparties également. Pour le reste du corps, si le nombre de billes est impair, une branche contient simplement une bille de plus que l'autre. Aucun ajout artificiel ni suppression de bille n'est effectué.

## État technique

- Schéma persistant : v16.
- Files persistantes de naissances et récompenses avec accusé d'affichage.
- Ordonnancement partagé entre naissance, récompense et changements structurels.
- Contrôleur graphique commun : `emaeaGraphicRuntimeController.js`.
- Hôte graphique réutilisable sans décision de mise en page : `EmaeaRuntimeHost.jsx`.
- Pont de naissance quotidienne live : `emaeaDailyBirthBridge.js`.
- Page d'essai graphique isolée : `/entity-graphics-test`.
- L'interface finale n'est volontairement pas définie à ce stade.
- Le shell applicatif EMÆÄ n'utilise plus l'ancien mécanisme d'authentification Base44.
- Validation CI complète réussie le 10/09/2026 : contrôles syntaxiques, suite `test:entity`, benchmark d'endurance, test de persistance après redémarrage, build Vite, build du conteneur Node et démarrage du conteneur avec volume persistant.
- Le build signale uniquement un avertissement de taille de chunk frontend ; il ne bloque pas la compilation.

## Déploiement Node autonome

EMÆÄ est un serveur Node autonome. Aucun portage Base44 n'est requis ni souhaité.

- Entrée serveur : `server/entity-server-v2.mjs`.
- Le serveur écoute `PORT` / `ENTITY_API_PORT` et `HOST` / `ENTITY_API_HOST`; la valeur hébergée par défaut est `0.0.0.0`.
- Le stockage mono-instance utilise des fichiers JSON atomiques shardés. En production, `ENTITY_STORAGE_DIR` doit pointer vers un volume persistant monté.
- Un stockage distant versionné avec leases reste disponible via `ENTITY_STORAGE_URL` si une architecture multi-instance devient nécessaire plus tard.
- Image de déploiement : `Dockerfile.entity`, Node 22, port 4401, volume `/data`.
- La route `/health` expose notamment le mode et le chemin de stockage actifs.
- Le test `entity-production-persistence-runtime.mjs` démarre le vrai serveur, crée un état, redémarre le processus sur le même volume et vérifie que la population et l'état quotidien survivent sans duplication.

Le backend est donc prêt à être déployé sur n'importe quel hébergeur acceptant un conteneur Node et un volume persistant. Le déploiement sur un compte d'hébergement réel nécessite uniquement l'accès à cet hébergeur et ses identifiants ; aucune dépendance technique supplémentaire n'est requise avant la phase interface.
