const TABLA = {
  longitud: { m:1, km:1000, cm:0.01, mm:0.001, mi:1609.34, yd:0.9144, ft:0.3048, in:0.0254 },
  peso:     { kg:1, g:0.001, mg:0.000001, t:1000, lb:0.453592, oz:0.0283495 },
  volumen:  { l:1, ml:0.001, m3:1000, gal:3.78541 },
  tiempo:   { s:1, min:60, h:3600, d:86400, semana:604800 },
  datos:    { b:1, kb:1024, mb:1048576, gb:1073741824, tb:1099511627776 }
}

export default {
  command: ['unidades', 'convertir2', 'uconv'],
  category: 'herramientas',
  desc: 'Convierte unidades — unidades 10 km mi',
  async run({ m, args, usedPrefix, command }) {
    const [cantRaw, de, a] = args
    const cant = parseFloat((cantRaw || '').replace(',', '.'))

    // Temperatura aparte (no es proporcional)
    if (de && a && ['c','f','k'].includes(de.toLowerCase()) && ['c','f','k'].includes(a.toLowerCase())) {
      const d = de.toLowerCase(), h = a.toLowerCase()
      const kelvin = d === 'c' ? cant + 273.15 : d === 'f' ? (cant - 32) * 5/9 + 273.15 : cant
      const r = h === 'c' ? kelvin - 273.15 : h === 'f' ? (kelvin - 273.15) * 9/5 + 32 : kelvin
      return m.reply(`🌡️ *TEMPERATURA*\n\n${cant}°${d.toUpperCase()} = *${r.toFixed(2)}°${h.toUpperCase()}*`)
    }

    if (isNaN(cant) || !de || !a) {
      return m.reply(
`📏 Uso: *${usedPrefix}${command} 10 km mi*

*Unidades disponibles:*
📏 Longitud: m, km, cm, mm, mi, yd, ft, in
⚖️ Peso: kg, g, mg, t, lb, oz
🧪 Volumen: l, ml, m3, gal
⏱️ Tiempo: s, min, h, d, semana
💾 Datos: b, kb, mb, gb, tb
🌡️ Temperatura: c, f, k`)
    }

    const grupo = Object.entries(TABLA).find(([, u]) => u[de.toLowerCase()] && u[a.toLowerCase()])
    if (!grupo) return m.reply('❌ No reconozco esas unidades o son de tipos distintos.')

    const [tipo, u] = grupo
    const r = (cant * u[de.toLowerCase()]) / u[a.toLowerCase()]
    await m.reply(`📏 *CONVERSIÓN (${tipo})*\n\n${cant.toLocaleString('es')} ${de} = *${r.toLocaleString('es', { maximumFractionDigits: 6 })} ${a}*`)
  }
}
