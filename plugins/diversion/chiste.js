import { getJson, random } from '../../lib/functions.js'
const RESPALDO = [
  '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
  '¿Cómo se despiden los químicos? Ácido un placer.',
  '—Doctor, me duele aquí. —Pues no se toque ahí.',
  '¿Qué le dice un jardinero a otro? Disfrutemos mientras podamos.',
  '¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter.'
]
export default {
  command: ['chiste', 'joke'],
  category: 'diversion',
  desc: 'Un chiste al azar',
  async run({ m }) {
    let txt
    try {
      const d = await getJson('https://v2.jokeapi.dev/joke/Any?lang=es&blacklistFlags=nsfw,religious,political,racist,sexist,explicit')
      txt = d.type === 'single' ? d.joke : `${d.setup}\n\n...${d.delivery}`
    } catch {}
    await m.reply(`😂 *CHISTE*\n\n${txt || random(RESPALDO)}`)
  }
}
