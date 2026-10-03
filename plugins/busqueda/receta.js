import { getJson } from '../../lib/functions.js'
import { askAI } from '../../lib/ai.js'

export default {
  command: ['receta', 'cocina'],
  category: 'busqueda',
  desc: 'Busca una receta de cocina',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🍳 Uso: *${usedPrefix}${command} tortilla de patatas*`)
    await m.react('🍳')

    // 1) Intentamos con la base de datos gratuita de recetas
    try {
      const d = await getJson(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(text)}`)
      const r = d.meals?.[0]
      if (r) {
        const ingredientes = []
        for (let i = 1; i <= 20; i++) {
          const ing = r[`strIngredient${i}`], med = r[`strMeasure${i}`]
          if (ing?.trim()) ingredientes.push(`   • ${med?.trim() || ''} ${ing.trim()}`.trim())
        }
        const caption =
`🍳 *${r.strMeal.toUpperCase()}*

🌍 Origen: ${r.strArea || '—'}
🏷️ Categoría: ${r.strCategory || '—'}

🥕 *Ingredientes:*
${ingredientes.join('\n')}

👨‍🍳 *Preparación:*
${r.strInstructions.slice(0, 1200)}${r.strInstructions.length > 1200 ? '...' : ''}
${r.strYoutube ? `\n📺 Video: ${r.strYoutube}` : ''}`
        return sock.sendMessage(m.chat, { image: { url: r.strMealThumb }, caption }, { quoted: m })
      }
    } catch {}

    // 2) Si no está en la base, la generamos con IA
    const out = await askAI(text, 'Eres un chef. Da una receta en español con: ingredientes (lista), pasos numerados, tiempo y dificultad. Sé conciso.')
    await m.reply(`🍳 *RECETA: ${text.toUpperCase()}*\n\n${out}`)
  }
}
