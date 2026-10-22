# SEB-MULTIGYRO-BATTERIE

Plusieurs téléphones (iPhone et Android mélangés) servent de baguettes, **chacun avec ses propres sons**. Chaque téléphone apprend 3 gestes (coup **vers le bas**, **vers le haut**, **vers la gauche**), et chaque geste joue le son choisi pour ce téléphone. Les sons sortent de l'ordinateur (synthétisés, aucun fichier audio).

Prototype (étude de faisabilité). Petite sœur de [SEB-GYROBATTERIE](https://github.com/SEB102/seb-gyrobatterie) (un seul téléphone).

## Utilisation

**Ordinateur** : ouvrir **https://seb102.github.io/seb-multigyro-batterie/** et cliquer une fois dans la page (le navigateur coupe le son tant qu'on n'a pas cliqué).

**Téléphones** : chacun scanne le QR code affiché. **L'ordinateur et les téléphones doivent être connectés au même réseau Wi-Fi.**
- iPhone : toucher « Toucher pour démarrer » puis autoriser « Mouvement ». Android : démarre tout seul.
- **Rien à apprendre** : les 3 gestes sont fournis d'office. Pour les adapter à sa façon de jouer, « Réapprendre mes 3 gestes » sur le téléphone (10 coups de chacun) ; **l'ordinateur bipe** pour guider (le téléphone ne joue aucun son). Voir « Les 3 gestes ».
- **Écran noir verrouillé** (bouton sur le téléphone) : écran entièrement noir, touchers ignorés, on continue de jouer ; **appui long de 2 s** pour revenir. L'écran reste allumé pendant le jeu.
- **« Voulez-vous fermer l'onglet ? » quand on agite le téléphone** : fonction « Secouer pour annuler » de l'iPhone, à couper dans **Réglages → Accessibilité → Toucher → Secouer pour annuler**.

**Sur l'ordinateur**, chaque téléphone a sa carte : numéro, couleur, un son pour chacun des 3 gestes (le même son peut servir plusieurs fois), sensibilité. Le téléphone affiche son numéro dans sa couleur et le son de chaque geste. Un téléphone déjà connu garde ses sons pour le bas et le haut ; la gauche prend le son qu'avait la droite (un téléphone d'avant les gestes appris, qui n'avait que deux sons, est complété). Il garde son identité : après une coupure il retrouve sa place et ses sons. Un téléphone silencieux depuis 4 s est marqué absent.

La sensibilité (80 % par défaut) se règle uniquement sur chaque téléphone ; l'ordinateur l'affiche.

## Sons (11)

Grosse caisse, caisse claire, clap, charleston fermé et ouvert, tom aigu, tom grave, cloche, cymbale, et deux voix « wobble » :
- **Wobble « Hé » (ouvert)** et **Wobble « Ho » (fermé)** : souffle « h » puis voyelle (« é » : formants 400 / 2100 / 2700 Hz ; « o » : 400 / 780 / 2800 Hz), formants qui ondulent à 7 Hz, hauteur qui descend comme une exclamation.

## Version locale (sans Internet, Mac ou Linux)

Double-clic sur `LANCER SEB-MULTIGYRO-BATTERIE.command` : serveur local et fenêtre Chrome avec le son actif. Ports 8081 (ordinateur) et 8444 (téléphones), différents de SEB-GYROBATTERIE : les deux peuvent tourner en même temps. Les téléphones acceptent l'avertissement de certificat la première fois.

## Limites connues

- Wi-Fi public ou d'établissement : il isole souvent les appareils entre eux, la connexion directe échoue. Prévoir son propre routeur.
- Décalage de 10 à 40 ms selon le téléphone.
- Testé avec 10 téléphones simulés ; pas encore avec de vrais téléphones en nombre.

## Déclenchement précoce (toujours actif)

Le coup part **dès que le geste dépasse le seuil**, sans attendre le sommet du geste : environ **78 ms de gagnés** en moyenne (de 33 à 133 ms selon la vitesse du geste ; mesuré dans le navigateur à 60 mesures/s). Ce n'est plus une option : c'est le seul mode, depuis le 21/10/2026. La force du coup est estimée d'après la vitesse et son accélération à cet instant.

## Les 3 gestes (depuis le 22/10/2026 au soir)

Le téléphone apprend **3 gestes** : coup **vers le bas**, **vers le haut**, **vers la gauche** (les sons choisis sur l'ordinateur pour ce téléphone ; pour un téléphone déjà connu, la gauche a pris le son qu'avait la droite). Le coup vers la droite a été retiré : un mouvement vers la droite qui n'est pas le retour d'un coup vers la gauche sonne quand même, le plus souvent comme le geste « haut ».

- **3 gestes par défaut** : fournis d'office (`gestes-defaut.js` : 10 vrais coups de chaque, appris sur iPhone dans SOLO le 22/10/2026 à 19 h 46, aucun coup écarté ; ils se reconnaissent entre eux à 100 %), avec les réglages de cette séance : **attente 0 ms**, **sensibilité 80 %**. Ils s'appliquent dès l'ouverture, sans rien apprendre : les apprentissages faits avant (à 4 gestes) sont ignorés, et la sensibilité a été remise une fois à 80 % sur chaque téléphone. Ils valent pour cette prise en main ; une autre personne ou un téléphone tenu autrement devra réapprendre.
- **Réapprentissage** (environ 1 min, bouton « Réapprendre mes 3 gestes ») : 10 coups de chaque geste ; ils remplacent les exemples par défaut, guidés à l'écran et **au son** joués par l'ordinateur : 1 bip l'écoute commence · un petit bip aigu à chaque coup compté · 2 bips geste enregistré · 3 bips montants terminé. Le premier coup de chaque geste doit partir d'une position immobile : il fixe le sens du geste, et un mouvement d'installation juste après le départ ne doit pas servir de référence. Le vrai coup est nettement plus vif que l'élan qui le précède et que le retour (3 à 5 fois sur iPhone) : si un mouvement en sens inverse beaucoup plus fort arrive en début de geste, l'app comprend qu'elle avait pris l'élan pour le coup et repart de ce coup fort ; un mouvement beaucoup plus faible que les coups comptés est ignoré. Seuls les coups dans le sens du geste comptent : le retour du poignet n'est ni compté ni appris, et un coup qui déborde sur le geste suivant est ignoré. Les gestes appris restent dans le téléphone et servent aux trois apps (SEB-GYROBATTERIE, SEB-MULTIGYRO-BATTERIE, SEB-SOLOGYRO-BATTERIE).
- **Moment du son** (réglage sur le téléphone) : **au début du geste** (le plus rapide, par défaut) ou **à l'arrêt du geste** : le son part quand le geste s'arrête net, comme une baguette sur une peau (environ 0,17 s après le début du geste) ; un élan ou un retour, qui ralentit en douceur, ne sonne pas. Sur les vrais mouvements de l'iPhone : 85 % des coups gardés, environ 3 élans sur 10 et 1 retour sur 4 sonnent encore (au lieu de 3 sur 4 au début du geste). À comparer en jouant.
- **Détection** : sur la vitesse de rotation de tous les axes ; le coup part dès que le seuil est franchi. Un coup est fini dès que la rotation retombe sous le tiers de son sommet (pause minimale 80 ms) ; le rebond du poignet, plus faible et en sens inverse, ne compte pas. Un geste qui ralentit au milieu puis repart dans le même sens (à moins de 45°) sans retour du poignet entre les deux ne compte qu'une fois. Tous les coups détectés jusqu'à 6 par seconde, environ 97 % à 8 par seconde.
- **Reconnaissance** : la forme de la rotation et de l'accélération est comparée aux exemples appris (plus proches voisins, `gestes.js`). Le retour du poignet après un coup vers la gauche est un mouvement vers la droite, presque aussi vif que le coup : **après un coup vers la gauche, un mouvement en sens inverse dans les 0,6 s ne sonne pas** (retours mesurés sur iPhone de 0,13 à 0,73 s après le coup). Haut et bas ne sont pas concernés.
- **Attente avant de jouer** : réglée d'office, plus de choix à l'écran : 0 ms par défaut ; après un réapprentissage, la plus courte qui reconnaît au moins 95 % des exemples.
- **Prise en main** : garder la même qu'à l'apprentissage ; varier les coups pendant l'apprentissage (forts, doux, bras haut, bras bas) si on les varie en jouant.
- **Gyroscope obligatoire** : un téléphone sans gyroscope (accéléromètre seul, rare) ne peut plus jouer, l'écran le signale.
- Mesuré sur des gestes simulés : apprentissage avec des retours aussi rapides que le coup, retours tous écartés ; 3 gestes joués à une seconde d'intervalle tous reconnus. Tests : `node test-gestes.js`.

Historique : jusqu'au 21/10/2026, une calibration de 4 coups (2 vers le haut, 2 vers le bas) apprenait le sens de rotation du poignet, pour 2 sons seulement (grosse caisse en bas, cymbale en haut). Les 4 gestes appris ont d'abord été essayés dans un prototype de SEB-SOLOGYRO-BATTERIE. Du 21/10 au 22/10/2026 au soir, 4 gestes (la droite jouait la caisse claire, la gauche « Oh ! »), appris avec 15 puis 50 coups, et un bouton « diagnostic » qui envoyait l'enregistrement de l'apprentissage et du jeu ; tous deux retirés.

## Licence

SEB-MULTIGYRO-BATTERIE · Sébastien Gay · Octobre 2026 · [CC BY-NC 4.0](LICENSE) : partage et adaptation libres en citant l'auteur, sans usage commercial. PeerJS et qrcode-generator gardent leur licence MIT.

## Fichiers

- `index.html` : page ordinateur (QR code, cartes des téléphones, sons, bips) · `telephone.html` : capteur, apprentissage, reconnaissance, envoi
- `gestes.js` : détection et reconnaissance des gestes · `apprentissage.js` : apprentissage guidé · `jeu-gestes.js` : écran du téléphone (apprentissage, attente, jeu), communs aux trois apps
- `liaison.js` : connexion en ligne (WebRTC/PeerJS) ou locale (WebSocket), dans les deux sens
- `detecteur.js` : réglage de sensibilité (et l'ancienne détection, gardée pour ses tests) · `sons.js` : synthèse des 11 sons
- `serveur.js` : serveur de la version locale · `LANCER SEB-MULTIGYRO-BATTERIE.command` : lanceur
- `qrcode.js` (Kazuhiko Arase, MIT) · `peerjs.min.js` (PeerJS 1.5.5, MIT)
- `test-gestes.js` : `node test-gestes.js` (26 tests : détection, reconnaissance, apprentissage, écran du téléphone) · `test.js` : `node test.js` (57 tests, ancienne détection, sons, serveur)
