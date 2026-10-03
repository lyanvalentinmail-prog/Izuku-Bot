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

  save() {
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true })
      fs.writeFileSync(FILE, JSON.stringify(this.data, null, 2))
    } catch (e) {
      console.error('No se pudo guardar la base de datos:', e.message)
    }
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
        commands: 0
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
