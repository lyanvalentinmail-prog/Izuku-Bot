import { barraVida, stats } from '../../lib/rpg.js'
import { ITEMS } from '../../lib/shop.js'

export default {
  command: ['curar', 'heal'],
  category: 'rpg',
  desc: 'Recupera vida con vendajes, elixir o monedas',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const r = user.rpg
    const s = stats(r)
    if (r.hp >= s.maxHp) return m.reply(`❤️ Ya tienes la vida al máximo.\n${barraVida(r.hp, s.maxHp)}`)

    const metodo = (args[0] || '').toLowerCase()
    const inv = user.inventory || {}

    if (metodo === 'elixir' || (!metodo && inv.elixir)) {
      if (!inv.elixir) return m.reply('⚗️ No tienes ningún Elixir.')
      inv.elixir--
      if (inv.elixir <= 0) delete inv.elixir
      r.hp = s.maxHp
      return m.reply(`⚗️ *ELIXIR USADO*\n\n✨ Vida restaurada por completo.\n❤️ ${barraVida(r.hp, s.maxHp)}`)
    }

    if (metodo === 'vendaje' || (!metodo && inv.vendaje)) {
      if (!inv.vendaje) return m.reply('🩹 No tienes vendajes.')
      inv.vendaje--
      if (inv.vendaje <= 0) delete inv.vendaje
      r.hp = Math.min(s.maxHp, r.hp + 50)
      return m.reply(`🩹 *VENDAJE USADO*\n\n+50 PV\n❤️ ${barraVida(r.hp, s.maxHp)}`)
    }

    // Curación pagada
    const falta = s.maxHp - r.hp
    const precio = falta * 12
    if (user.coins < precio) {
      return m.reply(
`🏥 *HOSPITAL*

Curarte por completo cuesta *${precio}* monedas y solo tienes *${user.coins}*.

💡 Compra ${ITEMS.vendaje.emoji} vendajes (${ITEMS.vendaje.price}) o ${ITEMS.elixir.emoji} elixir (${ITEMS.elixir.price}) con *${usedPrefix}comprar*`)
    }
    user.coins -= precio
    r.hp = s.maxHp
    await m.reply(`🏥 *HOSPITAL*\n\nPagaste *${precio}* monedas.\n❤️ ${barraVida(r.hp, s.maxHp)}\n💰 Saldo: *${user.coins}*`)
  }
}
