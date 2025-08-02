const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logToDiscord } = require('../utils/logDiscord');
const { getUserGenerationCount, incrementUserGeneration } = require('../utils/limits');

const cooldowns = new Map();

module.exports = async function handleButton(interaction, config, client) {
  const fileName = config.services[interaction.customId]?.file;
  if (!fileName) return;

  const userId = interaction.user.id;
  const userTag = interaction.user.tag;
  const now = Date.now();

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  const hasPremium = member?.roles.cache.has(config.roles.Premium);
  const tier = hasPremium ? 'Premium' : 'Free';
  const limit = config.tiers[tier].limitPerDay;
  const currentCount = getUserGenerationCount(userId);

  if (currentCount >= limit) {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setDescription(`🚫 Tu as atteint ta limite journalière de **${limit} comptes** pour le grade **${tier}**.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (config.cooldown.enabled) {
    const cooldownTime = config.cooldown.timeInSeconds * 1000;
    const expiration = cooldowns.get(userId);

    if (expiration && now < expiration) {
      const remaining = Math.ceil((expiration - now) / 1000);
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(`⏳ Tu dois attendre encore **${remaining}s** avant de pouvoir générer un nouveau compte.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    cooldowns.set(userId, now + cooldownTime);
  }

  const serviceName = fileName.replace('.txt', '');
  const filePath = path.join(__dirname, '..', 'accounts', fileName);

  try {
    if (!fs.existsSync(filePath)) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(`Le fichier pour \`${serviceName}\` est introuvable.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    let data = fs.readFileSync(filePath, 'utf-8').split('\n').filter(line => line.trim() !== '');
    if (data.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(`Aucun compte disponible pour \`${serviceName}\`.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const account = data.shift();
    fs.writeFileSync(filePath, data.join('\n'));

    await logToDiscord(client, config, {
      userTag,
      userId,
      service: serviceName,
      account
    });

    incrementUserGeneration(userId);

    const accountEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(
        `# 📂 Ton compte \`${serviceName}\`\n` +
        `\`\`\`${account}\`\`\`\n` +
        `-# Merci de laisser un avis via les boutons ci-dessous.`
      );

    if (config.feedback.enabled) {
      const feedbackRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`feedback_success_${serviceName}`)
          .setLabel('Fonctionne')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`feedback_fail_${serviceName}`)
          .setLabel('Ne fonctionne pas')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.user.send({
        content: `${account}`,
        embeds: [accountEmbed],
        components: [feedbackRow]
      });
    } else {
      await interaction.user.send({ embeds: [accountEmbed] });
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(`📬 Le compte \`${serviceName}\` t’a été envoyé en privé.`);
    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

  } catch (err) {
    const errorEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setDescription('Une erreur est survenue lors de la génération du compte.');
    interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
};