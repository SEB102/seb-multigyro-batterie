# SEB-MULTIGYRO-BATTERIE

Plusieurs téléphones (iPhone et Android mélangés) servent de baguettes, **chacun avec ses propres sons**. Chaque coup, dans n'importe quel sens, joue à tour de rôle le son 1 puis le son 2 du téléphone. Les sons sortent de l'ordinateur (synthétisés, aucun fichier audio).

Prototype (étude de faisabilité). Petite sœur de [SEB-GYROBATTERIE](https://github.com/SEB102/seb-gyrobatterie) (un seul téléphone).

## Utilisation

**Ordinateur** : ouvrir **https://seb102.github.io/seb-multigyro-batterie/** et cliquer une fois dans la page (le navigateur coupe le son tant qu'on n'a pas cliqué).

**Téléphones** : chacun scanne le QR code affiché. **L'ordinateur et les téléphones doivent être connectés au même réseau Wi-Fi.**
- iPhone : toucher « Toucher pour démarrer » puis autoriser « Mouvement ». Android : démarre tout seul.
- La première fois : **donner 3 coups secs**, comme avec une baguette, dans n'importe quel sens (calibration). Chaque coup reconnu s'affiche (● ○ ○), et c'est fini dès le 3e. Puis jouer.

**Sur l'ordinateur**, chaque téléphone a sa carte : numéro, couleur, son 1, son 2 (mettre deux fois le même pour un son fixe), sensibilité. Le téléphone affiche son numéro et ses sons dans sa couleur. Il garde son identité : après une coupure il retrouve sa place et ses sons. Un téléphone silencieux depuis 4 s est marqué absent.

La sensibilité se règle uniquement sur chaque téléphone ; l'ordinateur l'affiche.

## Sons (11)

Grosse caisse, caisse claire, clap, charleston fermé et ouvert, tom aigu, tom grave, cloche, cymbale, et deux voix « wobble » :
- **Wobble « Hé » (ouvert)** et **Wobble « Ho » (fermé)** : souffle « h » puis voyelle (« é » : formants 400 / 2100 / 2700 Hz ; « o » : 400 / 780 / 2800 Hz), formants qui ondulent à 7 Hz, hauteur qui descend comme une exclamation.

## Version locale (sans Internet, Mac ou Linux)

Double-clic sur `LANCER SEB-MULTIGYRO-BATTERIE.command` : serveur local et fenêtre Chrome avec le son actif. Ports 8081 (ordinateur) et 8444 (téléphones), différents de SEB-GYROBATTERIE : les deux peuvent tourner en même temps. Les téléphones acceptent l'avertissement de certificat la première fois.

## Limites connues

- Wi-Fi public ou d'établissement : il isole souvent les appareils entre eux, la connexion directe échoue. Prévoir son propre routeur.
- Décalage de 10 à 40 ms selon le téléphone.
- Testé avec 10 téléphones simulés ; pas encore avec de vrais téléphones en nombre.

## Déclenchement précoce

Case à cocher sur le téléphone : le coup part **dès que le geste dépasse le seuil**, au lieu d'attendre le sommet du geste. La force du coup est alors estimée d'après la vitesse et son accélération à cet instant (un peu moins fidèle). Le téléphone mesure à chaque coup le temps gagné et affiche la moyenne.

Mesures (navigateur, gestes simulés à 60 mesures/s) : environ **78 ms de gagnés** en moyenne (de 33 à 133 ms selon la vitesse du geste ; plus le geste est lent, plus le gain est grand). Désactivée par défaut : le mode « sommet » reste inchangé.

## Licence

SEB-MULTIGYRO-BATTERIE · Sébastien Gay · Octobre 2026 · [CC BY-NC 4.0](LICENSE) : partage et adaptation libres en citant l'auteur, sans usage commercial. PeerJS et qrcode-generator gardent leur licence MIT.

## Fichiers

- `index.html` : page ordinateur (QR code, cartes des téléphones, sons) · `telephone.html` : capteur, calibration, détection, envoi
- `liaison.js` : connexion en ligne (WebRTC/PeerJS) ou locale (WebSocket), dans les deux sens
- `detecteur.js` : détection des coups, calibration, alternance · `sons.js` : synthèse des 11 sons
- `serveur.js` : serveur de la version locale · `LANCER SEB-MULTIGYRO-BATTERIE.command` : lanceur
- `qrcode.js` (Kazuhiko Arase, MIT) · `peerjs.min.js` (PeerJS 1.5.5, MIT)
- `test.js` : `node test.js`
