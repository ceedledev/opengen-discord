async function logToDiscord(client, config, { userTag, userId, service, account }) {
  const channel = await client.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const timestamp = new Date().toLocaleString('fr-FR');
  const message = `📝 \`${timestamp}\`\n👤 **${userTag}** (\`${userId}\`) a généré un compte **${service}**\n🔑 \`${account}\``;

  channel.send({ content: message });
}

module.exports = { logToDiscord };