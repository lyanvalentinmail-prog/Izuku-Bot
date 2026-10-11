import { random, randomInt } from '../../lib/functions.js'

const TIPOS = ['Emisión', 'Transformación', 'Mutación']
const ELEMENTOS = ['fuego', 'hielo', 'rayo', 'viento', 'sombra', 'luz', 'gravedad', 'metal', 'cristal', 'sonido', 'tiempo', 'plantas', 'agua', 'arena', 'magnetismo']
const ACCIONES = ['manipular', 'generar', 'absorber', 'reflejar', 'acelerar', 'congelar', 'multiplicar', 'teletransportar', 'endurecer', 'controlar']
const DEBILIDADES = [
  'te deja agotado si lo usas más de 3 minutos',
  'solo funciona de día',
  'te sube muchísimo la temperatura corporal',
  'necesitas tocar al objetivo',
  'consume tus propias calorías',
  'te deja temporalmente sin voz',
  'no funciona bajo la lluvia',
  'cada uso te quita un recuerdo del día'
]
const RANGOS = [['F', 'Civil con potencial'], ['D', 'Estudiante de la UA'], ['C', 'Héroe en prácticas'], ['B', 'Héroe profesional'], ['A', 'Top 10 nacional'], ['S', 'Símbolo de la Paz']]

export default {
  command: ['quirk', 'don', 'poder'],
  category: 'anime',
  desc: 'Genera tu Quirk al estilo My Hero Academia',
  async run({ sock, m }) {
    const el = random(ELEMENTOS)
    const ac = random(ACCIONES)
    const tipo = random(TIPOS)
    const rango = random(RANGOS)
    const poder = randomInt(35, 100)
    const control = randomInt(20, 100)
    const barra = (n) => '▰'.repeat(Math.round(n / 10)).padEnd(10, '▱')

    await sock.sendMessage(m.chat, {
      text:
`╭━━〔 💥 *REGISTRO DE QUIRK* 〕━━⬣
┃ 👤 @${m.sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━⬣

🏷️ *Nombre:* ${el.charAt(0).toUpperCase() + el.slice(1)} ${random(['Absoluto', 'Infinito', 'Carmesí', 'Fantasma', 'Zero', 'Overdrive', 'Eterno'])}
🧬 *Tipo:* ${tipo}
⚡ *Habilidad:* Puedes *${ac} ${el}* a voluntad.

📊 *Poder:*   ${barra(poder)} ${poder}%
🎯 *Control:* ${barra(control)} ${control}%
🎖️ *Rango:* ${rango[0]} — _${rango[1]}_

⚠️ *Debilidad:* ${random(DEBILIDADES)}

_¡Plus Ultra! 💥_`,
      mentions: [m.sender]
    }, { quoted: m })
  }
}
