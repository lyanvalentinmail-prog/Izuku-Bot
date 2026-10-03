# Imagen ligera con todo lo que el bot necesita (ffmpeg, libwebp)
FROM node:20-alpine

RUN apk add --no-cache ffmpeg libwebp-tools tzdata git python3 make g++

ENV TZ=America/Montevideo
WORKDIR /app

# Capa de dependencias (se cachea y hace los despliegues mucho mas rapidos)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Datos persistentes: monta estos volumenes para no perder la sesion
VOLUME ["/app/sessions", "/app/subbots", "/app/database", "/app/media"]

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=512

CMD ["node", "index.js"]
