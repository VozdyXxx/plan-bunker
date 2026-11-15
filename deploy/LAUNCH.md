# Бункер: запуск с нуля до рабочего бота

Пошагово, для первого раза. Код уже лежит в приватном репозитории
`VozdyXxx/plan-bunker`. Делаем бесплатный сервер в Google Cloud, ставим на него
игру и привязываем к боту.

**Сколько нужно:** ~30–40 минут, Google-аккаунт и банковская карта (нужна только
для проверки личности, без списаний), телефон под рукой.

---

## Шаг 0. Код уже на GitHub

Репозиторий: https://github.com/VozdyXxx/plan-bunker (приватный).
На сервере мы его склонируем. Чтобы клонирование было простым, нужен способ
доступа — выбери один (разберём в Шаге 5):
- **проще всего:** сделать репозиторий публичным (в коде нет секретов — токен
  бота в git не попадает);
- **или приватно:** через токен доступа (дам команду).

---

## Шаг 1. Регистрация в Google Cloud (бесплатно)

1. Открой https://cloud.google.com и нажми **Get started for free / Начать бесплатно**.
2. Войди в свой Google-аккаунт (или заведи новый).
3. Выбери страну, согласись с условиями.
4. Привяжи карту — Google проверит личность. **Это не платно:** пока ты сам не
   нажмёшь «Активировать полный аккаунт», деньги не спишутся. Плюс дают пробные
   $300 на 90 дней.
5. Дождись, пока создастся первый проект (он появится автоматически, можно
   оставить имя по умолчанию).

> Нам нужна «Always Free» виртуалка **e2-micro** — она бесплатна навсегда в трёх
> регионах США, даже после окончания $300.

---

## Шаг 2. Создать бесплатную виртуалку (VM)

1. В консоли https://console.cloud.google.com открой меню (☰) →
   **Compute Engine → VM instances**. При первом входе нажми **Enable** у
   Compute Engine API и подожди пару минут.
2. **Create instance** и задай:
   - **Name:** `bunker`
   - **Region:** `us-central1` (или `us-west1` / `us-east1` — только там free-tier)
   - **Series:** E2, **Machine type:** `e2-micro`
   - **Boot disk:** нажми Change → ОС **Ubuntu**, версия **Ubuntu 22.04 LTS**,
     тип диска **Standard persistent disk**, размер **30 GB**
   - **Firewall:** поставь галочки **Allow HTTP traffic** и **Allow HTTPS traffic**
3. **Create**. Через минуту увидишь строку с внешним IP (**External IP**) —
   запиши его, например `34.70.15.9`.

---

## Шаг 3. Зайти на сервер (SSH)

В списке VM напротив `bunker` нажми кнопку **SSH** — откроется чёрное окно
терминала прямо в браузере. Все команды ниже вставляй туда (правая кнопка →
Paste, или Ctrl+Shift+V).

---

## Шаг 4. Поставить программы

Скопируй и вставь целиком одним куском:

```bash
sudo apt update && sudo apt install -y git curl
# Node.js 20:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
# Caddy (авто-HTTPS):
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Добавим подкачку (чтобы 1 ГБ памяти хватило на сборку):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Шаг 5. Скачать код

**Вариант А (проще) — сделать репозиторий публичным.** На телефоне/компьютере
открой https://github.com/VozdyXxx/plan-bunker → Settings → внизу
«Change visibility» → Make public. Затем на сервере:

```bash
git clone https://github.com/VozdyXxx/plan-bunker.git bunker && cd bunker
```

**Вариант Б (оставить приватным) — через токен.** Открой
https://github.com/settings/tokens → Generate new token (classic) → поставь
галочку `repo` → Generate → скопируй токен `ghp_...`. На сервере (подставь токен):

```bash
git clone https://ghp_ТВОЙ_ТОКЕН@github.com/VozdyXxx/plan-bunker.git bunker && cd bunker
```

---

## Шаг 6. Собрать и запустить

Сначала получи у @BotFather токен бота (Шаг 8, пункт 1) — он понадобится здесь.
**Старый токен из переписки обязательно перевыпусти.**

```bash
# фронтенд (имя бота подставь без @, например bunker_game_bot):
npm install
echo "VITE_BOT_USERNAME=ИМЯ_БОТА_БЕЗ_СОБАКИ" > .env
npm run build

# бэкенд:
cd server
npm install
cp .env.example .env
nano .env   # впиши TELEGRAM_BOT_TOKEN=... и оставь PORT=8080; сохранить: Ctrl+O, Enter, выйти: Ctrl+X
pm2 start "npm start" --name bunker
pm2 save
pm2 startup   # выполни команду, которую он напечатает (начинается с sudo)
cd ..
```

Проверка: `curl -s localhost:8080 | head` должен вывести начало HTML-страницы.

---

## Шаг 7. Включить HTTPS (Caddy)

Домен делаем бесплатно из IP через `sslip.io`: IP `34.70.15.9` → адрес
`34-70-15-9.sslip.io` (точки заменить на дефисы).

Отредактируй `Caddyfile` (замени `1-2-3-4` на свой IP через дефисы):

```bash
nano Caddyfile
# строка станет, например:  34-70-15-9.sslip.io {
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

Через 10–30 секунд открой в браузере `https://34-70-15-9.sslip.io` — должна
открыться игра. Этот адрес и есть URL твоего мини-аппа.

---

## Шаг 8. Привязать к боту (@BotFather)

1. В Telegram открой @BotFather → `/newbot` → задай имя и юзернейм (…_bot).
   Получишь **токен** — его и впиши в `server/.env` (Шаг 6). **Старый токен из
   переписки: `/mybots` → выбрать бота → API Token → Revoke current token.**
2. `/newapp` → выбери бота → заполни название/описание/картинку → **Web App URL** =
   `https://34-70-15-9.sslip.io` (твой адрес из Шага 7).
3. `/mybots` → бот → **Bot Settings → Menu Button** → задай URL тот же адрес —
   тогда у бота появится кнопка, открывающая игру.
4. Юзернейм бота (без @) ты уже вписал в `.env` на Шаге 6. Если ставил бота
   позже — поправь и пересобери фронт: `npm run build` в корне `bunker`.

---

## Шаг 9. Играть

Открой своего бота в Telegram, нажми кнопку меню → откроется «Бункер».
«Создать комнату» → «Пригласить друга» (ссылка улетает в чат) → друг открывает
её и попадает в ту же комнату. Для игры в одиночку — «Добавить бота».

---

## Если что-то обновил в коде

```bash
cd ~/bunker && git pull
npm install && npm run build
cd server && npm install && pm2 restart bunker
```

## Чтобы остаться в бесплатном лимите

- Только **одна** e2-micro, регион us-central1/us-west1/us-east1, диск ≤ 30 ГБ.
- Не включай платные опции. $300-кредит не трогаем — e2-micro и так бесплатна.

## Если не работает

- Логи сервера: `pm2 logs bunker`
- Логи Caddy / HTTPS: `sudo journalctl -u caddy -n 50`
- Страница не грузится: проверь, что в firewall разрешены HTTP/HTTPS (Шаг 2),
  и что `curl localhost:8080` отвечает.
- «Комната не найдена» у друга: убедись, что фронт собран на проде (Шаг 6) — он
  тогда ходит на сервер, а не в локальную память.
