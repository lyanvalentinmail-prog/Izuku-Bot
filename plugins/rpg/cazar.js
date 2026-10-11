import { formatTime } from '../../lib/functions.js'
import { barraVida, combate, monstruoPara, revisarNivel, stats } from '../../lib/rpg.js'

export default {
  command: ['cazar', 'hunt', 'aventura'],
  category: 'rpg',
  desc: 'Sal a cazar monstruos y gana XP y monedas',
  register: true,
  async run({ m, user, usedPrefix }) {
    if (!user.rpg) return m.reply(`🎭 Primero crea tu personaje con *${usedPrefix}crear*`)
    const r = user.rpg

    const wait = 180000 - (Date.now() - r.lastHunt)
    if (wait > 0) return m.reply(`😮‍💨 Estás recuperando el aliento.\nVuelve a cazar en *${formatTime(wait)}*.`)
    if (r.hp <= 0) return m.reply(`💀 Estás derrotado. Cúrate con *${usedPrefix}curar*`)
    r.lastHunt = Date.now()

    const enemigo = monstruoPara(r.level)
    const res = combate(r, enemigo)
    const s = stats(r)
    r.hp = res.hpJugador

    const resumen = res.log.slice(0, 6).join('\n')
    let txt = `🗺️ *CAZA*\n\nTe encontraste con ${enemigo.emoji} *${enemigo.name}* (Nv.${enemigo.lvl})\n\n${resumen}${res.log.length > 6 ? '\n...' : ''}\n`

    if (res.ganador === 'jugador') {
      const bonus = 1 + (enemigo.lvl > r.level ? 0.3 : 0)
      const coins = Math.round(enemigo.coins * bonus)
      const xp = Math.round(enemigo.xp * bonus)
      r.wins++
      r.xp += xp
      user.coins += coins
      const subidas = revisarNivel(r)

      txt += `\n🏆 *¡VICTORIA!*\n💰 +${coins} monedas\n✨ +${xp} XP`
      if (subidas) txt += `\n\n🎉 *¡SUBISTE ${subidas} NIVEL(ES)!*\nAhora eres nivel *${r.level}* y tu vida se restauró.`
    } else {
      r.loses++
      const perdido = Math.min(user.coins, Math.round(enemigo.coins * 0.3))
      user.coins -= perdido
      txt += `\n💀 *DERROTA*\nHuiste malherido y perdiste *${perdido}* monedas.`
    }

    txt += `\n\n❤️ ${barraVida(r.hp, stats(r).maxHp)}`
    if (r.hp <= 0) txt += `\n\n⚠️ Estás fuera de combate. Usa *${usedPrefix}curar*`
    await m.reply(txt)
  }
}
