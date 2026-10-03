import db from '../../lib/database.js'
import { CLASES, barraVida, combate, revisarNivel, stats } from '../../lib/rpg.js'

export default {
  command: ['duelo', 'pvp', 'retar'],
  category: 'rpg',
  desc: 'Reta a otro jugador a un duelo',
  register: true, group: true,
  async run({ sock, m, user, usedPrefix, command }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`⚔️ Uso: *${usedPrefix}${command} @usuario*`)
    if (target === m.sender) return m.reply('🤨 No puedes retarte a ti mismo.')

    const rival = db.user(target)
    if (!rival.rpg) return m.reply('🎭 Ese usuario todavía no tiene personaje.')
    if (user.rpg.hp <= 0) return m.reply(`💀 Estás derrotado, cúrate con *${usedPrefix}curar*`)
    if (rival.rpg.hp <= 0) return m.reply('💀 Tu rival está fuera de combate.')

    const a = user.rpg, b = rival.rpg
    const sa = stats(a), sb = stats(b)

    // Combate simétrico: el rival actúa como "enemigo"
    const res = combate(a, { name: CLASES[b.clase].name, hp: b.hp, atk: sb.atk, def: sb.def })
    a.hp = res.hpJugador

    const gano = res.ganador === 'jugador'
    const premio = Math.min(1000, Math.round((gano ? rival : user).coins * 0.1))

    if (gano) { a.wins++; b.loses++; a.xp += 120; user.coins += premio; rival.coins -= premio; b.hp = Math.max(0, res.hpEnemigo) }
    else { a.loses++; b.wins++; b.xp += 120; user.coins -= premio; rival.coins += premio }

    revisarNivel(a); revisarNivel(b)

    await sock.sendMessage(m.chat, {
      text:
`⚔️ *DUELO PVP*

${CLASES[a.clase].emoji} @${m.sender.split('@')[0]} (Nv.${a.level})
          🆚
${CLASES[b.clase].emoji} @${target.split('@')[0]} (Nv.${b.level})

${res.log.slice(0, 6).join('\n')}${res.log.length > 6 ? '\n...' : ''}

🏆 *GANADOR:* @${(gano ? m.sender : target).split('@')[0]}
💰 Apuesta: *${premio}* monedas
✨ +120 XP

❤️ Tu vida: ${barraVida(a.hp, sa.maxHp)}`,
      mentions: [m.sender, target]
    }, { quoted: m })
  }
}
