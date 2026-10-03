
const SIGNOS = {
  aries:      { emoji: '♈', fechas: '21 mar – 19 abr', elemento: 'Fuego' },
  tauro:      { emoji: '♉', fechas: '20 abr – 20 may', elemento: 'Tierra' },
  geminis:    { emoji: '♊', fechas: '21 may – 20 jun', elemento: 'Aire' },
  cancer:     { emoji: '♋', fechas: '21 jun – 22 jul', elemento: 'Agua' },
  leo:        { emoji: '♌', fechas: '23 jul – 22 ago', elemento: 'Fuego' },
  virgo:      { emoji: '♍', fechas: '23 ago – 22 sep', elemento: 'Tierra' },
  libra:      { emoji: '♎', fechas: '23 sep – 22 oct', elemento: 'Aire' },
  escorpio:   { emoji: '♏', fechas: '23 oct – 21 nov', elemento: 'Agua' },
  sagitario:  { emoji: '♐', fechas: '22 nov – 21 dic', elemento: 'Fuego' },
  capricornio:{ emoji: '♑', fechas: '22 dic – 19 ene', elemento: 'Tierra' },
  acuario:    { emoji: '♒', fechas: '20 ene – 18 feb', elemento: 'Aire' },
  piscis:     { emoji: '♓', fechas: '19 feb – 20 mar', elemento: 'Agua' }
}

const AMOR = ['Alguien pensará en ti hoy.', 'Buen día para hablar claro con quien te importa.', 'Evita discusiones tontas por mensajes.', 'Se viene un reencuentro agradable.', 'Dedícate tiempo a ti antes que a los demás.']
const TRABAJO = ['Tu esfuerzo empezará a notarse.', 'Organiza tus tareas y rendirás el doble.', 'Alguien valorará una idea tuya.', 'No dejes para mañana lo que te quita el sueño hoy.', 'Buen momento para aprender algo nuevo.']
const SALUD = ['Duerme un poco más esta noche.', 'Toma más agua de lo normal.', 'Tu cuerpo te pide moverte.', 'Baja el ritmo, vas acelerado.', 'Un paseo te despejará la cabeza.']
const CONSEJO = ['No compares tu ritmo con el de otros.', 'Hoy di que no sin culpa.', 'Agradece algo pequeño.', 'La paciencia te dará la razón.', 'Confía en tu instinto.']

// Mismo resultado durante todo el día para el mismo signo
function semilla(txt) { return [...txt].reduce((s, c) => s + c.charCodeAt(0), 0) }
function elegir(lista, s) { return lista[s % lista.length] }

export default {
  command: ['horoscopo', 'signo', 'zodiaco'],
  category: 'actualidad',
  desc: 'Tu horóscopo del día',
  async run({ m, args, usedPrefix, command }) {
    const q = (args[0] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const signo = SIGNOS[q]
    if (!signo) {
      return m.reply(`🔮 Uso: *${usedPrefix}${command} aries*\n\n${Object.entries(SIGNOS).map(([k, v]) => `${v.emoji} ${k} _(${v.fechas})_`).join('\n')}`)
    }

    const hoy = new Date().toISOString().slice(0, 10)
    const s = semilla(q + hoy)
    const estrellas = (n) => '⭐'.repeat(n) + '☆'.repeat(5 - n)

    await m.reply(
`🔮 *HORÓSCOPO DE HOY*
${signo.emoji} *${q.toUpperCase()}* — ${signo.fechas}

🌿 Elemento: *${signo.elemento}*
📅 ${new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}

💕 *Amor* ${estrellas(1 + (s % 5))}
   ${elegir(AMOR, s)}

💼 *Trabajo* ${estrellas(1 + (s * 3 % 5))}
   ${elegir(TRABAJO, s * 2)}

💪 *Salud* ${estrellas(1 + (s * 7 % 5))}
   ${elegir(SALUD, s * 3)}

🍀 Número de la suerte: *${s % 100}*
🎨 Color: *${['rojo','azul','verde','amarillo','violeta','naranja'][s % 6]}*

💭 _${elegir(CONSEJO, s * 5)}_`)
  }
}
