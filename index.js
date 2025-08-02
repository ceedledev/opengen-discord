const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Events
} = require('discord.js');

const config = require('./config');
const handleButton = require('./handlers/buttonHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  console.log(`Connecter en tant que ${client.user.tag}`);

  const channel = await client.channels.fetch(config.channelId);
  if (!channel || !channel.isTextBased()) {
    console.error('Salon introuvable ou peux-etre c\'est un salon vocal.');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎁 Générateur de comptes premium')
    .setDescription('Clique sur un service ci-dessous pour recevoir un compte **gratuitement** en message privé.')
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/5977/5977590.png')
    .setFooter({ text: 'createur: ceedledev', iconURL: client.user.displayAvatarURL() });

  const buttons = Object.entries(config.services).map(([customId, data]) => {
  const label = customId.replace('get_', '').toUpperCase();
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Primary)
    .setEmoji(data.emoji || '🎟️');
});

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  await channel.send({
    embeds: [embed],
    components: rows
  });

  console.log(`Embed avec les generateur envoyer dans #${channel.name}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  handleButton(interaction, config, client);
});

client.login(config.token);