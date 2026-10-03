import { ITEMS, roll } from '../../lib/shop.js'
import { formatTime, randomInt } from '../../lib/functions.js'

export default {
  command: ['pescar', 'fish'],
  category: 'economia',
  desc: 'Pesca peces (necesitas una caña)',
  register: true,
  async run({ m, user, usedPrefix }) {
    if (!user.inventory?.caña) return m.reply(`🎣 Necesitas una *Caña* para pescar.\nCómprala con *${usedPrefix}comprar caña*`)

    user.lastFish = user.lastFish || 0
    const wait = 300000 - (Date.now() - user.lastFish)
    if (wait > 0) return m.reply(`😮‍💨 Los peces se asustaron. Vuelve en *${formatTime(wait)}*.`)
    user.lastFish = Date.now()

    // El cebo mejora las probabilidades
    let bonus = ''
    const tabla = { sardina: 55, pulpo: 28, tiburon: 13, ballena: 4 }
    if (user.inventory.cebo) {
      user.inventory.cebo--
      if (user.inventory.cebo <= 0) delete user.inventory.cebo
      Object.assign(tabla, { sardina: 35, pulpo: 32, tiburon: 22, ballena: 11 })
      bonus = '\n🪱 Usaste un cebo (mejores probabilidades).'
    }

    if (Math.random() < 0.12) return m.reply(`🎣 *PESCA*\n\n🥾 Solo sacaste una bota vieja... nada de valor.${bonus}`)

    const key = roll(tabla)
    const cant = randomInt(1, 2)
    user.inventory[key] = (user.inventory[key] || 0) + cant
    const i = ITEMS[key]

    await m.reply(`🎣 *PESCA*\n\n¡Atrapaste ${i.emoji} *${i.name}* x${cant}!\n💵 Valor: *${i.sell * cant}* monedas\n🎒 Guardado en tu inventario.${bonus}`)
  }
}
