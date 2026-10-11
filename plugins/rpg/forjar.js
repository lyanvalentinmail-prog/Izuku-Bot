import { ITEMS } from '../../lib/shop.js'
import { EQUIPO } from '../../lib/rpg.js'

const COSTES = {
  1: { hierro: 3, carbon: 5, coins: 2000 },
  2: { hierro: 6, oro: 2, coins: 5000 },
  3: { oro: 5, diamante: 1, coins: 12000 },
  4: { diamante: 3, oro: 8, coins: 30000 },
  5: { diamante: 8, oro: 15, coins: 75000 }
}

export default {
  command: ['forjar', 'mejorar', 'forge'],
  category: 'rpg',
  desc: 'Mejora tu arma o armadura con minerales',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const r = user.rpg
    const que = (args[0] || '').toLowerCase()
    const slot = que === 'armadura' ? 'armor' : que === 'arma' ? 'weapon' : null

    r.forja = r.forja || { weapon: 0, armor: 0 }

    if (!slot) {
      return m.reply(
`⚒️ *FORJA*

Mejora tu equipo con los minerales que consigues minando.

🔸 *${usedPrefix}${command} arma*
🔸 *${usedPrefix}${command} armadura*

*Tu equipo:*
🗡️ Arma: ${r.weapon ? `${ITEMS[r.weapon].name} +${r.forja.weapon}` : '—'}
🛡️ Armadura: ${r.armor ? `${ITEMS[r.armor].name} +${r.forja.armor}` : '—'}

*Costes por nivel:*
${Object.entries(COSTES).map(([n, c]) => `+${n} → ${Object.entries(c).map(([k, v]) => k === 'coins' ? `${v} 🪙` : `${v}x ${ITEMS[k].emoji}`).join(', ')}`).join('\n')}`)
    }

    const equipado = r[slot]
    if (!equipado) return m.reply(`⚠️ No tienes ${slot === 'weapon' ? 'arma' : 'armadura'} equipada. Usa *${usedPrefix}equipar*`)

    const nivel = r.forja[slot] + 1
    const coste = COSTES[nivel]
    if (!coste) return m.reply(`✨ Tu ${slot === 'weapon' ? 'arma' : 'armadura'} ya está al máximo (+5).`)

    // Comprobar materiales
    const faltan = []
    for (const [k, v] of Object.entries(coste)) {
      if (k === 'coins') { if (user.coins < v) faltan.push(`${v - user.coins} 🪙`) }
      else if ((user.inventory?.[k] || 0) < v) faltan.push(`${v - (user.inventory?.[k] || 0)}x ${ITEMS[k].emoji} ${ITEMS[k].name}`)
    }
    if (faltan.length) return m.reply(`⚒️ Te faltan materiales para *+${nivel}*:\n\n• ${faltan.join('\n• ')}\n\n_Consigue minerales con ${usedPrefix}minar_`)

    // Cobrar
    for (const [k, v] of Object.entries(coste)) {
      if (k === 'coins') user.coins -= v
      else { user.inventory[k] -= v; if (user.inventory[k] <= 0) delete user.inventory[k] }
    }

    // Probabilidad de éxito: baja según el nivel
    const exito = [0, 0.9, 0.75, 0.6, 0.45, 0.3][nivel]
    if (Math.random() > exito) {
      return m.reply(`💥 *¡LA FORJA FALLÓ!*\n\nLos materiales se perdieron, pero tu equipo sigue intacto.\n🎲 Probabilidad era del ${Math.round(exito * 100)}%\n\n_Inténtalo otra vez._`)
    }

    r.forja[slot] = nivel
    const base = EQUIPO[equipado] || {}
    if (slot === 'weapon') r.atk += 5
    else { r.def += 4; r.maxHp += 10 }

    await m.reply(
`⚒️ *¡FORJA EXITOSA!*

${ITEMS[equipado].emoji} *${ITEMS[equipado].name} +${nivel}*

📈 ${slot === 'weapon' ? '+5 Ataque' : '+4 Defensa y +10 Vida máxima'}
🎲 Probabilidad era del ${Math.round(exito * 100)}%

_Mira tu ficha con ${usedPrefix}ficha_`)
  }
}
