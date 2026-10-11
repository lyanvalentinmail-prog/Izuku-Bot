import { random, randomInt, formatTime } from '../../lib/functions.js'

const MASCOTAS = {
  perro:   { emoji: '🐕', name: 'Perro',    precio: 8000,  atk: 6, desc: 'Fiel y valiente' },
  gato:    { emoji: '🐈', name: 'Gato',     precio: 8000,  atk: 5, desc: 'Ágil y sigiloso' },
  halcon:  { emoji: '🦅', name: 'Halcón',   precio: 15000, atk: 9, desc: 'Ataca desde el aire' },
  lobo:    { emoji: '🐺', name: 'Lobo',     precio: 25000, atk: 14, desc: 'Fiera leal' },
  dragon:  { emoji: '🐲', name: 'Dragoncito', precio: 60000, atk: 25, desc: 'Escupe fuego' }
}

export default {
  command: ['mascota', 'pet'],
  category: 'rpg',
  desc: 'Adopta y alimenta una mascota que pelea contigo',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const accion = (args[0] || '').toLowerCase()
    const p = user.mascota

    // ---------- Adoptar ----------
    if (['adoptar', 'comprar'].includes(accion)) {
      const tipo = (args[1] || '').toLowerCase()
      const def = MASCOTAS[tipo]
      if (!def) return m.reply(`🐾 Uso: *${usedPrefix}${command} adoptar perro*\n\n${Object.entries(MASCOTAS).map(([k, v]) => `${v.emoji} *${k}* — ${v.precio} 🪙 (+${v.atk} ATK)\n   _${v.desc}_`).join('\n')}`)
      if (p) return m.reply(`🐾 Ya tienes a *${p.nombre}*. Abandónalo con *${usedPrefix}${command} liberar*`)
      if (user.coins < def.precio) return m.reply(`💸 Cuesta *${def.precio}* y tienes *${user.coins}*.`)
      user.coins -= def.precio
      user.mascota = { tipo, nombre: def.name, hambre: 100, nivel: 1, exp: 0, lastFeed: Date.now() }
      return m.reply(`🎉 *¡ADOPTASTE UN ${def.name.toUpperCase()}!*\n\n${def.emoji} ${def.desc}\n⚔️ +${def.atk} de ataque en combate\n\n💡 Aliméntalo con *${usedPrefix}${command} alimentar*\n🏷️ Ponle nombre con *${usedPrefix}${command} nombre Rocky*`)
    }

    if (!p) return m.reply(`🐾 No tienes mascota.\n\nAdopta una con *${usedPrefix}${command} adoptar*`)
    const def = MASCOTAS[p.tipo]

    // ---------- Acciones ----------
    if (accion === 'alimentar') {
      const wait = 7200000 - (Date.now() - p.lastFeed)
      if (wait > 0) return m.reply(`🍖 *${p.nombre}* está lleno.\nVuelve en *${formatTime(wait)}*.`)
      if (user.coins < 300) return m.reply('💸 La comida cuesta 300 monedas.')
      user.coins -= 300
      p.hambre = 100
      p.exp += randomInt(10, 25)
      p.lastFeed = Date.now()
      let sube = ''
      if (p.exp >= p.nivel * 50) { p.exp = 0; p.nivel++; sube = `\n\n🎉 ¡${p.nombre} subió a nivel *${p.nivel}*! (+2 ATK)` }
      return m.reply(`🍖 Alimentaste a ${def.emoji} *${p.nombre}*\n\n❤️ Saciedad: *100%*\n✨ XP: ${p.exp}/${p.nivel * 50}${sube}`)
    }

    if (accion === 'nombre') {
      const nuevo = args.slice(1).join(' ').trim()
      if (!nuevo) return m.reply(`🏷️ Uso: *${usedPrefix}${command} nombre Rocky*`)
      p.nombre = nuevo.slice(0, 20)
      return m.reply(`🏷️ Tu mascota ahora se llama *${p.nombre}*.`)
    }

    if (['liberar', 'abandonar'].includes(accion)) {
      user.mascota = null
      return m.reply(`😢 Liberaste a *${p.nombre}*. Ojalá encuentre un buen hogar.`)
    }

    // ---------- Ficha ----------
    const horas = Math.floor((Date.now() - p.lastFeed) / 3600000)
    const hambre = Math.max(0, 100 - horas * 8)
    p.hambre = hambre
    const barra = '🟩'.repeat(Math.round(hambre / 20)).padEnd(5, '⬜')
    await m.reply(
`${def.emoji} *${p.nombre.toUpperCase()}*

🐾 Especie: ${def.name}
🏅 Nivel: *${p.nivel}*  ✨ ${p.exp}/${p.nivel * 50}
⚔️ Ataque extra: *+${def.atk + (p.nivel - 1) * 2}*
🍖 Saciedad: ${barra} ${hambre}%
${hambre < 30 ? '\n⚠️ ¡Tiene hambre! No peleará bien.' : ''}

🔸 *${usedPrefix}${command} alimentar* (300 🪙)
🔸 *${usedPrefix}${command} nombre <nuevo>*
🔸 *${usedPrefix}${command} liberar*`)
  }
}
