import { randomInt } from '../../lib/functions.js'
export default {
  command: ['ship', 'compatibilidad'],
  category: 'diversion',
  desc: 'Mide la compatibilidad entre dos personas',
  group: true,
  async run({ sock, m, participants, usedPrefix, command }) {
    let [a, b] = m.mentionedJid
    if (!a) {
      const otros = participants.map((p) => p.id).filter((j) => j !== m.sender)
      a = m.sender
      b = otros[randomInt(0, otros.length - 1)]
    }
    if (!b) return m.reply(`💘 Uso: *${usedPrefix}${command} @uno @otro*`)

    // Resultado estable: la misma pareja siempre da el mismo porcentaje
    const semilla = [a, b].sort().join('').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const pct = semilla % 101
    const barra = '💖'.repeat(Math.round(pct / 10)).padEnd(10, '🤍')
    const veredicto = pct > 85 ? 'Almas gemelas 💍' : pct > 60 ? '¡Hay química! 🔥' : pct > 35 ? 'Podría funcionar 🤔' : pct > 15 ? 'Mejor amigos 🤝' : 'Ni lo intenten 💀'

    await sock.sendMessage(m.chat, {
      text: `💘 *COMPATIBILIDAD*\n\n@${a.split('@')[0]}\n        ❤️\n@${b.split('@')[0]}\n\n${barra}\n*${pct}%* — ${veredicto}`,
      mentions: [a, b]
    }, { quoted: m })
  }
}
