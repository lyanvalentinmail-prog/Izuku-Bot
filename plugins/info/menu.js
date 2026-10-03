import config from '../../config.js'
import { formatTime } from '../../lib/functions.js'

const EMOJI = {
  info: 'ℹ️',
  perfil: '👤',
  ia: '🧠',
  herramientas: '🛠️',
  descargas: '📥',
  stickers: '🎨',
  juegos: '🎮',
  economia: '💰',
  busqueda: '🔎',
  grupos: '👥',
  subbots: '🤖',
  owner: '👑'
}

const TITLE = {
  info: 'INFORMACIÓN',
  perfil: 'PERFIL',
  ia: 'INTELIGENCIA ARTIFICIAL',
  herramientas: 'HERRAMIENTAS',
  descargas: 'DESCARGAS',
  stickers: 'STICKERS',
  juegos: 'JUEGOS',
  economia: 'ECONOMÍA',
  busqueda: 'BÚSQUEDA',
  grupos: 'GRUPOS',
  subbots: 'SUB-BOTS',
  owner: 'DUEÑO'
}

const ORDER = ['info', 'perfil', 'ia', 'herramientas', 'descargas', 'stickers', 'juegos', 'economia', 'busqueda', 'grupos', 'subbots', 'owner']

export default {
  command: ['menu', 'help', 'ayuda', 'comandos'],
  category: 'info',
  desc: 'Muestra todos los comandos disponibles',

  async run({ sock, m, plugins, usedPrefix, user, text }) {
    // Agrupar plugins por categoria
    const cats = {}
    for (const p of plugins.values()) {
      if (p.hidden) continue
      const c = p.category || 'info'
      cats[c] = cats[c] || []
      cats[c].push(p)
    }

    const filter = text?.toLowerCase().trim()
    const keys = ORDER.filter((k) => cats[k]).concat(Object.keys(cats).filter((k) => !ORDER.includes(k)))

    let body = ''
    for (const key of keys) {
      if (filter && key !== filter) continue
      body += `\n╭──「 ${EMOJI[key] || '📁'} *${TITLE[key] || key.toUpperCase()}* 」\n`
      for (const p of cats[key]) {
        body += `│ ⬡ ${usedPrefix}${p.command[0]}${p.desc ? ` — ${p.desc}` : ''}\n`
      }
      body += '╰────────────────\n'
    }

    if (!body) body = `\nNo existe la categoría *${filter}*.\nUsa *${usedPrefix}menu* para verlas todas.`

    const header =
`╔═══════════════════════╗
   🤖 *${config.botName.toUpperCase()}*
╚═══════════════════════╝

👋 Hola *${m.pushName || 'usuario'}*
🏅 Nivel: *${user.level}*  |  ✨ XP: *${user.exp}*
💰 Monedas: *${user.coins}*
⏱️ Activo: *${formatTime(process.uptime() * 1000)}*
🔣 Prefijo: *${usedPrefix || 'ninguno'}*
📂 Comandos: *${plugins.size}*
${body}
💡 Tip: *${usedPrefix}menu <categoría>* para filtrar.
   Ej: *${usedPrefix}menu juegos*`

    try {
      await sock.sendMessage(m.chat, {
        image: { url: config.menuImage },
        caption: header
      }, { quoted: m })
    } catch {
      await m.reply(header)
    }
  }
}
