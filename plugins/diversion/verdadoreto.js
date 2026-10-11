import { random } from '../../lib/functions.js'
const VERDADES = [
  '¿Cuál es el mensaje más vergonzoso que has enviado por error?',
  '¿Qué aplicación usas más y cuántas horas al día?',
  '¿Cuál ha sido tu mayor mentira piadosa?',
  '¿A quién del grupo le pedirías ayuda en una emergencia?',
  '¿Qué canción escuchas en secreto?',
  '¿Cuál es tu mayor miedo?'
]
const RETOS = [
  'Pon un emoji aleatorio como estado durante 1 hora.',
  'Escribe solo en MAYÚSCULAS durante 10 mensajes.',
  'Manda un audio cantando el estribillo de tu canción favorita.',
  'Cambia tu nombre del grupo a "Patata Frita" por 10 minutos.',
  'Cuenta un chiste malo ahora mismo.',
  'Manda la última foto de tu galería (que sea apta).'
]
export default {
  command: ['verdadoreto', 'vor', 'verdad', 'reto'],
  category: 'diversion',
  desc: 'Verdad o reto',
  async run({ m, command }) {
    if (command === 'verdad') return m.reply(`🤔 *VERDAD*\n\n${random(VERDADES)}`)
    if (command === 'reto') return m.reply(`🔥 *RETO*\n\n${random(RETOS)}`)
    const esVerdad = Math.random() < 0.5
    await m.reply(`🎲 *VERDAD O RETO*\n\nTe tocó: *${esVerdad ? 'VERDAD 🤔' : 'RETO 🔥'}*\n\n${esVerdad ? random(VERDADES) : random(RETOS)}`)
  }
}
