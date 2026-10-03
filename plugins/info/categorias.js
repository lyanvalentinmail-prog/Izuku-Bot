import config from '../../config.js'
import { CATS } from './menu.js'

export default {
  command: ['categorias', 'cat', 'categoria'],
  category: 'info',
  desc: 'Lista todas las categorías de comandos',

  async run({ sock, m, plugins, usedPrefix }) {
    const cats = {}
    for (const p of plugins.values()) {
      if (p.hidden) continue
      ;(cats[p.category || 'info'] = cats[p.category || 'info'] || []).push(p)
    }

    const orden = [...Object.keys(CATS).filter((k) => cats[k]), ...Object.keys(cats).filter((k) => !CATS[k])]

    let txt =
`╭━━〔 📂 *CATEGORÍAS* 〕━━⬣
┃ ${config.botName} — *${plugins.size}* comandos
┃ en *${orden.length}* categorías
╰━━━━━━━━━━━━━━━━⬣
`
    for (const key of orden) {
      const c = CATS[key] || { emoji: '📁', title: key.toUpperCase(), sub: '' }
      txt += `\n${c.emoji} *${c.title}* — _${cats[key].length} cmd_\n    ${c.sub || ''}\n    ▸ \`${usedPrefix}menu ${key}\``
    }

    txt += `\n\n╭──〔 💡 *CÓMO USARLO* 〕
│ *${usedPrefix}menu ${orden[0]}* → solo esa categoría
│ *${usedPrefix}menu* → el menú completo
│ *${usedPrefix}categorias* → esta lista
╰────────────────⬣`

    await sock.sendButtons(
      m.chat,
      txt,
      `${config.botName} • ${plugins.size} comandos`,
      [
        { id: `${usedPrefix}menu`, texto: '📜 Menú completo' },
        { id: `${usedPrefix}infobot`, texto: 'ℹ️ Info del bot' }
      ],
      m
    )
  }
}
