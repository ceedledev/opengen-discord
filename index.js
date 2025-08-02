const {
  Client,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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
  console.log(`Connecté en tant que ${client.user.tag}`);

  if (config.webserver.enabled) {
    require("./webServer");
  }
  
  const channel = await client.channels.fetch(config.channelId);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎁 Générateur de comptes premium')
    .setDescription('Clique sur un service ci-dessous pour recevoir un compte **gratuitement** en message privé.')
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/5977/5977590.png')
    .setFooter({ text: 'Créateur : ceedledev', iconURL: client.user.displayAvatarURL() });

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

  console.log(`Embed envoyé dans #${channel.name}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('feedback_')) {
      const parts = interaction.customId.split('_');
      const result = parts.at(-2);
      const service = parts.at(-1);

      if (interaction.message && interaction.message.editable) {
        try {
          await interaction.message.edit({ components: [] });
        } catch (err) {
          const errorEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription('Une erreur est survenue lors de la suppression des boutons.');
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          return;
        }
      }

      const modal = new ModalBuilder()
        .setCustomId(`modal_feedback_${result}_${service}`)
        .setTitle('📝 Laisser un avis');

      const input = new TextInputBuilder()
        .setCustomId('feedback_text')
        .setLabel('Ton avis')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('Exemple : le compte fonctionne bien.');

      const modalRow = new ActionRowBuilder().addComponents(input);
      modal.addComponents(modalRow);

      return await interaction.showModal(modal);
    }

    return handleButton(interaction, config, client);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_feedback_')) {
    const parts = interaction.customId.split('_');
    const result = parts.at(-2);
    const service = parts.at(-1);
    const feedbackText = interaction.fields.getTextInputValue('feedback_text');

    if (!config.feedback.enabled) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription('⚠️ Le système de feedback est désactivé.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const channel = await client.channels.fetch(config.feedback.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription('Impossible d\'envoyer ton avis : salon introuvable.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const status = result === 'success' ? 'Fonctionne' : 'Ne fonctionne pas';

    const embed = new EmbedBuilder()
      .setColor(result === 'success' ? 0x57F287 : 0xED4245)
      .setDescription(`# 🗳️ Avis sur un compte ${service}\n> État du compte : ${status}\n> Avis : ${feedbackText}`)
      .setFooter({ text: `Envoyer par ` + interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription('Merci pour ton retour !');
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
  }
});

client.login(config.token);