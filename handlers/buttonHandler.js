const fs = require('fs');
const path = require('path');
const { logToDiscord } = require('../utils/logDiscord');

const cooldowns = new Map();

module.exports = async function handleButton(interaction, config, client) {
  const fileName = config.services[interaction.customId]?.file;
  if (!fileName) return;

  const userId = interaction.user.id;
  const userTag = interaction.user.tag;
  const now = Date.now();

  if (config.cooldown.enabled) {
    const cooldownTime = config.cooldown.timeInSeconds * 1000;
    const expiration = cooldowns.get(userId);

    if (expiration && now < expiration) {
      const remaining = Math.ceil((expiration - now) / 1000);
      return interaction.reply({ content: config.cooldown.message(remaining), ephemeral: true });
    }

    cooldowns.set(userId, now + cooldownTime);
  }

  const serviceName = fileName.replace('.txt', '');
  const filePath = path.join(__dirname, '..', 'accounts', fileName);

  try {
    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: config.messages.noFile, ephemeral: true });
    }

    let data = fs.readFileSync(filePath, 'utf-8').split('\n').filter(line => line.trim() !== '');
    if (data.length === 0) {
      return interaction.reply({ content: config.messages.noAccounts, ephemeral: true });
    }

    const account = data.shift();
    fs.writeFileSync(filePath, data.join('\n'));

    await logToDiscord(client, config, {
      userTag,
      userId,
      service: serviceName,
      account
    });

    await interaction.user.send(config.messages.sent(serviceName, account));
    await interaction.reply({ content: config.messages.confirmation, ephemeral: true });

  } catch (err) {
    console.error(err);
    interaction.reply({ content: config.messages.error, ephemeral: true });
  }
};
