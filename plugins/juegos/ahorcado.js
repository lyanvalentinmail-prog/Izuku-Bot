import { random } from '../../lib/functions.js'
const partidas = new Map()
const PALABRAS = ['programacion', 'whatsapp', 'computadora', 'telefono', 'internet', 'javascript', 'termux', 'baileys', 'musica', 'aventura', 'montaña', 'elefante']

export default {
  command: ['ahorcado', 'hangman', 'letra?'],
  category: 'juegos',
  desc: 'Juego del ahorcado (responde con una letra)',
  async run({ m, args, command, usedPrefix, user }) {
    const id = m.chat
    let juego = partidas.get(id)

    if (command === 'ahorcado' || command === 'hangman') {
      if (juego) return m.reply(`⚠️ Ya hay una partida activa:\n\n${render(juego)}`)
      const palabra = random(PALABRAS)
      juego = { palabra, usadas: new Set(), fallos: 0 }
      partidas.set(id, juego)
      return m.reply(`🪢 *AHORCADO*\n\n${render(juego)}\n\nAdivina con *${usedPrefix}letra? a*`)
    }

    // comando letra?
    if (!juego) return m.reply(`⚠️ No hay partida. Inicia una con *${usedPrefix}ahorcado*`)
    const letra = (args[0] || '').toLowerCase()
    if (!/^[a-zñ]$/.test(letra)) return m.reply('⚠️ Escribe *una sola letra*.')
    if (juego.usadas.has(letra)) return m.reply('⚠️ Ya usaste esa letra.')
    juego.usadas.add(letra)
    if (!juego.palabra.includes(letra)) juego.fallos++

    const completa = [...juego.palabra].every((c) => juego.usadas.has(c) || c === 'ñ' && juego.usadas.has('ñ'))
    if (completa) {
      partidas.delete(id)
      user.coins += 300
      return m.reply(`🎉 *¡GANASTE!*\nLa palabra era *${juego.palabra}*\n💰 +300 monedas`)
    }
    if (juego.fallos >= 6) {
      partidas.delete(id)
      return m.reply(`💀 *PERDISTE*\nLa palabra era *${juego.palabra}*`)
    }
    await m.reply(render(juego))
  }
}

function render(j) {
  const muneco = ['', '😵', '😵\n |', '😵\n/|', '😵\n/|\\', '😵\n/|\\\n/', '😵\n/|\\\n/ \\']
  const vista = [...j.palabra].map((c) => (j.usadas.has(c) ? c : '_')).join(' ')
  return `${muneco[j.fallos] || ''}\n\n🔤 ${vista}\n❌ Fallos: ${j.fallos}/6\n📝 Usadas: ${[...j.usadas].join(', ') || '—'}`
}
