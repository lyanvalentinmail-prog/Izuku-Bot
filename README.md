<div align="center">

# 🤖 Izuku Bot

**Bot de WhatsApp multifunción hecho con Node.js + [Baileys](https://github.com/WhiskeySockets/Baileys)**

Vinculación por **código QR** y por **código de 8 dígitos (pairing code)**
Sistema de **plugins**, **sub-bots**, **economía**, **IA**, **descargas** y mucho más.

</div>

---

## 📑 Índice

1. [¿Qué es Izuku Bot?](#-qué-es-izuku-bot)
2. [Características](#-características)
3. [Requisitos](#-requisitos)
4. [Instalación en Termux (paso a paso)](#-instalación-en-termux-paso-a-paso)
5. [Vincular el bot (QR o código de 8 dígitos)](#-vincular-el-bot)
6. [Mantener el bot encendido](#-mantener-el-bot-encendido)
7. [Lista de comandos por categoría](#-lista-de-comandos)
8. [Configuración: cómo cambiar cosas](#️-configuración-cómo-cambiar-cosas)
9. [Cómo agregar un comando nuevo](#-cómo-agregar-un-comando-nuevo)
10. [Cómo funcionan los sub-bots](#-cómo-funcionan-los-sub-bots)
11. [Comandos del dueño](#-comandos-del-dueño)
12. [Estructura del proyecto](#-estructura-del-proyecto)
13. [Solución de problemas](#-solución-de-problemas)

---

## 🌟 ¿Qué es Izuku Bot?

**Izuku Bot** es un bot de WhatsApp que se conecta a tu cuenta como un *dispositivo vinculado*
(igual que WhatsApp Web), usando la librería **Baileys**. No necesitas emuladores ni la API
oficial de WhatsApp Business: funciona en una computadora o directamente en tu **celular Android
con Termux**.

Cuando alguien escribe un comando (por ejemplo `.menu`), el bot lee el mensaje, busca el
**plugin** correspondiente dentro de la carpeta `plugins/` y ejecuta su función. Así de simple:
**un archivo = un comando**. Eso hace que agregar o quitar funciones sea muy fácil.

El flujo interno es:

```
WhatsApp  ──▶  index.js (conexión Baileys)
                   │
                   ▼
              handler.js  (permisos, prefijo, anti-spam, antilink, XP)
                   │
                   ▼
              plugins/<categoría>/<comando>.js   ◀── aquí vive cada comando
                   │
                   ▼
              database/database.json  (usuarios, economía, ajustes del chat)
```

---

## ✨ Características

| | |
|---|---|
| 🔗 **Doble vinculación** | Código QR **y** código de 8 dígitos |
| 🧩 **Sistema de plugins** | Un archivo por comando, con *recarga en caliente* (no hay que reiniciar) |
| 🤖 **Sub-bots (JadiBot)** | Otras personas pueden volverse bots usando tu código |
| 💾 **Base de datos JSON** | Sin instalar MySQL ni MongoDB, se guarda sola cada 30 s |
| 🧠 **IA integrada** | Chat, resúmenes, código y generación de imágenes |
| 📥 **Descargas** | YouTube, TikTok, Instagram y Facebook |
| 💰 **Economía y niveles** | Monedas, banco, daily, trabajos, robos, top |
| 👥 **Gestión de grupos** | Kick, promote, antilink, bienvenida, tagall… |
| 🏷️ **Stickers con metadata** | Pack y autor personalizados, imagen y video |
| 🔄 **Auto-reconexión** | Si se cae la conexión, vuelve solo |

---

## 📋 Requisitos

- **Android 7+** con [Termux](https://f-droid.org/packages/com.termux/) (instálalo desde **F-Droid**, la versión de Play Store está desactualizada).
- **Node.js 20 o superior**.
- **~1 GB** de espacio libre y conexión a internet estable.
- Un **número de WhatsApp** (se recomienda uno secundario).

---

## 📱 Instalación en Termux (paso a paso)

Copia y pega cada bloque en Termux, uno por uno.

### 1️⃣ Actualizar Termux

```bash
pkg update -y && pkg upgrade -y
```

> Si pregunta algo, pulsa `Y` y Enter.

### 2️⃣ Instalar las herramientas necesarias

```bash
pkg install -y nodejs-lts git ffmpeg libwebp python
```

- `nodejs-lts` → ejecuta el bot
- `git` → descarga el proyecto
- `ffmpeg` y `libwebp` → necesarios para los **stickers** y audios
- `python` → lo piden algunas dependencias al compilarse

### 3️⃣ Dar permiso de almacenamiento (opcional pero recomendado)

```bash
termux-setup-storage
```

### 4️⃣ Descargar Izuku Bot

```bash
git clone https://github.com/lyanvalentinmail-prog/Izuku-Bot.git
cd Izuku-Bot
```

### 5️⃣ Instalar las dependencias

```bash
npm install
```

> Tarda unos minutos la primera vez. Si falla, mira [Solución de problemas](#-solución-de-problemas).

### 6️⃣ Configurar tu número de dueño

```bash
nano config.js
```

Cambia la línea de `owner` por tu número **con código de país, sin `+` ni espacios**:

```js
owner: ['5212345678901'],
```

Guarda con **Ctrl + X**, luego **Y**, luego **Enter**.

### 7️⃣ Encender el bot

```bash
npm start
```

¡Listo! Ahora pasa a la vinculación 👇

---

## 🔗 Vincular el bot

Al arrancar por primera vez, el bot te pregunta:

```
¿Cómo quieres vincular tu WhatsApp?

  1. Código QR
  2. Código de 8 dígitos (pairing code)

Elige 1 o 2:
```

### Opción A — Código QR

```bash
npm run qr
```

1. Aparecerá un QR en la pantalla de Termux.
2. En tu teléfono: **WhatsApp ▸ Ajustes ▸ Dispositivos vinculados ▸ Vincular un dispositivo**.
3. Escanea el QR.

> 💡 Si el QR se ve cortado, reduce el tamaño de letra de Termux pellizcando la pantalla.

### Opción B — Código de 8 dígitos (recomendado en Termux)

```bash
npm run code
```

1. Te pedirá tu número: escríbelo con código de país, **sin `+`** → `5212345678901`
2. Verás algo como:

```
🔗 TU CÓDIGO DE VINCULACIÓN: ABCD-1234
```

3. En tu teléfono: **WhatsApp ▸ Ajustes ▸ Dispositivos vinculados ▸ Vincular con número de teléfono**.
4. Escribe el código. ¡Conectado!

También puedes pasar el número directo para no escribirlo cada vez:

```bash
node index.js --code 5212345678901
```

> La sesión queda guardada en la carpeta `sessions/`. La próxima vez solo ejecuta `npm start`
> y entrará solo. Si quieres cambiar de número, borra esa carpeta: `rm -rf sessions`.

---

## 🔋 Mantener el bot encendido

**Evita que Android mate Termux:**

```bash
termux-wake-lock
```

**Reinicio automático si se cae** (incluido en el proyecto):

```bash
./start.sh
```

**Dejarlo corriendo en segundo plano** con `screen`:

```bash
pkg install -y screen
screen -S izuku
npm start
# Para salir sin apagarlo: Ctrl + A, luego D
# Para volver:             screen -r izuku
```

---

## 📜 Lista de comandos

El prefijo por defecto es `.` (también sirven `!`, `/` y `#`).
Escribe `.menu` para verlos todos, o `.menu juegos` para filtrar por categoría.

### ℹ️ Información
| Comando | Descripción |
|---|---|
| `.menu` | Muestra todos los comandos |
| `.ping` | Velocidad de respuesta |
| `.infobot` | Datos del bot y del servidor |
| `.runtime` | Tiempo encendido |
| `.owner` | Contacto del dueño |
| `.script` | Código fuente |
| `.donar` | Apoyar el proyecto |

### 👤 Perfil
| Comando | Descripción |
|---|---|
| `.reg nombre.edad` | Registrarte (regala 1000 monedas) |
| `.unreg` | Borrar tu registro |
| `.perfil` | Ver tu perfil (o el de un @mencionado) |
| `.nivel` | Nivel y barra de experiencia |
| `.minombre <nombre>` | Cambiar tu nombre en el bot |

### 🧠 Inteligencia Artificial
| Comando | Descripción |
|---|---|
| `.ia <pregunta>` | Conversar con la IA |
| `.resumir <texto>` | Resumir o explicar un texto |
| `.codigo <petición>` | Generar o explicar código |
| `.imagina <descripción>` | Crear una imagen con IA |

### 🛠️ Herramientas
| Comando | Descripción |
|---|---|
| `.traducir en Hola` | Traducir a cualquier idioma |
| `.qr <texto>` | Generar un código QR |
| `.calc 5*(3+2)` | Calculadora |
| `.acortar <url>` | Acortar enlaces |
| `.clima <ciudad>` | Clima actual |
| `.tts es Hola` | Texto a voz (nota de voz) |
| `.ss <url>` | Captura de una página web |
| `.toimg` | Sticker ➜ imagen |
| `.tomp3` | Video/audio ➜ MP3 |
| `.tovn` | Video/audio ➜ nota de voz |

### 📥 Descargas
| Comando | Descripción |
|---|---|
| `.play <canción>` | Audio de YouTube |
| `.playvid <nombre>` | Video de YouTube |
| `.tiktok <url>` | TikTok sin marca de agua |
| `.ig <url>` | Instagram |
| `.fb <url>` | Facebook |

### 🎨 Stickers
| Comando | Descripción |
|---|---|
| `.s` | Imagen o video (máx 8 s) ➜ sticker |
| `.s Pack\|Autor` | Sticker con tu pack y autor personalizados |
| `.attp <texto>` | Sticker animado de texto |
| `.emojimix 😂+😭` | Mezclar dos emojis |
| `.swm Pack\|Autor` | Cambiar el pack/autor de un sticker existente |

### 🎮 Juegos
| Comando | Descripción |
|---|---|
| `.ppt piedra` | Piedra, papel o tijera |
| `.dado [apuesta]` | Lanzar un dado |
| `.8ball <pregunta>` | Bola mágica |
| `.ahorcado` / `.letra? a` | Juego del ahorcado |
| `.math` | Reto matemático contrarreloj |
| `.trivia` | Pregunta de cultura general |
| `.ruleta <monedas>` | Casino |

### 💰 Economía
| Comando | Descripción |
|---|---|
| `.balance` | Ver monedas |
| `.daily` | Recompensa diaria |
| `.work` | Trabajar (cada 10 min) |
| `.rob @usuario` | Robar monedas |
| `.pay @usuario 500` | Transferir |
| `.dep <n>` / `.ret <n>` | Banco |
| `.top` | Top 10 más ricos |

### 🔎 Búsqueda
| Comando | Descripción |
|---|---|
| `.ytsearch <texto>` | Buscar en YouTube |
| `.wiki <tema>` | Wikipedia |
| `.google <consulta>` | Buscar en la web |
| `.imagen <texto>` | Buscar imágenes |
| `.letra artista - canción` | Letras de canciones |

### 👥 Grupos *(requieren ser admin)*
| Comando | Descripción |
|---|---|
| `.kick @usuario` | Expulsar |
| `.add <número>` | Agregar |
| `.promote` / `.demote` | Dar o quitar admin |
| `.tagall [mensaje]` | Mencionar a todos |
| `.hidetag <mensaje>` | Notificar sin mostrar menciones |
| `.grupo abrir\|cerrar` | Abrir o cerrar el grupo |
| `.link` | Enlace de invitación |
| `.setname` / `.setdesc` | Cambiar nombre o descripción |
| `.antilink on\|off` | Expulsar a quien mande links de grupos |
| `.welcome on\|off` | Bienvenidas |
| `.infogrupo` | Información del grupo |

### 🤖 Sub-Bots
| Comando | Descripción |
|---|---|
| `.jadibot` | Volverte sub-bot con **código de 8 dígitos** |
| `.qrbot` | Volverte sub-bot con **QR** |
| `.stopbot` | Desconectar tu sub-bot |
| `.bots` | Ver sub-bots conectados |

---

## ⚙️ Configuración: cómo cambiar cosas

Todo lo que se personaliza está en **`config.js`**. Ábrelo con `nano config.js`.

### Cambiar el nombre del bot
```js
botName: 'Izuku Bot',   // ponle el nombre que quieras
```

### Cambiar el dueño
```js
owner: ['5212345678901'],              // un dueño
owner: ['5212345678901', '34600111222'], // varios dueños
ownerName: 'Lyan',
```

### Cambiar el prefijo
```js
prefix: ['.', '!', '/', '#'],  // varios prefijos a la vez
prefix: ['#'],                 // solo uno
prefix: [''],                  // SIN prefijo: "menu" funciona directo
```

### Cambiar la imagen del menú
```js
menuImage: 'https://i.imgur.com/tuimagen.jpg',
```

### Modos del bot
```js
self: false,       // true = el bot SOLO responde al dueño (modo privado)
onlyGroups: false, // true = solo funciona en grupos
autoRead: false,   // true = marca los mensajes como leídos
antiCall: true,    // rechaza llamadas automáticamente
maxSubBots: 20,    // cuántos sub-bots se permiten a la vez
```

### Ajustar la economía
```js
economy: {
  dailyReward: 1000,  // monedas del .daily
  workMin: 100,       // pago mínimo del .work
  workMax: 900,       // pago máximo del .work
  robChance: 0.45     // probabilidad de robar con éxito (45 %)
}
```

### Activar la IA con tu propia API key

Por defecto la IA usa servicios públicos gratuitos (pueden fallar o ir lentos).
Para usar tu propia clave, edita `config.js`:

```js
apis: {
  openai: 'sk-xxxxxxxxxxxxxxxx',   // de platform.openai.com
  gemini: ''                       // o de aistudio.google.com
}
```

O crea un archivo `.env` (copia `.env.example`) y ejecuta:

```bash
OPENAI_API_KEY=sk-xxxx npm start
```

### Cambiar el mensaje de bienvenida

Está en **`index.js`**, dentro del evento `group-participants.update`:

```js
text: `👋 ¡Bienvenido ${tag} a *${meta.subject}*!`
```

### Cambiar los textos de un comando

Cada comando es un archivo independiente dentro de `plugins/`. Por ejemplo, para cambiar
lo que dice el ping: `nano plugins/info/ping.js`. **No hace falta reiniciar el bot**: los
plugins se recargan solos al guardar.

---

## ➕ Cómo agregar un comando nuevo

1. Crea un archivo dentro de la categoría que quieras, por ejemplo
   `plugins/herramientas/saludo.js`:

```js
export default {
  // Palabras que activan el comando (la primera es la que sale en el menú)
  command: ['saludo', 'hola'],

  // Categoría (si la omites, se usa el nombre de la carpeta)
  category: 'herramientas',

  // Texto que aparece en el menú
  desc: 'Te saluda con tu nombre',

  // --- Restricciones opcionales (todas por defecto en false) ---
  // owner: true,     solo el dueño
  // group: true,     solo en grupos
  // private: true,   solo en privado
  // admin: true,     solo admins del grupo
  // botAdmin: true,  el bot debe ser admin
  // register: true,  el usuario debe estar registrado
  // hidden: true,    no aparece en el menú

  async run({ sock, m, text, args, usedPrefix, command, user, isOwner }) {
    if (!text) return m.reply(`👋 Uso: *${usedPrefix}${command} TuNombre*`)
    await m.reply(`¡Hola *${text}*! Tienes ${user.coins} monedas 💰`)
  }
}
```

2. Guarda el archivo. En la consola verás `[plugins] recargado: saludo.js`.
3. Pruébalo en WhatsApp: `.saludo Izuku`

### Qué recibe tu comando en `run({ ... })`

| Variable | Qué es |
|---|---|
| `sock` | Socket de Baileys (enviar mensajes, admin de grupos, etc.) |
| `m` | El mensaje: `m.chat`, `m.sender`, `m.text`, `m.isGroup`, `m.quoted`, `m.reply()`, `m.react('👍')`, `m.download()` |
| `text` | Todo lo que escribió el usuario después del comando |
| `args` | Ese texto separado en palabras (`args[0]`, `args[1]`…) |
| `command` | El comando que se usó |
| `usedPrefix` | El prefijo con el que se invocó |
| `user` | Datos del usuario en la base de datos (`coins`, `level`, `exp`…) |
| `chat` | Ajustes del chat (`welcome`, `antilink`, `mute`…) |
| `isOwner`, `isAdmin`, `isBotAdmin` | Permisos |
| `participants`, `groupMetadata` | Info del grupo |
| `db` | Base de datos completa |

### Cosas útiles

```js
// Enviar imagen
await sock.sendMessage(m.chat, { image: { url: 'https://...' }, caption: 'Hola' }, { quoted: m })

// Enviar un archivo cualquiera detectando el tipo
await sock.sendFile(m.chat, buffer, '', 'Mi archivo', m)

// Reaccionar
await m.react('🔥')

// Descargar la imagen/video a la que respondió el usuario
const buffer = await m.quoted.download()

// Mencionar a alguien
await sock.sendMessage(m.chat, { text: `Hola @${jid.split('@')[0]}`, mentions: [jid] })
```

### Agregar una categoría nueva al menú

1. Crea la carpeta: `mkdir plugins/anime`
2. Pon tus comandos dentro.
3. Abre `plugins/info/menu.js` y añade tu categoría a los tres objetos:

```js
const EMOJI = { ..., anime: '🌸' }
const TITLE = { ..., anime: 'ANIME' }
const ORDER = [..., 'anime']
```

### Quitar un comando

Simplemente borra su archivo: `rm plugins/juegos/ruleta.js`.

---

## 🤖 Cómo funcionan los sub-bots

Un **sub-bot** es otra persona que presta su número para que funcione con *tu* mismo código.
Todos los sub-bots comparten los plugins y la base de datos del bot principal.

1. El usuario escribe `.jadibot` (código de 8 dígitos) o `.qrbot` (QR).
2. El bot principal le envía el código/QR por privado o al grupo.
3. Él lo introduce en **WhatsApp ▸ Dispositivos vinculados**.
4. Su sesión se guarda en `subbots/<número>/` y **se reconecta sola** cada vez que enciendes el bot.
5. Para desconectarse: `.stopbot` (borra su sesión).

Ajusta el límite en `config.js` con `maxSubBots`.

> ⚠️ Cada sub-bot consume RAM. En un celular de gama media no pases de ~5 sub-bots.

---

## 👑 Comandos del dueño

Solo funcionan para los números que pusiste en `owner` dentro de `config.js`.

| Comando | Descripción |
|---|---|
| `.ban @usuario` / `.unban` | Bloquear o desbloquear a alguien del bot |
| `.addcoins @usuario 1000` | Regalar monedas |
| `.delcoins @usuario 500` | Quitar monedas |
| `.setprefix #` | Cambiar el prefijo al vuelo (`vacio` = sin prefijo) |
| `.mute` / `.unmute` | Silenciar al bot en el chat actual |
| `.bc <mensaje>` | Difusión a todos los grupos |
| `.reload` | Recargar todos los plugins sin reiniciar |
| `.restart` | Reiniciar el bot |
| `.cleartmp` | Borrar archivos temporales |

> `.setprefix` es temporal (hasta reiniciar). Para que sea permanente edita `config.js`.
> `.restart` solo vuelve a encender el bot si lo lanzaste con `./start.sh` o con pm2.

---

## 📂 Estructura del proyecto

```
Izuku-Bot/
├── index.js              # Conexión con WhatsApp (QR / código), eventos, bienvenidas
├── handler.js            # Procesa cada mensaje: prefijo, permisos, antilink, XP
├── config.js             # ⚙️ TODA la configuración editable
├── start.sh              # Arranque con reinicio automático
├── lib/
│   ├── loader.js         # Carga y recarga los plugins
│   ├── serialize.js      # Convierte los mensajes de Baileys en algo cómodo
│   ├── database.js       # Base de datos JSON (usuarios, chats)
│   ├── functions.js      # Utilidades: stickers, descargas, formatos
│   ├── downloader.js     # APIs de descarga (YouTube, TikTok…) ← edítalo si una falla
│   ├── ai.js             # Conexión con los modelos de IA
│   ├── sticker.js        # Creación de stickers + metadata (pack/autor)
│   ├── helpers.js        # Métodos extra del socket (sendFile…)
│   └── subbot.js         # Sistema de sub-bots
├── plugins/              # 🧩 Un archivo = un comando
│   ├── info/  perfil/  ia/  herramientas/  descargas/
│   ├── stickers/  juegos/  economia/  busqueda/  grupos/
│   └── subbots/  owner/
├── database/             # database.json (se crea solo)
├── sessions/             # Sesión del bot principal (NO la compartas)
└── subbots/              # Sesiones de los sub-bots
```

---

## 🩺 Solución de problemas

| Problema | Solución |
|---|---|
| `npm install` falla en Termux | `pkg install -y python make clang` y vuelve a intentar |
| `ffmpeg: not found` / stickers no funcionan | `pkg install -y ffmpeg libwebp` |
| El QR no se ve bien | Pellizca la pantalla para reducir la letra, o usa `npm run code` |
| El código de 8 dígitos no llega | Asegúrate de poner el número **con código de país y sin `+`** |
| `Connection closed` en bucle | Borra la sesión: `rm -rf sessions` y vuelve a vincular |
| El bot no responde | Revisa el **prefijo** en `config.js` y que `self` esté en `false` |
| Las descargas fallan | Las APIs públicas cambian seguido: edita/añade endpoints en `lib/downloader.js` |
| La IA no responde | Pon tu propia API key en `config.js ▸ apis` |
| Termux se cierra solo | Ejecuta `termux-wake-lock` y desactiva la optimización de batería de Termux |

---

<div align="center">

### ⚠️ Aviso

Este proyecto no está afiliado a WhatsApp ni a Meta. Úsalo de forma responsable:
el spam puede hacer que tu número sea **baneado**. Se recomienda usar un número secundario.

**Hecho con ❤️ y Node.js — Izuku Bot**

</div>
