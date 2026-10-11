import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'database', 'database.json')

const DEFAULT = { users: {}, chats: {}, settings: {}, subbots: {} }

class Database {
  constructor() {
    this.data = DEFAULT
    this.load()
    // Guardado automatico cada 30 segundos
    setInterval(() => this.save(), 30 * 1000)
  }

  load() {
    try {
      if (fs.existsSync(FILE)) {
        this.data = { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, 'utf-8')) }
      } else {
        fs.mkdirSync(path.dirname(FILE), { recursive: true })
        this.save()
      }
    } catch {
      this.data = DEFAULT
    }
  }

  /**
   * Guarda la base de datos.
   * - Solo escribe si algo cambio (ahorra CPU y desgaste de memoria).
   * - Escritura atomica: primero a un .tmp y luego rename, asi un corte
   *   de luz no te deja el archivo corrupto.
   */
  save(forzar = false) {
    try {
      const json = JSON.stringify(this.data)
      if (!forzar && json === this._ultimo) return false
      this._ultimo = json

      fs.mkdirSync(path.dirname(FILE), { recursive: true })
      const tmp = `${FILE}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2))
      fs.renameSync(tmp, FILE)
      return true
    } catch (e) {
      console.error('No se pudo guardar la base de datos:', e.message)
      return false
    }
  }

  /** Borra usuarios inactivos y sin progreso para que el archivo no crezca de mas */
  compactar(diasInactivo = 60) {
    const limite = Date.now() - diasInactivo * 86400000
    let borrados = 0
    for (const [jid, u] of Object.entries(this.data.users)) {
      const sinProgreso = !u.registered && !u.rpg && u.level <= 1 && (u.coins || 0) <= 500
      const ultimaVez = Math.max(u.lastDaily || 0, u.lastWork || 0, u.lastMine || 0, u.lastFish || 0)
      if (sinProgreso && ultimaVez < limite) { delete this.data.users[jid]; borrados++ }
    }
    if (borrados) this.save(true)
    return borrados
  }

  /** Obtiene (y crea si no existe) el registro de un usuario */
  user(jid) {
    if (!this.data.users[jid]) {
      this.data.users[jid] = {
        name: '',
        exp: 0,
        level: 1,
        coins: 500,
        bank: 0,
        lastDaily: 0,
        lastWork: 0,
        lastRob: 0,
        warn: 0,
        banned: false,
        inventory: {},
        afk: null,
        rpg: null,
        registered: false,
        age: 0,
        commands: 0,
        cmdStats: {}
      }
    }
    return this.data.users[jid]
  }

  /** Obtiene (y crea si no existe) la configuracion de un chat */
  chat(jid) {
    if (!this.data.chats[jid]) {
      this.data.chats[jid] = {
        welcome: true,
        antilink: false,
        antispam: false,
        antiflood: false,
        nsfw: false,
        mute: false,
        detect: true
      }
    }
    return this.data.chats[jid]
  }
}

export default new Database()
