module.exports = {
  token: 'LE_TOKEN_DU_BOT',
  channelId: 'SALON_OU_ET_ENVOYER_EMBED',
  logChannelId: 'SALON_LOG',

  services: {
    get_netflix: { file: 'netflix.txt', emoji: '📺' },
    get_pornhub: { file: 'pornhub.txt', emoji: '🔥' },
    // get_disney: { file: 'disney.txt', emoji: '🎬' },
  },
  
  webserver: {
    enabled: true,
    PORT: 3004,
    restockChannelId: 'SALON_LOG_RESTOCK'
  },
  
  adminAuth: {
    username: 'admin',
    password: 'admin' // Tu peux modifier !
  },

  cooldown: {
    enabled: true,
    timeInSeconds: 900
  },

  feedback: {
    enabled: true,
    channelId: 'SALON_AVIS'
  },
  
  tiers: {
    Free: {
      limitPerDay: 5 // Limite de 5 generation par jour pour les utilisateur FREE
    },
    Premium: {
      limitPerDay: 20 // Limite de 20 generation par jour pour les utilisateur PREMIUM
    }
  },

  roles: {
    Premium: 'ROLE_ID_PREMIUM'
  }
};