#!/usr/bin/env bash
# ===============================================
#  IZUKU BOT - Instalador automatico para Termux
#  Uso:
#    bash <(curl -fsSL https://raw.githubusercontent.com/lyanvalentinmail-prog/Izuku-Bot/main/install.sh)
# ===============================================
set -e

REPO="https://github.com/lyanvalentinmail-prog/Izuku-Bot.git"
RAMA="${IZUKU_BRANCH:-arena/01a0ffed-izuku-bot}"
DIR="$HOME/Izuku-Bot"

V='\033[0;32m'; A='\033[1;33m'; C='\033[0;36m'; R='\033[0;31m'; N='\033[0m'
paso() { echo -e "\n${C}▸ $1${N}"; }
ok()   { echo -e "${V}  ✔ $1${N}"; }
aviso(){ echo -e "${A}  ! $1${N}"; }

clear
echo -e "${V}"
cat <<'BANNER'
 ██╗███████╗██╗   ██╗██╗  ██╗██╗   ██╗
 ██║╚══███╔╝██║   ██║██║ ██╔╝██║   ██║
 ██║  ███╔╝ ██║   ██║█████╔╝ ██║   ██║
 ██║ ███╔╝  ██║   ██║██╔═██╗ ██║   ██║
 ██║███████╗╚██████╔╝██║  ██╗╚██████╔╝
 ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
      I N S T A L A D O R   A U T O
BANNER
echo -e "${N}"

# ---------- 1. Paquetes ----------
paso "Actualizando Termux e instalando dependencias..."
if command -v pkg >/dev/null 2>&1; then
  yes | pkg update -y >/dev/null 2>&1 || true
  yes | pkg upgrade -y >/dev/null 2>&1 || true
  pkg install -y nodejs-lts git ffmpeg libwebp python nano >/dev/null 2>&1
  ok "Paquetes de Termux instalados"
  termux-setup-storage >/dev/null 2>&1 || true
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y nodejs npm git ffmpeg webp python3 >/dev/null 2>&1
  ok "Paquetes de Linux instalados"
else
  aviso "No reconozco tu gestor de paquetes. Instala a mano: nodejs git ffmpeg libwebp"
fi

node -v >/dev/null 2>&1 || { echo -e "${R}✘ Node.js no quedó instalado. Ejecuta: pkg install nodejs-lts${N}"; exit 1; }
ok "Node.js $(node -v)"

# ---------- 2. Descargar / actualizar ----------
if [ -d "$DIR/.git" ]; then
  paso "Ya tienes el bot, actualizando..."
  cd "$DIR"
  git stash -u >/dev/null 2>&1 || true
  git fetch origin >/dev/null 2>&1
  git checkout "$RAMA" >/dev/null 2>&1 || git checkout main >/dev/null 2>&1
  git pull >/dev/null 2>&1 || true
  git stash pop >/dev/null 2>&1 || true
  ok "Código actualizado (tu sesión y datos siguen intactos)"
else
  paso "Descargando Izuku Bot..."
  git clone -b "$RAMA" "$REPO" "$DIR" >/dev/null 2>&1 || git clone "$REPO" "$DIR" >/dev/null 2>&1
  cd "$DIR"
  ok "Descargado en $DIR"
fi

# ---------- 3. Dependencias de Node ----------
paso "Instalando dependencias de Node (puede tardar unos minutos)..."
cd "$DIR"
npm install --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund --strict-ssl=false >/dev/null 2>&1
ok "Dependencias listas"

# ---------- 4. Configuracion ----------
paso "Configuración inicial"
ACTUAL=$(grep -oP "owner: \['\K[^']*" config.js 2>/dev/null | head -1)
if [ "$ACTUAL" = "5212345678901" ] || [ -z "$ACTUAL" ]; then
  echo -ne "${A}  Tu número con código de país (ej 59899123456), o Enter para saltar: ${N}"
  read -r NUM </dev/tty || NUM=""
  NUM=$(echo "$NUM" | tr -cd '0-9')
  if [ -n "$NUM" ]; then
    sed -i "s/owner: \['[0-9]*'\]/owner: ['$NUM']/" config.js
    ok "Dueño configurado: +$NUM"
  else
    aviso "Recuerda poner tu número después con: nano config.js"
  fi
else
  ok "Dueño ya configurado: +$ACTUAL"
fi

chmod +x start.sh 2>/dev/null || true
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock || true

# ---------- 5. Arrancar ----------
echo -e "\n${V}╔══════════════════════════════════════╗${N}"
echo -e "${V}║   ✅ INSTALACIÓN COMPLETADA          ║${N}"
echo -e "${V}╚══════════════════════════════════════╝${N}"
echo -e "
  Carpeta:  ${C}$DIR${N}
  Arrancar: ${C}cd ~/Izuku-Bot && npm start${N}
  Con QR:   ${C}npm run qr${N}
  Con código 8 dígitos: ${C}npm run code${N}
"
echo -ne "${A}¿Arrancar el bot ahora? [S/n]: ${N}"
read -r RESP </dev/tty || RESP="s"
case "$RESP" in
  [nN]*) echo -e "${C}Perfecto. Arráncalo cuando quieras con: cd ~/Izuku-Bot && npm start${N}" ;;
  *) exec npm start ;;
esac
