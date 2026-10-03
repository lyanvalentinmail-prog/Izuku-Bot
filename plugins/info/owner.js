import config from '../../config.js'
export default {
  command: ['owner', 'creador', 'dueño', 'dueno'],
  category: 'info',
  desc: 'Muestra el contacto del dueño',
  async run({ sock, m }) {
    const number = config.owner[0]
    await sock.sendMessage(m.chat, {
      contacts: {
        displayName: config.ownerName,
        contacts: [{
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${config.ownerName}\nORG:${config.botName}\nTEL;type=CELL;waid=${number}:+${number}\nEND:VCARD`
        }]
      }
    }, { quoted: m })
  }
}
