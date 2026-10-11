# Imagen ligera con todo lo que el bot necesita (ffmpeg, libwebp)
FROM node:20-alpine

RUN apk add --no-cache ffmpeg libwebp-tools tzdata git python3 make g++

# Una dependencia de Baileys (libsignal) viene de GitHub por git+ssh.
# En un build no hay claves SSH, asi que la pedimos por HTTPS.
RUN git config --global url."https://github.com/".insteadOf "git+ssh://git@github.com/" \
 && git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"

ENV TZ=America/Montevideo
WORKDIR /app

# Capa de dependencias (se cachea y hace los despliegues mucho mas rapidos)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Panel web (Render y docker lo exponen en el puerto 3000 por defecto)
EXPOSE 3000
ENV PORT=3000

# Datos persistentes: monta estos volumenes para no perder la sesion.
# docker-compose.yml y Render (render.yaml) ya los configuran.
# Si defines DATA_DIR, el entrypoint guarda sessions/, subbots/, database/ y media/ ahi.
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=512

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["node", "index.js"]
