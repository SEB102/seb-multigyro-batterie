// Serveur local : HTTPS (obligatoire pour lire les capteurs du téléphone) + WebSocket fait main.
// HTTP en plus, pour la page ordinateur ouverte en localhost (pas d'avertissement de certificat).
// Relaie tout ce qu'envoie le téléphone vers la (ou les) page(s) ordinateur.
// Lancer : node serveur.js   — aucune dépendance npm.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const DOSSIER = __dirname;
const PORT = Number(process.env.PORT) || 8444;
const PORT_HTTP = Number(process.env.PORT_HTTP) || 8081;
const FICHIERS = {   // seuls fichiers servis
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/telephone.html': ['telephone.html', 'text/html'],
  '/detecteur.js': ['detecteur.js', 'text/javascript'],
  '/sons.js': ['sons.js', 'text/javascript'],
  '/gestes.js': ['gestes.js', 'text/javascript'],
  '/apprentissage.js': ['apprentissage.js', 'text/javascript'],
  '/jeu-gestes.js': ['jeu-gestes.js', 'text/javascript'],
  '/qrcode.js': ['qrcode.js', 'text/javascript'],
  '/liaison.js': ['liaison.js', 'text/javascript'],
  '/peerjs.min.js': ['peerjs.min.js', 'text/javascript'],
};

function adressesLocales() {
  return Object.values(os.networkInterfaces()).flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address);
}

// Certificat auto-signé créé au premier lancement, recréé si l'adresse Wi-Fi a changé.
// Règles Apple (sinon l'iPhone refuse sans proposer de continuer) : 825 jours maximum,
// usage « serveur » (serverAuth) obligatoire, nom dans le SAN, RSA 2048 + SHA-256.
const DUREE_JOURS = 820;
function certificatAJour(fichier) {
  if (!fs.existsSync(fichier)) return false;
  const c = new crypto.X509Certificate(fs.readFileSync(fichier));
  const noms = c.subjectAltName || '';
  const duree = (Date.parse(c.validTo) - Date.parse(c.validFrom)) / 86400000;
  return adressesLocales().every((ip) => noms.includes('IP Address:' + ip))
    && (c.keyUsage || []).includes('1.3.6.1.5.5.7.3.1') && duree <= 825 && Date.parse(c.validTo) > Date.now();
}
function certificat() {
  const cle = path.join(DOSSIER, 'cle.pem'), cert = path.join(DOSSIER, 'cert.pem');
  if (!fs.existsSync(cle) || !certificatAJour(cert)) {
    const san = ['DNS:localhost', 'IP:127.0.0.1', ...adressesLocales().map((ip) => 'IP:' + ip)].join(',');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', String(DUREE_JOURS),
      '-keyout', cle, '-out', cert, '-subj', '/CN=seb-multigyro-batterie',
      '-addext', 'subjectAltName=' + san,
      '-addext', 'extendedKeyUsage=serverAuth',
      '-addext', 'keyUsage=critical,digitalSignature,keyEncipherment',
      '-addext', 'basicConstraints=critical,CA:FALSE'],
      { stdio: 'ignore' });
  }
  return { key: fs.readFileSync(cle), cert: fs.readFileSync(cert) };
}

// ---- WebSocket minimal (RFC 6455) ----
function trame(texte) {
  const data = Buffer.from(texte);
  let entete;
  if (data.length < 126) entete = Buffer.from([0x81, data.length]);
  else if (data.length < 65536) { entete = Buffer.alloc(4); entete[0] = 0x81; entete[1] = 126; entete.writeUInt16BE(data.length, 2); }
  else { entete = Buffer.alloc(10); entete[0] = 0x81; entete[1] = 127; entete.writeBigUInt64BE(BigInt(data.length), 2); }
  return Buffer.concat([entete, data]);
}

function brancher(socket, surMessage, surFin) {
  let tampon = Buffer.alloc(0);
  socket.on('data', (morceau) => {
    tampon = Buffer.concat([tampon, morceau]);
    while (tampon.length >= 2) {
      const opcode = tampon[0] & 0x0f, masque = tampon[1] & 0x80;
      let longueur = tampon[1] & 0x7f, pos = 2;
      if (longueur === 126) { if (tampon.length < 4) return; longueur = tampon.readUInt16BE(2); pos = 4; }
      else if (longueur === 127) { if (tampon.length < 10) return; longueur = Number(tampon.readBigUInt64BE(2)); pos = 10; }
      const cle = masque ? tampon.subarray(pos, pos + 4) : null;
      if (masque) pos += 4;
      if (tampon.length < pos + longueur) return;
      const charge = Buffer.from(tampon.subarray(pos, pos + longueur));
      if (cle) for (let i = 0; i < charge.length; i++) charge[i] ^= cle[i & 3];
      tampon = tampon.subarray(pos + longueur);
      if (opcode === 0x1) surMessage(charge.toString());
      else if (opcode === 0x8) { socket.end(Buffer.from([0x88, 0])); return; }
      else if (opcode === 0x9) socket.write(Buffer.concat([Buffer.from([0x8a, charge.length]), charge]));
    }
  });
  socket.on('close', surFin);
  socket.on('error', () => socket.destroy());
}

// portHttp : page ordinateur, écoute seulement sur cette machine (127.0.0.1)
function demarrer(port = PORT, { portHttp = PORT_HTTP, silencieux = false } = {}) {
  const ordinateurs = new Set();
  const telephones = new Set();
  const diffuser = (groupe, texte) => { const t = trame(texte); for (const s of groupe) s.write(t); };
  const etat = () => diffuser(ordinateurs, JSON.stringify({ telephones: telephones.size }));

  function repondre(req, res) {
    const chemin = new URL(req.url, 'https://x').pathname;
    if (chemin === '/adresses') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(adressesLocales().map((ip) => `https://${ip}:${serveur.address().port}/telephone.html`)));
    }
    const f = FICHIERS[chemin];
    if (!f) { res.writeHead(404); return res.end('introuvable'); }
    res.writeHead(200, { 'Content-Type': f[1] + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(path.join(DOSSIER, f[0])));
  }

  function ouvrirWebSocket(req, socket) {
    const url = new URL(req.url, 'https://x');
    const cle = req.headers['sec-websocket-key'];
    if (url.pathname !== '/ws' || !cle) return socket.destroy();
    const accepte = crypto.createHash('sha1').update(cle + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accepte}\r\n\r\n`);
    socket.setNoDelay(true);
    if (url.searchParams.get('role') === 'telephone') {
      telephones.add(socket);
      brancher(socket, (m) => diffuser(ordinateurs, m), () => { telephones.delete(socket); etat(); });
    } else {
      ordinateurs.add(socket);
      brancher(socket, (m) => diffuser(telephones, m), () => ordinateurs.delete(socket));
    }
    etat();
  }

  const serveur = https.createServer(certificat(), repondre);
  const serveurHttp = http.createServer(repondre);
  for (const s of [serveur, serveurHttp]) s.on('upgrade', ouvrirWebSocket);

  const ecouter = (s, p, hote) => new Promise((res, rej) => { s.once('error', rej); s.listen(p, hote, res); });
  return Promise.all([ecouter(serveur, port), ecouter(serveurHttp, portHttp, '127.0.0.1')]).then(() => {
    if (!silencieux) {
      const p = serveur.address().port;
      console.log('\n  SEB-MULTIGYRO-BATTERIE lancé\n');
      console.log(`  Ordinateur : http://localhost:${serveurHttp.address().port}`);
      for (const ip of adressesLocales()) console.log(`  Téléphone  : https://${ip}:${p}/telephone.html`);
      console.log('\n  (sur le téléphone, accepter l\'avertissement de certificat la première fois)\n');
    }
    return { https: serveur, http: serveurHttp, close() { serveur.close(); serveurHttp.close(); } };
  });
}

if (require.main === module) demarrer();
module.exports = { demarrer };
