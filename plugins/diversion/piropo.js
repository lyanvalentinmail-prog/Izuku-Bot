import { random } from '../../lib/functions.js'
const PIROPOS = [
  'Si la sonrisa fuera moneda, serías millonario.',
  'No eres Google, pero tienes todo lo que busco.',
  '¿Eres wifi? Porque siento conexión.',
  'Tu energía ilumina el grupo entero.',
  'Si fueras un comando, serías el más usado.'
]
export default {
  command: ['piropo', 'cumplido'],
  category: 'diversion',
  desc: 'Lanza un piropo sano',
  async run({ sock, m }) {
    const target = m.mentionedJid[0] || m.quoted?.sender || m.sender
    await sock.sendMessage(m.chat, { text: `💐 Para @${target.split('@')[0]}:\n\n_${random(PIROPOS)}_`, mentions: [target] }, { quoted: m })
  }
}
