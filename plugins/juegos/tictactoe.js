import db from '../../lib/database.js'

const partidas = new Map()   // chat -> partida
const LINEAS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function tablero(t) {
  const s = t.map((c, i) => c || `${i + 1}️⃣`)
  return `${s[0]}${s[1]}${s[2]}\n${s[3]}${s[4]}${s[5]}\n${s[6]}${s[7]}${s[8]}`
}
function ganador(t) {
  for (const [a, b, c] of LINEAS) if (t[a] && t[a] === t[b] && t[b] === t[c]) return t[a]
  return t.every(Boolean) ? 'empate' : null
}

export default {
  command: ['ttt', 'tictactoe', 'gato', 'tateti'],
  category: 'juegos',
  desc: 'Tres en raya contra otro jugador',
  group: true,
  async run({ sock, m, args, usedPrefix, command }) {
    const partida = partidas.get(m.chat)
    const jugada = parseInt(args[0])

    // ---------- Rendirse ----------
    if (['salir', 'rendirse', 'cancelar'].includes((args[0] || '').toLowerCase())) {
      if (!partida) return m.reply('⚠️ No hay partida activa.')
      partidas.delete(m.chat)
      return m.reply('🏳️ Partida cancelada.')
    }

    // ---------- Jugar ----------
    if (partida && jugada >= 1 && jugada <= 9) {
      const turno = partida.turno
      if (m.sender !== turno) return m.reply('⏳ No es tu turno.')
      if (partida.tablero[jugada - 1]) return m.reply('⚠️ Esa casilla ya está ocupada.')

      partida.tablero[jugada - 1] = partida.simbolos[turno]
      const g = ganador(partida.tablero)
      partida.turno = turno === partida.x ? partida.o : partida.x

      if (g) {
        partidas.delete(m.chat)
        if (g === 'empate') {
          return sock.sendMessage(m.chat, { text: `🤝 *EMPATE*\n\n${tablero(partida.tablero)}` }, { quoted: m })
        }
        db.user(m.sender).coins += 500
        return sock.sendMessage(m.chat, {
          text: `🏆 *¡GANÓ @${m.sender.split('@')[0]}!*\n\n${tablero(partida.tablero)}\n\n💰 +500 monedas`,
          mentions: [m.sender]
        }, { quoted: m })
      }

      return sock.sendMessage(m.chat, {
        text: `❌⭕ *TRES EN RAYA*\n\n${tablero(partida.tablero)}\n\n🎯 Turno de @${partida.turno.split('@')[0]} (${partida.simbolos[partida.turno]})\n_Escribe ${usedPrefix}${command} <1-9>_`,
        mentions: [partida.turno]
      }, { quoted: m })
    }

    // ---------- Crear ----------
    if (partida) {
      return sock.sendMessage(m.chat, {
        text: `⚠️ Ya hay una partida en curso.\n\n${tablero(partida.tablero)}\n\n🎯 Turno de @${partida.turno.split('@')[0]}`,
        mentions: [partida.turno]
      }, { quoted: m })
    }

    const rival = m.mentionedJid[0] || m.quoted?.sender
    if (!rival) return m.reply(`❌⭕ Uso: *${usedPrefix}${command} @usuario*\n\nLuego jueguen con *${usedPrefix}${command} 1* ... *${usedPrefix}${command} 9*`)
    if (rival === m.sender) return m.reply('🤨 Necesitas un rival.')

    const nueva = {
      tablero: Array(9).fill(null),
      x: m.sender, o: rival, turno: m.sender,
      simbolos: { [m.sender]: '❌', [rival]: '⭕' }
    }
    partidas.set(m.chat, nueva)

    await sock.sendMessage(m.chat, {
      text: `❌⭕ *TRES EN RAYA*\n\n❌ @${m.sender.split('@')[0]}\n⭕ @${rival.split('@')[0]}\n\n${tablero(nueva.tablero)}\n\n🎯 Empieza @${m.sender.split('@')[0]}\n_Juega con ${usedPrefix}${command} <1-9>_\n💰 Premio: 500 monedas`,
      mentions: [m.sender, rival]
    }, { quoted: m })
  }
}
