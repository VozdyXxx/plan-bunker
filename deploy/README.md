# Деплой «Бункера» на Google Compute Engine (free-tier)

Всё бесплатно: одна e2-micro VM + автоматический HTTPS через Caddy и `sslip.io`
(домен покупать не нужно).

## 1. Создать VM (free-tier)

В Google Cloud Console → Compute Engine → Create instance:

- Регион: **us-west1 / us-central1 / us-east1** (только там e2-micro бесплатна).
- Тип машины: **e2-micro**.
- Диск: Standard persistent disk, 30 ГБ (в пределах free-tier).
- Разрешить HTTP и HTTPS (галочки firewall), либо открыть порты 80 и 443.
- ОС: Ubuntu 22.04 LTS.

Запишите **внешний IP** (External IP).

## 2. Поставить софт на VM

Подключитесь по SSH (кнопка SSH в консоли) и выполните:

```bash
sudo apt update && sudo apt install -y nodejs npm git
sudo npm i -g pm2
# Caddy:
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

## 3. Залить проект и собрать

```bash
git clone <ваш-репозиторий> bunker && cd bunker
# фронтенд:
npm install
echo "VITE_BOT_USERNAME=ИМЯ_ВАШЕГО_БОТА" > .env        # без @
npm run build          # создаст dist/
# бэкенд:
cd server && npm install && cp .env.example .env
# впишите в server/.env токен бота (TELEGRAM_BOT_TOKEN) и PORT=8080
cd ..
```

Запустить бэкенд под pm2 (он же отдаёт `dist/`):

```bash
cd server && pm2 start "npm start" --name bunker && pm2 save && pm2 startup
```

## 4. HTTPS через Caddy

Отредактируйте `Caddyfile` в корне проекта: замените `1-2-3-4` на внешний IP
через дефисы (например IP `34.70.15.9` → домен `34-70-15-9.sslip.io`). Затем:

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

Caddy сам получит сертификат Let's Encrypt. Проверка: откройте
`https://<ip-через-дефисы>.sslip.io` — должна открыться игра.

## 5. Настроить бота в @BotFather

1. `/newbot` (если ещё нет) → получите токен. **Перевыпустите токен**, который
   присылали в переписке: `/revoke`. Новый впишите в `server/.env`.
2. `/newapp` или `/myapps` → привяжите Mini App к боту, Web App URL =
   `https://<ip-через-дефисы>.sslip.io`.
3. `/setmenubutton` → кнопка меню открывает тот же URL.
4. Юзернейм бота (без @) впишите в корневой `.env` как `VITE_BOT_USERNAME`,
   пересоберите фронт (`npm run build`) — тогда кнопка «Пригласить друга» даёт
   рабочую ссылку `t.me/<bot>/app?startapp=КОД`.

## Как играют

Хост открывает мини-апп в боте → «Создать комнату» → «Пригласить друга» →
друг открывает ссылку, попадает в ту же комнату. Для игры в одиночку есть
кнопка «Добавить бота».

## Безопасность

- `server/.env` с токеном в git не попадает (см. `.gitignore`).
- Клиент секретов не хранит, общается только со своим бэкендом по websocket.
