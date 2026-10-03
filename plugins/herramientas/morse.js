const M = { a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','@':'.--.-.' }
const INV = Object.fromEntries(Object.entries(M).map(([k, v]) => [v, k]))

export default {
  command: ['morse', 'demorse'],
  category: 'herramientas',
  desc: 'Convierte texto a código morse y al revés',
  async run({ m, text, command, usedPrefix }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`📡 Uso:\n*${usedPrefix}morse hola*\n*${usedPrefix}demorse .... --- .-.. .-*`)

    if (command === 'demorse') {
      const out = q.trim().split(' / ').map((p) => p.split(/\s+/).map((c) => INV[c] || '').join('')).join(' ')
      return m.reply(`📡 *TEXTO*\n\n${out || '❌ No pude descifrarlo.'}`)
    }

    const out = q.toLowerCase().split(' ').map((p) => [...p].map((c) => M[c] || '').filter(Boolean).join(' ')).join(' / ')
    await m.reply(`📡 *CÓDIGO MORSE*\n\n${out}\n\n_Descífralo con ${usedPrefix}demorse_`)
  }
}
