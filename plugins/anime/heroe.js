import { random, randomInt } from '../../lib/functions.js'

const PREFIJOS = ['Capitán', 'Lord', 'Doctor', 'Señor', 'Rey', 'Barón', 'Maestro', 'Agente']
const NOMBRES = ['Trueno', 'Fénix', 'Titán', 'Sombra', 'Aurora', 'Cometa', 'Vórtice', 'Centella', 'Coraza', 'Halcón']
const SUFIJOS = ['Deluxe', 'Prime', 'X', 'Supremo', 'Zero', 'Máximo', '77']
const AGENCIAS = ['Agencia Endeavor', 'Nighteye Office', 'Fat Gum Agency', 'Agencia Lemillion', 'Edgeshot Factory', 'Agencia Hawks']
const LEMAS = ['¡Estoy aquí!', '¡Más allá del límite!', 'Nadie queda atrás.', 'La sonrisa primero.', 'Rápido y silencioso.']

export default {
  command: ['heroe', 'hero', 'nombreheroico'],
  category: 'anime',
  desc: 'Crea tu identidad de héroe profesional',
  async run({ sock, m }) {
    const nombre = `${random(PREFIJOS)} ${random(NOMBRES)}${Math.random() < 0.4 ? ` ${random(SUFIJOS)}` : ''}`
    const rescates = randomInt(12, 9800)
    const puesto = randomInt(1, 500)

    await sock.sendMessage(m.chat, {
      text:
`╭━━〔 🦸 *LICENCIA DE HÉROE* 〕━━⬣
┃ 👤 @${m.sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━⬣

🏷️ *Nombre heroico:* ${nombre}
🏢 *Agencia:* ${random(AGENCIAS)}
📈 *Puesto nacional:* #${puesto}
🚑 *Rescates:* ${rescates.toLocaleString('es')}
⭐ *Aprobación:* ${randomInt(45, 99)}%
💬 *Lema:* "${random(LEMAS)}"

_Licencia provisional emitida por la Comisión de Seguridad Pública._`,
      mentions: [m.sender]
    }, { quoted: m })
  }
}
