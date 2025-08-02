module.exports = {
  token: 'LE_TOKEN_DE_TON_BOT_DISCORD',
  channelId: 'ID_DU_SALON_OU_SERA_ENVOYER_LEMBED_DE_GENERATION',
  logChannelId: 'ID_DU_SALON_OU_SERA_ENVOYER_LES_LOGS',

  services: {
    get_netflix: { file: 'netflix.txt', emoji: '📺' },
    get_pornhub: { file: 'pornhub.txt', emoji: '🔥' },
    // get_disney: { file: 'disney.txt', emoji: '🎬' },
  },

  messages: {
    noFile: 'Fichier introuvable.',
    noAccounts: 'Plus de comptes disponibles.',
    sent: (service, account) => `🎁 Voici ton compte **${service}** : \`${account}\``,
    confirmation: 'Le compte t’a été envoyé en privé.',
    error: 'Une erreur est survenue.'
  },

  cooldown: {
    enabled: true,
    timeInSeconds: 900, // 15 minutes
    message: remaining => `⏳ Merci de patienter encore **${remaining} secondes** avant de demander un autre compte.`
  }
};