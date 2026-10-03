import { getJson, random } from '../../lib/functions.js'

const RESPALDO = [
  { quote: 'Si quieres ganar, no te rindas. Si te rindes, no ganas.', character: 'All Might', anime: 'My Hero Academia' },
  { quote: 'Un héroe siempre puede romper sus límites.', character: 'Izuku Midoriya', anime: 'My Hero Academia' },
  { quote: 'La gente muere cuando la matan.', character: 'Shirou Emiya', anime: 'Fate/stay night' },
  { quote: 'No importa cuántas veces caigas, lo que importa es levantarte.', character: 'Naruto Uzumaki', anime: 'Naruto' },
  { quote: 'El miedo no es malo. Te enseña cuál es tu debilidad.', character: 'Gildarts', anime: 'Fairy Tail' }
]

export default {
  command: ['animequote', 'frasesanime', 'quote'],
  category: 'anime',
  desc: 'Frase célebre de anime',
  async run({ m }) {
    let q
    try {
      const d = await getJson('https://animechan.io/api/v1/quotes/random')
      if (d?.data) q = { quote: d.data.content, character: d.data.character?.name, anime: d.data.anime?.name }
    } catch {}
    if (!q?.quote) q = random(RESPALDO)
    await m.reply(`🎌 *FRASE DE ANIME*\n\n❝ ${q.quote} ❞\n\n👤 — *${q.character}*\n📺 ${q.anime}`)
  }
}
