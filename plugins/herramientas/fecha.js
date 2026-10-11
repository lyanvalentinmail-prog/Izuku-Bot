export default {
  command: ['edad', 'cumple', 'diasentre'],
  category: 'herramientas',
  desc: 'Calcula tu edad o los días entre dos fechas',
  async run({ m, args, command, usedPrefix }) {
    const parse = (s) => {
      if (!s) return null
      const p = s.split(/[-/]/).map(Number)
      if (p.length !== 3) return null
      const d = p[0] > 31 ? new Date(p[0], p[1] - 1, p[2]) : new Date(p[2], p[1] - 1, p[0])
      return isNaN(d) ? null : d
    }

    if (command === 'diasentre') {
      const a = parse(args[0]), b = parse(args[1]) || new Date()
      if (!a) return m.reply(`📅 Uso: *${usedPrefix}${command} 01/01/2024 31/12/2024*`)
      const dias = Math.round(Math.abs(b - a) / 86400000)
      return m.reply(`📅 *DÍAS ENTRE FECHAS*\n\nDel ${a.toLocaleDateString('es')} al ${b.toLocaleDateString('es')}\n\n🗓️ *${dias.toLocaleString('es')} días*\n📆 ${(dias / 7).toFixed(1)} semanas · ${(dias / 365.25).toFixed(2)} años`)
    }

    const nac = parse(args[0])
    if (!nac) return m.reply(`🎂 Uso: *${usedPrefix}${command} 12/05/2005*  _(día/mes/año)_`)

    const hoy = new Date()
    let años = hoy.getFullYear() - nac.getFullYear()
    let meses = hoy.getMonth() - nac.getMonth()
    let dias = hoy.getDate() - nac.getDate()
    if (dias < 0) { meses--; dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate() }
    if (meses < 0) { años--; meses += 12 }

    const total = Math.floor((hoy - nac) / 86400000)
    const prox = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
    if (prox < hoy) prox.setFullYear(hoy.getFullYear() + 1)
    const faltan = Math.ceil((prox - hoy) / 86400000)

    await m.reply(
`🎂 *TU EDAD*

📅 Naciste: ${nac.toLocaleDateString('es', { day:'numeric', month:'long', year:'numeric' })}

🎈 Tienes *${años} años, ${meses} meses y ${dias} días*

📊 Eso es:
   • ${total.toLocaleString('es')} días
   • ${Math.floor(total / 7).toLocaleString('es')} semanas
   • ${(total * 24).toLocaleString('es')} horas

🎉 Tu próximo cumpleaños: *en ${faltan} días*`)
  }
}
