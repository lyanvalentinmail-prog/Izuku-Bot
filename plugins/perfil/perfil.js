export default {
  command: ['perfil', 'profile'],
  category: 'perfil',
  desc: 'Muestra tu perfil completo',
  async run({ sock, m, user }) {
    const target = m.mentionedJid[0] || m.quoted?.sender || m.sender
    const data = (await import('../../lib/database.js')).default.user(target)
    let pp
    try { pp = await sock.profilePictureUrl(target, 'image') } catch {}

    const caption =
`╭──「 👤 *PERFIL* 」
│ 🏷️ Nombre: ${data.name || 'Sin nombre'}
│ 📱 Número: wa.me/${target.split('@')[0]}
│ ✅ Registrado: ${data.registered ? 'Sí' : 'No'}
│ 🎂 Edad: ${data.age || '—'}
│ 🏅 Nivel: ${data.level}
│ ✨ XP: ${data.exp}/${data.level * 100}
│ 💰 Monedas: ${data.coins}
│ 🏦 Banco: ${data.bank}
│ ⚠️ Advertencias: ${data.warn}/3
│ 📊 Comandos usados: ${data.commands}
╰────────────────`

    if (pp) await sock.sendMessage(m.chat, { image: { url: pp }, caption, mentions: [target] }, { quoted: m })
    else await sock.sendMessage(m.chat, { text: caption, mentions: [target] }, { quoted: m })
  }
}
