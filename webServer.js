const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./config');

const app = express();

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

discordClient.login(config.token);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'un_secret_qui_devrait_etre_complexe',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

function checkAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === config.adminAuth.username && password === config.adminAuth.password) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Identifiants incorrects' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/', checkAuth, (req, res) => {
  res.render('index', { services: config.services, message: null });
});

app.post('/restock', checkAuth, async (req, res) => {
  const { service, accounts } = req.body;
  const serviceData = config.services[service];
  const file = serviceData?.file;

  if (!file) {
    return res.render('index', {
      services: config.services,
      message: 'Service inconnu.'
    });
  }

  const filePath = path.join(__dirname, 'accounts', file);
  const cleanAccounts = accounts.split('\n').map(line => line.trim()).filter(Boolean);

  try {
    fs.appendFileSync(filePath, cleanAccounts.join('\n') + '\n');

    if (discordClient.isReady()) {
      const channel = await discordClient.channels.fetch(config.webserver.restockChannelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle('Nouveau restock')
          .setDescription(`Service: ${service.replace('get_', '').toUpperCase()} ${serviceData.emoji || ''}\nComptes ajoutés: ${cleanAccounts.length}`)
          .setColor('#4F46E5')
          .setTimestamp();
        channel.send({ embeds: [embed] });
      }
    }

    res.render('index', {
      services: config.services,
      message: `${cleanAccounts.length} comptes ajoutés à ${service}.`
    });
  } catch (err) {
    res.render('index', {
      services: config.services,
      message: 'Erreur lors de l’écriture dans le fichier.'
    });
  }
});

app.listen(config.webserver.PORT, () => {
  console.log(`Serveur web lancé sur le port ${config.webserver.PORT}`);
});