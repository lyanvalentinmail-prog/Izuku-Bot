export default {
  command: ['hidetag', 'notify', 'aviso'],
  category: 'grupos',
  desc: 'Mensaje que notifica a todos sin mostrar las menciones',
  group: true, admin: true,
  async run({ sock, m, text, participants }) {
    const msg = text || m.quoted?.text || '📢 Atención'
    await sock.sendMessage(m.chat, { text: msg, mentions: participants.map((p) => p.id) })
  }
}
