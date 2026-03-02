const fs = require('fs');

// Fichiers utilisés pour les probes
const STARTUP_FILE = '/tmp/startup-probe';
const READINESS_FILE = '/tmp/readiness-probe';

// Fonction pour signaler que le bot a démarré
function setStarted() {
   fs.mkdirSync('/tmp', { recursive: true });
   fs.writeFileSync(STARTUP_FILE, 'started');
}

// Fonction pour signaler que le bot est prêt
function setReady() {
   fs.mkdirSync('/tmp', { recursive: true });
   fs.writeFileSync(READINESS_FILE, 'ready');
}

// Fonction pour signaler un arrêt
function setNotReady() {
   if (fs.existsSync(READINESS_FILE)) {
      fs.unlinkSync(READINESS_FILE);
   }
}

module.exports = { setStarted, setReady, setNotReady };
