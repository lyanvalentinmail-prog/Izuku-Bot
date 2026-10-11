#!/bin/sh
# Si defines DATA_DIR (en Render: /data, que es un disco persistente), las carpetas
# de datos se guardan ahi. Sin DATA_DIR no hace nada: todo queda dentro del proyecto.
set -e

if [ -n "$DATA_DIR" ]; then
  mkdir -p "$DATA_DIR"
  for d in sessions subbots database media; do
    mkdir -p "$DATA_DIR/$d"
    # Si la carpeta de la imagen existe (y no es un enlace), la movemos al disco
    if [ -e "/app/$d" ] && [ ! -L "/app/$d" ]; then
      cp -rn "/app/$d/." "$DATA_DIR/$d/" 2>/dev/null || true
      rm -rf "/app/$d"
    fi
    ln -sfn "$DATA_DIR/$d" "/app/$d"
  done
fi

exec "$@"
