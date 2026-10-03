import { random } from '../../lib/functions.js'
const FRASES = [
  ['El único modo de hacer un gran trabajo es amar lo que haces.', 'Steve Jobs'],
  ['No cuentes los días, haz que los días cuenten.', 'Muhammad Ali'],
  ['El fracaso es la oportunidad de empezar de nuevo con más inteligencia.', 'Henry Ford'],
  ['La disciplina es el puente entre las metas y los logros.', 'Jim Rohn'],
  ['Caer está permitido, levantarse es obligatorio.', 'Proverbio japonés'],
  ['No hay ascensor hacia el éxito, hay que usar las escaleras.', 'Zig Ziglar'],
  ['Hazlo con miedo, pero hazlo.', 'Anónimo']
]
export default {
  command: ['frase', 'motivacion', 'inspirame'],
  category: 'diversion',
  desc: 'Frase motivacional',
  async run({ m }) {
    const [f, a] = random(FRASES)
    await m.reply(`✨ *FRASE DEL DÍA*\n\n❝ ${f} ❞\n\n— *${a}*`)
  }
}
