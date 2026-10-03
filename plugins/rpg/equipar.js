import { EQUIPO, stats } from '../../lib/rpg.js'
import { ITEMS, findItem } from '../../lib/shop.js'

export default {
  command: ['equipar', 'equip', 'desequipar'],
  category: 'rpg',
  desc: 'Equipa un arma o armadura de tu inventario',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const r = user.rpg

    if (command === 'desequipar') {
      r.weapon = null
      r.armor = null
      return m.reply('🎒 Guardaste todo tu equipo. Estás desarmado.')
    }

    const item = findItem(args[0])
    if (!item || !EQUIPO[item.key]) {
      const disponibles = Object.keys(EQUIPO).map((k) => `${ITEMS[k].emoji} ${k}`).join('\n• ')
      return m.reply(`🛡️ Uso: *${usedPrefix}${command} espada*\n\nEquipo disponible:\n• ${disponibles}\n\n_Cómpralo primero en la ${usedPrefix}tienda_`)
    }
    if (!user.inventory?.[item.key]) return m.reply(`🎒 No tienes ${item.emoji} *${item.name}*.\nCómpralo con *${usedPrefix}comprar ${item.key}*`)

    if (item.type === 'weapon') r.weapon = item.key
    else r.armor = item.key

    const s = stats(r)
    await m.reply(`✅ *EQUIPADO*\n\n${item.emoji} ${item.name} — _${item.desc}_\n\n📊 Ahora tienes:\n⚔️ ATK *${s.atk}*  🛡️ DEF *${s.def}*  ❤️ PV máx *${s.maxHp}*`)
  }
}
