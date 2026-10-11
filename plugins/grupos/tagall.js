export default {
  command: ['tagall', 'invocar', 'todos'],
  category: 'grupos',
  desc: 'Menciona a todos los miembros',
  group: true, admin: true,
  async run({ sock, m, text, participants, groupMetadata }) {
    let txt = `📢 *ATENCIÓN ${groupMetadata?.subject || 'GRUPO'}*\n`
    if (text) txt += `\n💬 ${text}\n`
    txt += `\n👥 ${participants.length} miembros:\n`
    for (const p of participants) txt += `\n⬡ @${p.id.split('@')[0]}`
    await sock.sendMessage(m.chat, { text: txt, mentions: participants.map((p) => p.id) }, { quoted: m })
  }
}
