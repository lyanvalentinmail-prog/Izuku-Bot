import db from '../../lib/database.js'
import { CLASES, barraVida, stats, xpNecesaria } from '../../lib/rpg.js'
import { ITEMS } from '../../lib/shop.js'

export default {
  command: ['ficha', 'stats', 'rpg'],
  category: 'rpg',
  desc: 'Muestra la ficha de tu personaje',
  async run({ sock, m, usedPrefix }) {
    const target = m.mentionedJid[0] || m.quoted?.sender || m.sender
    const data = db.user(target)
    if (!data.rpg) {
      return m.reply(target === m.sender
        ? `🎭 Todavía no tienes personaje.\nCréalo con *${usedPrefix}crear*`
        : '🎭 Ese usuario aún no tiene personaje.')
    }

    const r = data.rpg
    const c = CLASES[r.clase]
    const s = stats(r)
    const arma = r.weapon ? `${ITEMS[r.weapon].emoji} ${ITEMS[r.weapon].name}` : '— sin arma —'
    const armadura = r.armor ? `${ITEMS[r.armor].emoji} ${ITEMS[r.armor].name}` : '— sin armadura —'
    const total = r.wins + r.loses

    await sock.sendMessage(m.chat, {
      text:
`╔══════════════════════╗
    ${c.emoji} *FICHA DE PERSONAJE*
╚══════════════════════╝
   @${target.split('@')[0]}

╭──「 🎭 *CLASE* 」
│ ${c.emoji} ${c.name}
│ 🏅 Nivel *${r.level}*
│ ✨ XP ${r.xp}/${xpNecesaria(r.level)}
╰────────────────
╭──「 📊 *ESTADÍSTICAS* 」
│ ❤️ ${barraVida(r.hp, s.maxHp)}
│ ⚔️ Ataque: *${s.atk}*
│ 🛡️ Defensa: *${s.def}*
│ 💥 Crítico: *${Math.round(s.crit * 100)}%*
╰────────────────
╭──「 🎒 *EQUIPO* 」
│ 🗡️ Arma: ${arma}
│ 🛡️ Armadura: ${armadura}
╰────────────────
╭──「 🏆 *HISTORIAL* 」
│ ✅ Victorias: *${r.wins}*
│ ❌ Derrotas: *${r.loses}*
│ 📈 Ratio: *${total ? Math.round((r.wins / total) * 100) : 0}%*
╰────────────────`,
      mentions: [target]
    }, { quoted: m })
  }
}
