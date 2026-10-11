import { random } from '../../lib/functions.js'

const PLANTILLAS = [
  { id: 'cazar',  texto: 'Derrota a 3 monstruos',       meta: 3, premio: 1500, xp: 100 },
  { id: 'minar',  texto: 'Mina 2 veces',                meta: 2, premio: 800,  xp: 50 },
  { id: 'pescar', texto: 'Pesca 2 veces',               meta: 2, premio: 800,  xp: 50 },
  { id: 'work',   texto: 'Trabaja 3 veces',             meta: 3, premio: 1000, xp: 60 },
  { id: 'trivia', texto: 'Juega 2 trivias',             meta: 2, premio: 600,  xp: 40 }
]

function hoy() { return new Date().toISOString().slice(0, 10) }

export default {
  command: ['misiones', 'daily2', 'quests'],
  category: 'rpg',
  desc: 'Misiones diarias con recompensas',
  register: true,
  async run({ m, user, usedPrefix }) {
    // Generar misiones del día
    if (!user.misiones || user.misiones.fecha !== hoy()) {
      const elegidas = [...PLANTILLAS].sort(() => Math.random() - 0.5).slice(0, 3)
      user.misiones = { fecha: hoy(), lista: elegidas.map((p) => ({ ...p, progreso: 0, cobrada: false })) }
    }

    const lista = user.misiones.lista
    let txt = `📜 *MISIONES DIARIAS*\n_Se renuevan cada día a medianoche_\n`
    let cobrado = 0

    for (const q of lista) {
      const completa = q.progreso >= q.meta
      if (completa && !q.cobrada) {
        q.cobrada = true
        user.coins += q.premio
        if (user.rpg) user.rpg.xp += q.xp
        cobrado += q.premio
      }
      const barra = '▰'.repeat(Math.min(q.meta, q.progreso)).padEnd(q.meta, '▱')
      txt += `\n${q.cobrada ? '✅' : completa ? '🎁' : '⬜'} *${q.texto}*\n    ${barra} ${Math.min(q.progreso, q.meta)}/${q.meta} · 💰 ${q.premio} · ✨ ${q.xp} XP`
    }

    if (cobrado) txt += `\n\n🎉 *¡Recompensas cobradas!* +${cobrado} monedas`
    txt += `\n\n💰 Saldo: *${user.coins}*`
    await m.reply(txt)
  }
}
