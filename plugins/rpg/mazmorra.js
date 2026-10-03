import { formatTime } from '../../lib/functions.js'
import { JEFES, barraVida, combate, revisarNivel, stats } from '../../lib/rpg.js'

export default {
  command: ['mazmorra', 'dungeon', 'jefe'],
  category: 'rpg',
  desc: 'Enfréntate a un jefe (muy difícil, gran recompensa)',
  register: true,
  async run({ m, user, usedPrefix }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const r = user.rpg

    const wait = 3600000 - (Date.now() - r.lastDungeon)
    if (wait > 0) return m.reply(`🚪 La mazmorra está cerrada.\nVuelve en *${formatTime(wait)}*.`)
    if (r.level < 5) return m.reply(`⚠️ Necesitas ser *nivel 5* para entrar. Eres nivel *${r.level}*.\nSube cazando con *${usedPrefix}cazar*`)
    if (r.hp <= 0) return m.reply(`💀 Estás derrotado. Cúrate con *${usedPrefix}curar*`)

    const jefe = { ...JEFES.filter((j) => j.lvl <= r.level + 6).pop() || JEFES[0] }
    r.lastDungeon = Date.now()

    const res = combate(r, jefe)
    r.hp = res.hpJugador

    let txt =
`🏰 *MAZMORRA*

Desciendes por la escalera...
Te espera ${jefe.emoji} *${jefe.name}* (Nv.${jefe.lvl})
❤️ ${jefe.hp} PV  ⚔️ ${jefe.atk} ATK  🛡️ ${jefe.def} DEF

${res.log.slice(0, 8).join('\n')}${res.log.length > 8 ? '\n...' : ''}
`
    if (res.ganador === 'jugador') {
      r.wins++
      r.xp += jefe.xp
      user.coins += jefe.coins
      const subidas = revisarNivel(r)
      txt += `\n👑 *¡DERROTASTE AL JEFE!*\n💰 +${jefe.coins} monedas\n✨ +${jefe.xp} XP`
      if (subidas) txt += `\n\n🎉 *¡SUBISTE ${subidas} NIVEL(ES)!* Ahora eres nivel *${r.level}*.`
    } else {
      r.loses++
      txt += `\n💀 *EL JEFE TE VENCIÓ*\nEscapaste por poco. Entrena más y vuelve.`
    }

    txt += `\n\n❤️ ${barraVida(r.hp, stats(r).maxHp)}`
    await m.reply(txt)
  }
}
