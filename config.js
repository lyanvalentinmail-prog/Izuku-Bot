// ===============================================
//  IZUKU BOT - Configuracion general
//  Edita este archivo para personalizar tu bot.
// ===============================================

export default {
  // Nombre que se muestra en los menus
  botName: 'Izuku Bot',

  // Numero del dueño (sin +, sin espacios). Ej: '521234567890'
  owner: ['59896719709'],

  // Prefijos aceptados. Pon prefix: [''] para que funcione sin prefijo.
  prefix: ['.', '!', '/', '#'],

  // Nombre del dueño y canal/grupo para el menu
  ownerName: 'Lyan',
  newsletter: 'https://whatsapp.com/channel/0000000000000000000',

  // Imagen que acompaña al menu.
  // Puede ser una URL o un archivo local dentro del proyecto.
  // Si el archivo no existe, el menu se envia solo con texto.
  menuImage: './media/banner.jpg',

  // Modos
  self: false,        // true = el bot solo responde al dueño
  onlyGroups: false,  // true = solo funciona en grupos
  autoRead: false,    // marcar mensajes como leidos
  antiCall: true,     // rechazar llamadas automaticamente

  // Limite de sub-bots simultaneos
  maxSubBots: 20,

  // API Keys (opcionales, para los plugins de IA / busqueda)
  apis: {
    // Deja vacio para usar el endpoint publico gratuito de los plugins
    openai: process.env.OPENAI_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || ''
  },

  // Economia
  economy: {
    dailyReward: 1000,
    workMin: 100,
    workMax: 900,
    robChance: 0.45
  }
}
