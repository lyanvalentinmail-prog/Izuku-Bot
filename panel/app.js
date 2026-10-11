/* ================================================
   PANEL DE IZUKU BOT — lógica del navegador
   JavaScript puro, sin frameworks ni compilación.
   Habla con el servidor por /api/... y se mantiene
   en vivo con Server-Sent Events.
   ================================================ */

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

const estado = {
  clave: '',
  sesion: null,
  ajustes: [],
  resumen: {},
  stats: {},
  subbots: [],
  repos: [],
  comandos: [],
  banner: {},
  urls: {},
  filtro: '',
  categoria: 'todas',
  autoScroll: true,
  listo: false
}

/* ---------------- utilidades ---------------- */

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const hora = (t) => new Date(t).toLocaleTimeString('es', { hour12: false })

function duracion(seg) {
  seg = Math.max(0, Math.floor(seg))
  const d = Math.floor(seg / 86400)
  const h = Math.floor((seg % 86400) / 3600)
  const mn = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${mn}m`
  if (mn) return `${mn}m ${s}s`
  return `${s}s`
}

function avisar(texto, tipo = 'info', ms = 4200) {
  const caja = document.createElement('div')
  caja.className = `toast ${tipo}`
  caja.textContent = texto
  $('#avisos').appendChild(caja)
  setTimeout(() => { caja.style.opacity = '0'; setTimeout(() => caja.remove(), 300) }, ms)
}

function pedir(ruta, { method = 'GET', cuerpo, crudo, tipo } = {}) {
  const cabeceras = { 'X-Panel-Key': estado.clave }
  let body
  if (cuerpo !== undefined) {
    if (crudo) { cabeceras['Content-Type'] = tipo || 'application/octet-stream'; body = cuerpo }
    else { cabeceras['Content-Type'] = 'application/json'; body = JSON.stringify(cuerpo) }
  }
  return fetch(ruta, { method, headers: cabeceras, body })
    .then(async (res) => {
      const datos = await res.json().catch(() => ({}))
      if (res.status === 401) { mostrarLogin('Clave incorrecta o vencida.'); throw new Error('No autorizado') }
      if (!res.ok || datos.ok === false) throw new Error(datos.error || `Error ${res.status}`)
      return datos
    })
}

/* ---------------- clave del panel ---------------- */

function leerClaveDeLaUrl() {
  const url = new URL(location.href)
  const k = url.searchParams.get('k') || url.searchParams.get('clave')
  if (!k) return null
  localStorage.setItem('izuku_clave', k)
  url.searchParams.delete('k'); url.searchParams.delete('clave')
  history.replaceState(null, '', url.pathname + url.search + url.hash)
  return k
}

function mostrarLogin(mensaje = '') {
  $('#app').classList.add('oculto')
  $('#login').classList.remove('oculto')
  $('#login-error').textContent = mensaje
  $('#login-clave').focus()
}

function mostrarApp() {
  $('#login').classList.add('oculto')
  $('#app').classList.remove('oculto')
}

/* ---------------- carga inicial ---------------- */

async function cargar() {
  const datos = await pedir('/api/status')
  aplicarEstado(datos)
  if (!estado.listo) {
    await cargarComandos()
    estado.listo = true
  }
  conectarStream()
}

function aplicarEstado(datos) {
  estado.sesion = datos.sesion || estado.sesion
  if (datos.ajustes) estado.ajustes = datos.ajustes
  if (datos.resumen) estado.resumen = datos.resumen
  if (datos.stats) estado.stats = datos.stats
  if (datos.subbots) estado.subbots = datos.subbots
  if (datos.repos) estado.repos = datos.repos
  if (datos.banner) estado.banner = datos.banner
  estado.urls = { url: datos.url }

  $('#titulo-bot').textContent = estado.resumen.botName || 'Izuku Bot'
  $('#pie-entorno').textContent = estado.stats.entorno ? `${estado.stats.entorno} · Node ${estado.stats.node}` : ''
  if (datos.url) {
    const a = $('#titulo-url')
    a.textContent = datos.url.replace(/^https?:\/\//, '')
    a.href = datos.url
  }

  renderConexion()
  renderAjustes()
  renderBanner()
  renderSubbots()
  renderRepos()
  renderStats()
  if (datos.logs) pintarLogs(datos.logs, true)
}

async function cargarComandos() {
  try {
    const datos = await pedir('/api/commands')
    estado.comandos = datos.comandos || []
    $('#cmd-total').textContent = datos.total ?? estado.comandos.length
    renderCategorias()
    renderComandos()
    $('#sub-limite').textContent = estado.resumen.maxSubBots ?? '—'
  } catch (e) { avisar(e.message, 'error') }
}

/* ---------------- stream en vivo ---------------- */

let fuente = null
function conectarStream() {
  if (fuente) fuente.close()
  fuente = new EventSource(`/api/events?k=${encodeURIComponent(estado.clave)}`)

  fuente.addEventListener('hola', (ev) => {
    const d = JSON.parse(ev.data)
    estado.sesion = d.sesion || estado.sesion
    estado.stats = d.stats || estado.stats
    estado.subbots = d.subbots || estado.subbots
    renderConexion(); renderSubbots(); renderStats()
  })

  fuente.addEventListener('sesion', (ev) => {
    const d = JSON.parse(ev.data)
    estado.sesion = d.sesion || estado.sesion
    estado.stats = d.stats || estado.stats
    renderConexion(); renderStats()
  })

  fuente.addEventListener('log', (ev) => {
    pintarLogs([JSON.parse(ev.data)])
  })

  fuente.addEventListener('cambio', () => { recargarSilencioso() })

  fuente.addEventListener('error', () => {
    // EventSource reintenta solo; si el servidor está caído avisamos una vez
    if (fuente.readyState === EventSource.CLOSED) {
      setTimeout(conectarStream, 4000)
    }
  })
}

async function recargarSilencioso() {
  try { aplicarEstado(await pedir('/api/status')) } catch {}
}

/* ---------------- pestaña: vincular ---------------- */

const TEXTOS_ESTADO = {
  idle: ['gris', 'Sin vincular'],
  starting: ['azul', 'Iniciando…'],
  qr: ['ambar', 'Esperando que escanees el QR'],
  pairing: ['ambar', 'Esperando el código de 8 dígitos'],
  connecting: ['azul', 'Conectando con WhatsApp…'],
  open: ['verde', 'Conectado'],
  reconnecting: ['ambar', 'Reconectando…'],
  closed: ['rojo', 'Desconectado'],
  loggedOut: ['rojo', 'Sesión cerrada']
}

function renderConexion() {
  const s = estado.sesion || {}
  const [color, texto] = TEXTOS_ESTADO[s.status] || ['gris', s.status || '—']
  $('#pastilla').className = `pastilla ${color}`
  $('#pastilla-txt').textContent = texto

  const detalle = []
  if (s.status === 'open') {
    detalle.push(`✅ El bot está conectado a WhatsApp${s.me?.phone ? ` como <b>+${esc(s.me.phone)}</b>` : ''}.`)
    if (s.connectedAt) detalle.push(`Conectado desde ${hora(s.connectedAt)} (${duracion((Date.now() - s.connectedAt) / 1000)}).`)
    detalle.push('Escribe <code>.menu</code> desde cualquier chat para probarlo.')
  } else if (s.status === 'qr') {
    detalle.push('📷 WhatsApp ya envió el código QR. Escanéalo antes de que expire: se renueva solo cada pocos segundos.')
  } else if (s.status === 'pairing') {
    detalle.push(s.pairing?.code
      ? '🔗 El código de 8 dígitos está listo. Escríbelo en WhatsApp antes de que expire.'
      : '⏳ Pidiéndole el código a WhatsApp… si tarda, prueba con «Pedir otro código».')
  } else if (s.status === 'reconnecting') {
    detalle.push(`🔄 Se cortó la conexión y el bot está volviendo a entrar (intento ${s.restarts || 1}).`)
  } else if (s.status === 'loggedOut') {
    detalle.push('⚠️ La sesión se cerró desde el teléfono. Vincula el bot otra vez con QR o con código de 8 dígitos.')
  } else if (s.status === 'starting' || s.status === 'connecting') {
    detalle.push('⏳ Abriendo la conexión con WhatsApp…')
  } else if (s.registered) {
    detalle.push('💾 Hay una sesión guardada en el servidor, pero el bot no está conectado ahora mismo.')
  } else {
    detalle.push('👋 El bot todavía no está vinculado. Elige <b>QR</b> o <b>código de 8 dígitos</b> para empezar.')
  }
  if (s.error) detalle.push(`<span style="color:var(--rojo)">${esc(s.error)}</span>`)
  $('#estado-detalle').innerHTML = detalle.join('<br>')

  $('#conexion-desde').textContent = s.connectedAt && s.status === 'open' ? `conectado desde ${hora(s.connectedAt)}` : ''

  // ---- Botones según el estado ----
  const acciones = []
  const ocupado = ['starting', 'connecting', 'reconnecting'].includes(s.status)
  const puedeVincular = !ocupado && s.status !== 'open' && !s.registered

  if (puedeVincular) {
    acciones.push('<button class="btn primario grande" id="btn-iniciar-qr">📷 Vincular con QR</button>')
    acciones.push('<button class="btn grande" id="btn-iniciar-codigo">🔢 Vincular con código</button>')
  }
  if (s.status === 'qr') acciones.push('<button class="btn" id="btn-reiniciar2">↻ Reiniciar QR</button>')
  if (s.status === 'open') {
    acciones.push('<button class="btn" id="btn-reiniciar2">🔁 Reiniciar conexión</button>')
    acciones.push('<button class="btn peligro" id="btn-logout">🚪 Cerrar sesión de WhatsApp</button>')
  }
  if (s.registered && s.status !== 'open') acciones.push('<button class="btn" id="btn-reiniciar2">🔁 Reiniciar conexión</button>')

  $('#acciones-conexion').innerHTML = acciones.join('')

  const alBtn = (id, fn) => { const b = $('#' + id); if (b) b.onclick = fn }

  alBtn('btn-iniciar-qr', () => conectar('qr'))
  alBtn('btn-iniciar-codigo', () => {
    $('#tarjeta-codigo').scrollIntoView({ behavior: 'smooth', block: 'center' })
    $('#cod-numero').focus()
    avisar('Escribe tu número y toca «Pedir código»', 'info')
  })
  alBtn('btn-reiniciar2', () => accion(async () => {
    await pedir('/api/restart', { method: 'POST' })
    avisar('Conexión reiniciada', 'ok')
  }))
  alBtn('btn-logout', () => {
    if (!confirm('¿Cerrar la sesión de WhatsApp?\n\nEl bot se desconecta y hay que vincularlo otra vez.')) return
    accion(async () => {
      await pedir('/api/logout', { method: 'POST' })
      avisar('Sesión cerrada', 'warn')
    })
  })

  // ---- Tarjeta del QR ----
  const tarjetaQr = $('#tarjeta-qr')
  const tarjetaCod = $('#tarjeta-codigo')
  tarjetaQr.classList.toggle('oculto', !(s.status === 'qr' && s.qr))
  // La tarjeta del código está siempre a la vista mientras no esté conectado:
  // así puedes escribir tu número y pedir el código cuando quieras.
  tarjetaCod.classList.toggle('oculto', s.status === 'open')

  if (s.qr && s.status === 'qr') {
    const img = $('#qr-img')
    if (img.dataset.t !== String(s.qr.receivedAt)) {
      img.dataset.t = String(s.qr.receivedAt)
      if (s.qr.image) { img.src = s.qr.image; img.classList.remove('oculto') }
      else { img.removeAttribute('src') }
    }
    $('#qr-pie').textContent = s.qr.image
      ? `QR #${s.qr.count || 1} · enviado por WhatsApp a las ${hora(s.qr.receivedAt)}`
      : 'Falta la librería "qrcode" (ejecuta npm install en el servidor) para dibujar el QR acá. Mientras tanto usa el código de 8 dígitos.'
  }

  // ---- Tarjeta del código ----
  if (s.pairing || s.status === 'pairing') {
    const p = s.pairing || {}
    $('#cod-numero').value = p.phone || s.phone || ''
    $('#cod-numero-eco').textContent = p.phone ? `+${p.phone}` : 'tu número'
    $('#cod-valor').textContent = p.code ? p.pretty : '····-····'
    $('#cod-caja').classList.toggle('oculto', !p.code && !p.error)
    $('#cod-pie').textContent = p.code
      ? `Código pedido a las ${hora(p.createdAt)} · expira en ${Math.max(0, Math.round((p.expiresAt - Date.now()) / 1000))} s`
      : (p.error ? '' : 'Pidiéndole el código a WhatsApp…')
    const aviso = $('#cod-error-wrap')
    aviso.hidden = !p.error
    $('#cod-error').textContent = p.error ? `WhatsApp no entregó el código: ${p.error}` : ''
  }

  // ---- Sesión guardada ----
  const tieneSesion = !!s.registered
  $('#tarjeta-sesion-guardada').classList.toggle('oculto', !tieneSesion)
  if (tieneSesion) {
    $('#sesion-txt').innerHTML = s.status === 'open'
      ? 'El bot está conectado. Si borras la sesión tendrás que vincularlo de nuevo.'
      : 'Hay una sesión guardada (`sessions/creds.json`). Si no logra conectarse, bórrala y vincula otra vez.'
  }
}

async function conectar(method) {
  const botones = ['#btn-iniciar-qr', '#btn-iniciar-codigo'].map((s) => $(s)).filter(Boolean)
  botones.forEach((b) => { b.disabled = true })
  try {
    const tel = $('#cod-numero').value.replace(/\D/g, '')
    if (method === 'pairing' && (tel.length < 8 || tel.length > 15)) {
      throw new Error('Escribe tu número con código de país, sin + ni espacios (ej: 59896719709).')
    }
    await pedir('/api/connect', { method: 'POST', cuerpo: { method, phone: tel } })
    avisar(method === 'qr' ? 'Listo: escanea el QR' : 'Listo: mira el código de abajo', 'ok')
    await recargarSilencioso()
  } catch (e) {
    avisar(e.message, 'error', 7000)
  } finally {
    botones.forEach((b) => { b.disabled = false })
  }
}

async function accion(fn) {
  try { await fn(); await recargarSilencioso() } catch (e) { avisar(e.message, 'error', 7000) }
}

/* ---------------- pestaña: ajustes ---------------- */

function renderAjustes() {
  const cont = $('#form-ajustes')
  const grupos = {}
  for (const campo of estado.ajustes) (grupos[campo.group] ||= []).push(campo)

  cont.innerHTML = Object.entries(grupos).map(([grupo, campos]) => `
    <div class="grupo">
      <h3>${esc(grupo)}</h3>
      ${campos.map((c) => campoHtml(c)).join('')}
    </div>`).join('')

  // Interruptores
  $$('.si-no', cont).forEach((sw) => {
    sw.onclick = () => {
      const input = $('input', sw)
      input.checked = !input.checked
      sw.classList.toggle('si', input.checked)
      const txt = sw.parentElement.querySelector('.txt')
      if (txt) txt.textContent = input.checked ? 'Activado' : 'Apagado'
    }
  })
  // Secreto: mostrar/ocultar
  $$('.ver-secreto', cont).forEach((b) => {
    b.onclick = () => {
      const i = $('input', b.parentElement)
      i.type = i.type === 'password' ? 'text' : 'password'
    }
  })
}

function campoHtml(c) {
  const v = c.value
  const id = 'aj-' + c.key.replace(/\./g, '-')

  if (c.type === 'bool') {
    return `<div class="campo-ajuste">
      <label>${esc(c.label)}</label>
      <div class="interruptor">
        <span class="si-no ${v ? 'si' : ''}"><input type="checkbox" class="oculto-input" id="${id}" data-clave="${c.key}" data-tipo="bool" ${v ? 'checked' : ''}></span>
        <span class="txt">${v ? 'Activado' : 'Apagado'}</span>
      </div>
      ${c.help ? `<small class="muted">${esc(c.help)}</small>` : ''}
    </div>`
  }

  if (c.type === 'banner') {
    return `<div class="campo-ajuste">
      <label for="${id}">${esc(c.label)}</label>
      <input type="text" id="${id}" data-clave="${c.key}" data-tipo="text" value="${esc(v)}" placeholder="./media/banner.jpg o https://…">
      ${c.help ? `<small class="muted">${esc(c.help)}</small>` : ''}
    </div>`
  }

  if (c.type === 'number') {
    return `<div class="campo-ajuste">
      <label for="${id}">${esc(c.label)}</label>
      <input type="number" id="${id}" data-clave="${c.key}" data-tipo="number"
        value="${esc(v)}" ${c.min !== undefined ? `min="${c.min}"` : ''} ${c.max !== undefined ? `max="${c.max}"` : ''} ${c.step ? `step="${c.step}"` : ''}>
      ${c.help ? `<small class="muted">${esc(c.help)}</small>` : ''}
    </div>`
  }

  const lista = Array.isArray(v) ? v.join(' ') : v
  const tipo = c.secret ? 'password' : 'text'
  return `<div class="campo-ajuste">
    <label for="${id}">${esc(c.label)}</label>
    <div style="display:flex;gap:8px">
      <input type="${tipo}" id="${id}" data-clave="${c.key}" data-tipo="${c.type}"
        value="${esc(lista)}" placeholder="${c.type === 'list' ? 'separa con espacios' : ''}">
      ${c.secret ? '<button type="button" class="btn chico-btn ver-secreto">👁</button>' : ''}
    </div>
    ${c.help ? `<small class="muted">${esc(c.help)}</small>` : ''}
  </div>`
}

async function guardarAjustes() {
  const patch = {}
  $$('#form-ajustes [data-clave]').forEach((el) => {
    const clave = el.dataset.clave
    const tipo = el.dataset.tipo
    if (tipo === 'bool') patch[clave] = el.checked
    else if (tipo === 'number') patch[clave] = Number(el.value)
    else patch[clave] = el.value
  })
  try {
    const r = await pedir('/api/settings', { method: 'POST', cuerpo: patch })
    estado.ajustes = r.ajustes
    avisar(`Guardado ✅ (${(r.cambios || []).length} ajustes)`, 'ok')
    renderAjustes(); renderBanner()
    $('#titulo-bot').textContent = r.resumen?.botName || $('#titulo-bot').textContent
  } catch (e) {
    avisar(e.message, 'error', 8000)
  }
}

function renderBanner() {
  const b = estado.banner || {}
  const img = $('#banner-img')
  const vacio = $('#banner-vacio')
  const mostrar = b.existe && !b.esUrl
  img.classList.toggle('oculto', !mostrar)
  vacio.classList.toggle('oculto', mostrar)
  if (mostrar) img.src = `/api/banner?t=${b.actualizado || Date.now()}`
  else if (b.esUrl) {
    img.classList.remove('oculto'); vacio.classList.add('oculto')
    img.src = b.valor
    img.onerror = () => { img.classList.add('oculto'); vacio.classList.remove('oculto'); vacio.textContent = 'No se pudo cargar la URL del banner' }
  } else {
    vacio.textContent = 'Sin banner: el menú se envía solo con texto'
  }
}

/* ---------------- pestaña: comandos ---------------- */

function renderCategorias() {
  const cats = [...new Set(estado.comandos.map((c) => c.category))].sort()
  $('#cmd-cats').innerHTML = ['todas', ...cats]
    .map((c) => `<span class="chip ${estado.categoria === c ? 'activo' : ''}" data-cat="${esc(c)}">${c === 'todas' ? 'Todas' : esc(c)}</span>`)
    .join('')
  $$('#cmd-cats .chip').forEach((ch) => {
    ch.onclick = () => { estado.categoria = ch.dataset.cat; renderCategorias(); renderComandos() }
  })
}

function renderComandos() {
  const f = estado.filtro.toLowerCase()
  const lista = estado.comandos.filter((c) => {
    if (estado.categoria !== 'todas' && c.category !== estado.categoria) return false
    if (!f) return true
    return c.command.some((x) => x.includes(f)) || (c.desc || '').toLowerCase().includes(f)
  })

  $('#cmd-lista').innerHTML = lista.length
    ? lista.map((c) => {
        const candado = c.owner || c.rowner ? ' 👑' : c.admin ? ' 🛡️' : c.group ? ' 👥' : c.register ? ' 📝' : ''
        const etiqueta = c.repo ? `${c.category} · repo` : c.category
        return `<div class="cmd" data-cmd="${esc(c.command[0])}">
          <span class="cat">${esc(etiqueta)}</span>
          <b>${esc(c.command.slice(0, 4).join(' · '))}${candado}</b>
          <small>${esc(c.desc || 'sin descripción')}</small>
        </div>`
      }).join('')
    : '<div class="vacio">No hay comandos que coincidan.</div>'

  $$('#cmd-lista .cmd').forEach((el) => {
    el.onclick = () => {
      $('#run-cmd').value = el.dataset.cmd
      $('#run-args').value = ''
      $('#run-cmd').scrollIntoView({ behavior: 'smooth', block: 'center' })
      $('#run-args').focus()
    }
  })
}

async function ejecutarComando() {
  const command = $('#run-cmd').value.trim().replace(/^\W+/, '')
  if (!command) return avisar('Escribe un comando', 'warn')
  const args = $('#run-args').value.trim() ? $('#run-args').value.trim().split(/\s+/) : []
  const boton = $('#btn-run')
  boton.disabled = true
  pintarConsola({ tipo: 'out', texto: `▸ ${estado.resumen.prefix?.[0] || '.'}${command} ${args.join(' ')}` })
  try {
    const r = await pedir('/api/commands/run', { method: 'POST', cuerpo: { command, args } })
    if (r.salida?.length) pintarConsola({ tipo: 'ok', texto: r.salida.join('\n\n') })
    else pintarConsola({ tipo: 'ok', texto: '✔ Comando ejecutado (la respuesta se envió a tu WhatsApp).' })
  } catch (e) {
    pintarConsola({ tipo: 'error', texto: `✖ ${e.message}` })
    avisar(e.message, 'error', 7000)
  } finally { boton.disabled = false }
}

const consolaSalida = () => $('#consola-salida')
function pintarConsola({ tipo = 'info', texto = '' }) {
  const consola = consolaSalida()
  $('.consola-vacia', consola)?.remove()
  const div = document.createElement('div')
  div.className = `ln ${tipo}`
  div.innerHTML = `<span class="hora">${hora(Date.now())}</span>${esc(texto)}`
  consola.appendChild(div)
  consola.scrollTop = consola.scrollHeight
}

/* ---------------- consola del sistema ---------------- */

function pintarLogs(lineas, reemplazar = false) {
  const consola = $('#consola')
  if (reemplazar) consola.innerHTML = ''
  for (const l of lineas) {
    const div = document.createElement('div')
    div.className = `ln ${l.level === 'error' ? 'error' : l.level === 'warn' ? 'warn' : l.level === 'ok' ? 'ok' : ''}`
    div.innerHTML = `<span class="hora">${hora(l.t)}</span>${esc(l.text)}`
    consola.appendChild(div)
  }
  while (consola.childElementCount > 400) consola.firstElementChild.remove()
  if (estado.autoScroll) consola.scrollTop = consola.scrollHeight
}

/* ---------------- pestaña: sub-bots ---------------- */

function renderSubbots() {
  const subs = estado.subbots || []
  $('#sub-total').textContent = subs.length
  $('#sub-limite').textContent = estado.resumen.maxSubBots ?? $('#sub-limite').textContent

  const caja = $('#sub-lista')
  if (!subs.length) {
    caja.innerHTML = '<div class="vacio">Todavía no hay sub-bots. Agrega un número arriba y vincúlalo con QR o con código.</div>'
    return
  }

  caja.innerHTML = subs.map((s) => {
    const etiqueta = TEXTOS_ESTADO[s.status] || ['gris', s.status]
    const qr = s.qr?.image && s.status === 'qr'
      ? `<div class="qr-marco"><img src="${s.qr.image}" alt="QR del sub-bot"></div>
         <div class="barra"><div class="barra-relleno" data-expira="${s.qr.expiresAt}"></div></div>
         <p class="chico muted">QR #${s.qr.count || 1} enviado por WhatsApp a las ${hora(s.qr.receivedAt)}</p>`
      : ''
    const codigo = s.pairing?.code
      ? `<div class="codigo-grande">${esc(s.pairing.pretty)}</div>
         <p class="chico muted">Código real pedido a WhatsApp. Después de pedir otro, este deja de servir.</p>`
      : ''
    const error = s.error ? `<p class="aviso">${esc(s.error)}</p>` : ''
    return `<div class="sub">
      <div class="fila-entre">
        <div>
          <div class="num">+${esc(s.phone || s.id)}</div>
          <span class="chico muted">método: ${s.method === 'pairing' ? 'código' : 'QR'}${s.connectedAt ? ` · conectado desde ${hora(s.connectedAt)}` : ''}</span>
        </div>
        <span class="pastilla ${etiqueta[0]}"><i class="punto"></i>${esc(etiqueta[1])}</span>
      </div>
      ${qr}${codigo}${error}
      <div class="acciones">
        <button class="btn chico-btn" data-subcodigo="${esc(s.id)}">🔢 Pedir código</button>
        <button class="btn chico-btn" data-subreiniciar="${esc(s.id)}">↻ Reiniciar</button>
        <button class="btn chico-btn peligro" data-subborrar="${esc(s.id)}">🗑️ Detener</button>
      </div>
    </div>`
  }).join('')

  $$('[data-subcodigo]', caja).forEach((b) => {
    b.onclick = () => accion(async () => {
      const r = await pedir('/api/subbots/code', { method: 'POST', cuerpo: { phone: b.dataset.subcodigo } })
      if (r.subbots) estado.subbots = r.subbots
      avisar('Código pedido. Mira la tarjeta del sub-bot.', 'ok')
    })
  })
  $$('[data-subreiniciar]', caja).forEach((b) => {
    b.onclick = () => accion(async () => {
      const metodo = prompt('¿Vincular con "qr" o con "pairing" (código)?', 'qr')
      if (!metodo) return
      await pedir(`/api/subbots?phone=${encodeURIComponent(b.dataset.subreiniciar)}`, { method: 'DELETE' })
      await pedir('/api/subbots', { method: 'POST', cuerpo: { phone: b.dataset.subreiniciar, method: metodo === 'pairing' ? 'pairing' : 'qr' } })
    })
  })
  $$('[data-subborrar]', caja).forEach((b) => {
    b.onclick = () => {
      if (!confirm('¿Detener este sub-bot y borrar su sesión?')) return
      accion(async () => {
        await pedir(`/api/subbots?phone=${encodeURIComponent(b.dataset.subborrar)}`, { method: 'DELETE' })
        avisar('Sub-bot detenido', 'warn')
      })
    }
  })
}

/* ---------------- pestaña: bots — repositorios ---------------- */

function renderRepos() {
  const lista = estado.repos || []
  const caja = $('#repo-lista')
  if (!caja) return

  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">Todavía no hay bots por repositorio. Pega arriba el enlace de GitHub de un bot para usar sus comandos.</div>'
    return
  }

  caja.innerHTML = lista.map((r) => `
    <div class="repo">
      <div class="fila-entre">
        <div>
          <div class="num">${esc(r.owner)}/${esc(r.repo)}</div>
          <span class="chico muted">${r.cargados ?? r.comandos ?? 0} comando(s)${r.branch ? ` · rama ${esc(r.branch)}` : ''}${r.instalado ? ` · ${new Date(r.instalado).toLocaleDateString('es')}` : ''}</span>
        </div>
        <a class="chico" href="${esc(r.url)}" target="_blank" rel="noopener">GitHub ↗</a>
      </div>
      ${r.error ? `<p class="aviso">${esc(r.error)}</p>` : ''}
      <div class="acciones">
        <button class="btn chico-btn" data-reporecargar="${esc(r.id)}">Recargar</button>
        <button class="btn chico-btn peligro" data-repoborrar="${esc(r.id)}">Quitar</button>
      </div>
    </div>`).join('')

  $$('[data-reporecargar]', caja).forEach((b) => {
    b.onclick = () => accion(async () => {
      b.disabled = true
      try {
        const r = await pedir('/api/repos/reload', { method: 'POST', cuerpo: { id: b.dataset.reporecargar } })
        estado.repos = r.repos
        renderRepos()
        avisar('Bot recargado', 'ok')
      } finally { b.disabled = false }
    })
  })
  $$('[data-repoborrar]', caja).forEach((b) => {
    b.onclick = () => {
      if (!confirm('¿Quitar este bot y sus comandos?')) return
      accion(async () => {
        const r = await pedir(`/api/repos?id=${encodeURIComponent(b.dataset.repoborrar)}`, { method: 'DELETE' })
        estado.repos = r.repos
        renderRepos()
        avisar('Bot quitado', 'warn')
      })
    }
  })
}

/* ---------------- pestaña: sistema ---------------- */

function renderStats() {
  const s = estado.stats || {}
  const d = s.disco

  // Cuánto almacenamiento queda (chip de la cabecera + barra de Sistema)
  const chip = $('#almacen')
  if (chip) chip.textContent = d ? `Disco: ${d.libreGB} GB libres` : 'Disco: —'
  const resumen = $('#disco-resumen')
  if (resumen) resumen.textContent = d ? `Quedan ${d.libreGB} GB libres de ${d.totalGB} GB · usado ${d.pct}%` : '—'
  const barra = $('#disco-barra')
  if (barra && d) {
    barra.style.width = Math.min(100, d.pct) + '%'
    barra.classList.toggle('poco', d.pct > 85)
  }

  const filas = [
    ['Estado', (TEXTOS_ESTADO[estado.sesion?.status] || ['', '—'])[1]],
    ['Encendido hace', s.uptime !== undefined ? duracion(s.uptime) : '—'],
    ['Número conectado', estado.sesion?.me?.phone ? `+${estado.sesion.me.phone}` : '—'],
    ['Comandos cargados', s.comandos ?? '—'],
    ['Usuarios', s.usuarios ?? '—'],
    ['Chats configurados', s.chats ?? '—'],
    ['Sub-bots', `${s.subbotsActivos ?? 0} activos / ${s.subbots ?? 0}`],
    ['Almacenamiento libre', d ? `${d.libreGB} GB de ${d.totalGB} GB` : '—'],
    ['Memoria', s.memoriaMB !== undefined ? `${s.memoriaMB} MB` : '—'],
    ['Node', s.node || '—'],
    ['Entorno', s.entorno || '—'],
    ['Carpeta de sesión', s.carpetaSesion || '—'],
    ['Disco persistente', s.discoPersistente ? 'Sí 🎉' : 'No (la sesión se pierde al redesplegar)'],
    ['Reconexiones', s.reconexiones ?? 0]
  ]
  $('#stats').innerHTML = filas.map(([k, v]) => `<div class="stat"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')
}

/* ---------------- barras de tiempo (QR y códigos) ---------------- */

setInterval(() => {
  const s = estado.sesion || {}
  // QR del bot principal
  const qr = s.qr
  const barraQr = $('#qr-barra')
  if (qr && s.status === 'qr') {
    const total = Math.max(1, qr.expiresAt - qr.receivedAt)
    const resta = qr.expiresAt - Date.now()
    const pct = Math.max(0, Math.min(100, (resta / total) * 100))
    barraQr.style.width = pct + '%'
    barraQr.classList.toggle('poco', pct < 35)
    $('#qr-velo').classList.toggle('oculto', resta > -1500)
    if (resta < 0) $('#qr-pie').textContent = 'Este QR ya expiró, esperando el siguiente…'
  }
  // Código de 8 dígitos
  const p = s.pairing
  const barraCod = $('#cod-barra')
  if (p?.code) {
    const total = Math.max(1, (p.expiresAt || 0) - (p.createdAt || 0))
    const resta = (p.expiresAt || 0) - Date.now()
    const pct = Math.max(0, Math.min(100, (resta / total) * 100))
    barraCod.style.width = pct + '%'
    barraCod.classList.toggle('poco', pct < 35)
    const seg = Math.round(resta / 1000)
    $('#cod-pie').textContent = seg > 0
      ? `Código pedido a las ${hora(p.createdAt)} · expira en ${seg} s`
      : 'Este código ya expiró: pide uno nuevo.'
  }
  // Barras de los sub-bots
  $$('[data-expira]').forEach((el) => {
    const fin = Number(el.dataset.expira)
    const resta = fin - Date.now()
    const pct = Math.max(0, Math.min(100, (resta / 60000) * 100))
    el.style.width = pct + '%'
    el.classList.toggle('poco', pct < 35)
  })
}, 1000)

/* ---------------- eventos de la interfaz ---------------- */

function cambiarTab(nombre) {
  $$('.tab').forEach((t) => t.classList.toggle('activo', t.dataset.tab === nombre))
  $$('.vista').forEach((v) => v.classList.toggle('activa', v.id === `vista-${nombre}`))
  location.hash = nombre
}

$('#tabs').addEventListener('click', (e) => {
  const t = e.target.closest('.tab')
  if (t) cambiarTab(t.dataset.tab)
})

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const clave = $('#login-clave').value.trim()
  if (!clave) return
  estado.clave = clave
  try {
    await cargar()
    localStorage.setItem('izuku_clave', clave)
    mostrarApp()
    avisar('¡Bienvenido al panel!', 'ok')
  } catch (err) {
    mostrarLogin(err.message === 'No autorizado' ? 'Clave incorrecta.' : err.message)
  }
})

$('#btn-salir').onclick = () => {
  localStorage.removeItem('izuku_clave')
  estado.clave = ''
  fuente?.close()
  mostrarLogin('Clave olvidada. Vuelve a escribirla para entrar.')
}

/* ---- Pedir el código de 8 dígitos (real, tal cual lo devuelve WhatsApp) ---- */
async function pedirCodigo(boton) {
  const tel = $('#cod-numero').value.replace(/\D/g, '')
  if (tel.length < 8 || tel.length > 15) {
    return avisar('Escribe tu número con código de país, sin + ni espacios (ej: 59896719709).', 'warn', 6000)
  }
  if (boton) boton.disabled = true
  try {
    const s = estado.sesion || {}
    if (s.status === 'pairing' || s.method === 'pairing') {
      await pedir('/api/pairing', { method: 'POST', cuerpo: { phone: tel } })
    } else {
      await pedir('/api/connect', { method: 'POST', cuerpo: { method: 'pairing', phone: tel } })
    }
    avisar('Código pedido a WhatsApp. Aparece abajo en grande.', 'ok')
    await recargarSilencioso()
  } catch (e) {
    avisar(`No se pudo generar el código: ${e.message}`, 'error', 9000)
    await recargarSilencioso()
  } finally {
    if (boton) boton.disabled = false
  }
}

$('#btn-codigo').onclick = (e) => pedirCodigo(e.currentTarget)
$('#btn-recodigo').onclick = (e) => pedirCodigo(e.currentTarget)
$('#btn-reiniciar').onclick = () => accion(async () => {
  await pedir('/api/restart', { method: 'POST' })
  avisar('Conexión reiniciada', 'ok')
})

$('#cmd-buscar').addEventListener('input', (e) => { estado.filtro = e.target.value; renderComandos() })
$('#btn-run').onclick = ejecutarComando
$('#run-args').addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarComando() })
$('#repo-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-repo-instalar').click() })
$('#repo-rama').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-repo-instalar').click() })
$('#btn-guardar').onclick = guardarAjustes
$('#btn-recargar').onclick = () => accion(async () => { avisar('Cambios descartados', 'info') })
$('#btn-reset-ajustes').onclick = () => {
  if (!confirm('¿Restaurar los valores de config.js? Los cambios hechos desde el panel se pierden.')) return
  accion(async () => {
    const r = await pedir('/api/settings/reset', { method: 'POST' })
    estado.ajustes = r.ajustes
    renderAjustes(); renderBanner()
    avisar('Ajustes restaurados', 'warn')
  })
}

$('#btn-banner-subir').onclick = () => $('#banner-file').click()
$('#banner-file').addEventListener('change', async (e) => {
  const archivo = e.target.files?.[0]
  if (!archivo) return
  if (archivo.size > 8 * 1024 * 1024) return avisar('La imagen supera los 8 MB', 'error')
  try {
    const r = await pedir('/api/banner', { method: 'POST', cuerpo: archivo, crudo: true, tipo: archivo.type })
    estado.banner = r.banner
    estado.ajustes = r.ajustes
    renderBanner(); renderAjustes()
    avisar('Banner actualizado ✅', 'ok')
  } catch (err) { avisar(err.message, 'error', 7000) }
  e.target.value = ''
})
$('#btn-banner-quitar').onclick = () => {
  if (!confirm('¿Quitar el banner? El menú se enviará solo con texto.')) return
  accion(async () => {
    const r = await pedir('/api/banner', { method: 'DELETE' })
    estado.banner = r.banner; estado.ajustes = r.ajustes
    renderBanner(); renderAjustes()
    avisar('Banner quitado', 'warn')
  })
}

$('#btn-repo-instalar').onclick = () => accion(async () => {
  const url = $('#repo-url').value.trim()
  const branch = $('#repo-rama').value.trim()
  if (!url) throw new Error('Pega el enlace del repositorio de GitHub.')
  const boton = $('#btn-repo-instalar')
  boton.disabled = true
  avisar('Clonando el repositorio… esto puede tardar unos segundos', 'info', 8000)
  try {
    const r = await pedir('/api/repos', { method: 'POST', cuerpo: { url, branch } })
    estado.repos = r.repos
    renderRepos()
    $('#repo-url').value = ''
    $('#repo-rama').value = ''
    avisar(`Bot instalado: ${r.repo.comandos} comando(s) nuevos ✅`, 'ok')
    await cargarComandos()
  } finally { boton.disabled = false }
})

$('#btn-sub-crear').onclick = () => accion(async () => {
  const phone = $('#sub-numero').value.replace(/\D/g, '')
  const method = $('#sub-metodo').value
  if (phone.length < 8 || phone.length > 15) throw new Error('Escribe el número del sub-bot con código de país.')
  const r = await pedir('/api/subbots', { method: 'POST', cuerpo: { phone, method } })
  estado.subbots = r.subbots
  avisar(method === 'qr' ? 'Sub-bot creado: escanea su QR' : 'Sub-bot creado: pide el código', 'ok')
})

$('#btn-difundir').onclick = () => {
  const texto = $('#dif-texto').value.trim()
  if (!texto) return avisar('Escribe el mensaje', 'warn')
  if (!confirm(`¿Enviar el mensaje a ${$('#dif-destino').selectedOptions[0].textContent}?`)) return
  accion(async () => {
    const r = await pedir('/api/broadcast', { method: 'POST', cuerpo: { text: texto, target: $('#dif-destino').value } })
    avisar(`Difusión iniciada: ${r.total} destino(s). Sigue el progreso en la consola.`, 'ok')
    $('#dif-texto').value = ''
    cambiarTab('sistema')
  })
}

$('#btn-guardar-db').onclick = () => accion(async () => { await pedir('/api/database/save', { method: 'POST' }); avisar('Base de datos guardada', 'ok') })
$('#btn-compactar').onclick = () => accion(async () => {
  const r = await pedir('/api/database/compact', { method: 'POST' })
  avisar(`Compactado: ${r.borrados} usuario(s) inactivo(s) fuera`, 'ok')
})
$('#btn-cerrar-sesion').onclick = () => {
  if (!confirm('¿Cerrar la sesión de WhatsApp del bot?')) return
  accion(async () => { await pedir('/api/logout', { method: 'POST' }); avisar('Sesión cerrada', 'warn') })
}
$('#btn-log-limpiar').onclick = () => accion(async () => { await pedir('/api/logs', { method: 'DELETE' }); $('#consola').innerHTML = '' })
$('#log-auto').addEventListener('change', (e) => { estado.autoScroll = e.target.checked })
$('#btn-borrar-sesion').onclick = () => {
  if (!confirm('¿Borrar la sesión guardada?\n\nTendrás que vincular el bot otra vez por QR o con código.')) return
  accion(async () => {
    await pedir('/api/session', { method: 'DELETE' })
    avisar('Sesión borrada. Ya puedes vincular de nuevo.', 'ok')
  })
}

/* ---------------- arranque ---------------- */

;(async function inicio() {
  const deUrl = leerClaveDeLaUrl()
  estado.clave = deUrl || localStorage.getItem('izuku_clave') || ''

  if (location.hash && !location.hash.includes('=')) cambiarTab(location.hash.slice(1))

  if (!estado.clave) return mostrarLogin('')

  try {
    await cargar()
    mostrarApp()
    if (deUrl) avisar('Clave guardada en este navegador 🔐', 'ok')
  } catch (e) {
    if (e.message !== 'No autorizado') mostrarLogin(e.message)
  }
})()
