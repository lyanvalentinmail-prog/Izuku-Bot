#!/data/data/com.termux/files/usr/bin/bash
# Inicia Izuku Bot y lo reinicia automaticamente si se cae
cd "$(dirname "$0")"
while true; do
  node index.js "$@"
  echo "⚠️  El bot se detuvo. Reiniciando en 5 segundos... (Ctrl+C para salir)"
  sleep 5
done
