// Configuracion para pm2 (recomendado en VPS/servidor)
//   npm i -g pm2
//   pm2 start ecosystem.config.cjs
//   pm2 logs izuku-bot
//   pm2 save && pm2 startup     <- arranca solo al reiniciar el servidor
module.exports = {
  apps: [{
    name: 'izuku-bot',
    script: 'index.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '600M',
    restart_delay: 5000,
    max_restarts: 50,
    time: true,
    env: {
      NODE_ENV: 'production',
      // Panel web (para vincular el bot por QR o con código desde el navegador)
      PANEL_ENABLED: 'true',
      PORT: '3000',
      // Clave del panel: si la dejas vacía el bot genera una y la muestra en los logs
      // PANEL_PASSWORD: 'pon-aqui-tu-clave',
      // Para guardar los datos en otra carpeta (disco externo, por ejemplo):
      // DATA_DIR: '/var/data',
      // Mas memoria disponible para Node (subelo si tu servidor tiene RAM de sobra)
      NODE_OPTIONS: '--max-old-space-size=512'
    },
    error_file: './logs/error.log',
    out_file: './logs/salida.log',
    merge_logs: true
  }]
}
