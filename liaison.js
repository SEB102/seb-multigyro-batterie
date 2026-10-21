// Liaison téléphones ↔ ordinateur, deux modes :
// - local : WebSocket via serveur.js (page ouverte en localhost ou par l'adresse IP du Mac)
// - en ligne : WebRTC direct entre les appareils, mis en relation par le serveur public PeerJS
//   (pages hébergées en https avec un vrai certificat : aucun avertissement)
// Forcer un mode : ajouter ?mode=local ou ?mode=enligne à l'adresse.
//
// Messages : chaque téléphone a un identifiant fixe (gardé dans sa mémoire), ajouté à tout ce qu'il
// envoie (champ « de »). L'ordinateur envoie à tous ; un champ « pour » réserve le message à un seul.
(function (racine) {
  const PREFIXE = 'gyrobat-';
  const memoire = {
    lire(k) { try { return localStorage.getItem(k); } catch { return null; } },
    ecrire(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  function modeEnLigne() {
    const force = new URLSearchParams(location.search).get('mode');
    if (force) return force === 'enligne';
    const h = location.hostname;
    return !(h === 'localhost' || h === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(h));
  }

  const hasard = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (o) => 'abcdefghijkmnpqrstuvwxyz23456789'[o % 32]).join('');
  const nouvelId = () => PREFIXE + hasard(6);
  const OPTIONS_CONNEXION = { reliable: true, serialization: 'json' };
  const ERREURS_RESEAU = ['network', 'server-error', 'socket-error', 'socket-closed'];

  // ---- Ordinateur : reçoit des téléphones, peut leur envoyer ----
  // cleId : un identifiant d'ordinateur différent par page (app et prototype multi n'ont pas le même QR)
  function ordinateur({ surMessage, surTelephones, surAdresses, surProbleme, cleId = 'gyro-batterie-id', pageTelephone = 'telephone.html' }) {
    if (!modeEnLigne()) {
      let ws = null;
      fetch('/adresses').then((r) => r.json()).then(surAdresses);
      const connecter = () => {
        ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?role=ordinateur`);
        ws.onmessage = (m) => {
          const d = JSON.parse(m.data);
          if (typeof d.telephones === 'number') surTelephones(d.telephones); else surMessage(d);
        };
        ws.onopen = () => surProbleme(null);
        ws.onclose = () => { surProbleme('Serveur arrêté ?'); setTimeout(connecter, 1000); };
      };
      connecter();
      return { envoyer: (o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } };
    }

    // Identifiant gardé d'une fois sur l'autre : le lien enregistré sur le téléphone reste bon
    let id = memoire.lire(cleId) || nouvelId();
    const connexions = new Set();
    const compter = () => surTelephones(connexions.size);
    let peer;
    function ouvrir() {
      peer = new Peer(id, { debug: 0 });
      peer.on('open', () => {
        memoire.ecrire(cleId, id);
        surProbleme(null);
        surAdresses([new URL(pageTelephone + location.search, location.href).href + '#' + id]);
      });
      peer.on('connection', (c) => {
        c.on('open', () => { connexions.add(c); compter(); });
        c.on('data', (d) => surMessage(d));
        c.on('close', () => { connexions.delete(c); compter(); });
        c.on('error', () => { connexions.delete(c); compter(); });
      });
      peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => peer.reconnect(), 1000); });
      peer.on('error', (e) => {
        if (e.type === 'unavailable-id') { peer.destroy(); id = nouvelId(); return ouvrir(); }
        if (ERREURS_RESEAU.includes(e.type)) {
          surProbleme('Pas de connexion Internet ? Nouvel essai…');
          peer.destroy(); setTimeout(ouvrir, 2000);
        }
      });
    }
    ouvrir();
    return { envoyer: (o) => { for (const c of connexions) if (c.open) c.send(o); } };
  }

  // ---- Téléphone : envoie, et reçoit ce qui lui est destiné ----
  function telephone({ surEtat, surMessage = () => {} }) {
    let monId = memoire.lire('gyro-batterie-tel-id');
    if (!monId) { monId = 'tel-' + hasard(6); memoire.ecrire('gyro-batterie-tel-id', monId); }
    let envoyerA = null, dernierEnvoi = 0;
    const envoyer = (o) => { if (envoyerA) { dernierEnvoi = Date.now(); envoyerA({ ...o, de: monId }); } };
    const recevoir = (d) => { if (d && (!d.pour || d.pour === monId)) surMessage(d); };
    const connecte = (f) => { envoyerA = f; surEtat('Connecté à l\'ordinateur', true); envoyer({ bonjour: true }); };
    // Signe de vie quand le téléphone est immobile : l'ordinateur sait qui est là
    setInterval(() => { if (Date.now() - dernierEnvoi > 1000) envoyer({ ping: true }); }, 1000);

    if (!modeEnLigne()) {
      const connecter = () => {
        const ws = new WebSocket(`wss://${location.host}/ws?role=telephone`);
        ws.onopen = () => connecte((o) => ws.readyState === 1 && ws.send(JSON.stringify(o)));
        ws.onmessage = (m) => recevoir(JSON.parse(m.data));
        ws.onclose = () => { envoyerA = null; surEtat('Connexion perdue, nouvel essai…', false); setTimeout(connecter, 1000); };
      };
      connecter();
      return { envoyer, id: monId };
    }

    const depuisLien = location.hash.slice(1);
    if (depuisLien.startsWith(PREFIXE)) memoire.ecrire('gyro-batterie-cible', depuisLien);
    const cible = memoire.lire('gyro-batterie-cible');
    if (!cible) { surEtat('Scanne le QR code affiché sur l\'ordinateur', false); return { envoyer, id: monId }; }

    let peer, essai;
    const reessayer = (texte) => { envoyerA = null; surEtat(texte, false); clearTimeout(essai); essai = setTimeout(appeler, 2000); };
    function appeler() {
      if (!peer || peer.destroyed) return ouvrir();
      if (peer.disconnected) { peer.reconnect(); return reessayer('Reconnexion…'); }
      const c = peer.connect(cible, OPTIONS_CONNEXION);
      c.on('open', () => connecte((o) => c.open && c.send(o)));
      c.on('data', recevoir);
      c.on('close', () => reessayer('Connexion perdue, nouvel essai…'));
      c.on('error', () => reessayer('Connexion perdue, nouvel essai…'));
    }
    function ouvrir() {
      peer = new Peer({ debug: 0 });
      peer.on('open', appeler);
      peer.on('error', (e) => {
        if (e.type === 'peer-unavailable') reessayer('Ordinateur introuvable : la page SEB-MULTIGYRO-BATTERIE y est-elle ouverte ?');
        else if (ERREURS_RESEAU.includes(e.type)) { peer.destroy(); reessayer('Pas de connexion Internet ? Nouvel essai…'); }
      });
    }
    surEtat('Connexion…', false);
    ouvrir();
    return { envoyer, id: monId };
  }

  racine.Liaison = { modeEnLigne, ordinateur, telephone };
})(this);
