export default {
  command: ['imc', 'peso'],
  category: 'herramientas',
  desc: 'Calcula tu índice de masa corporal',
  async run({ m, args, usedPrefix, command }) {
    const kg = parseFloat((args[0] || '').replace(',', '.'))
    let alt = parseFloat((args[1] || '').replace(',', '.'))
    if (!kg || !alt) return m.reply(`⚖️ Uso: *${usedPrefix}${command} 70 1.75*\n_(peso en kg y altura en metros)_`)
    if (alt > 3) alt = alt / 100   // si lo pusieron en cm

    const imc = kg / (alt * alt)
    const cat = imc < 18.5 ? '🔵 Bajo peso' : imc < 25 ? '🟢 Peso normal' : imc < 30 ? '🟡 Sobrepeso' : imc < 35 ? '🟠 Obesidad grado I' : '🔴 Obesidad grado II+'
    const ideal = [18.5 * alt * alt, 24.9 * alt * alt]

    await m.reply(
`⚖️ *ÍNDICE DE MASA CORPORAL*

📏 Altura: *${alt} m*
🏋️ Peso: *${kg} kg*

📊 IMC: *${imc.toFixed(1)}*
${cat}

🎯 Peso saludable para tu altura:
*${ideal[0].toFixed(1)} – ${ideal[1].toFixed(1)} kg*

_El IMC es orientativo, no sustituye a un médico._`)
  }
}
