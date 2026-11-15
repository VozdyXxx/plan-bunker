import WebApp from '@twa-dev/sdk';

const BOT_USERNAME = (import.meta.env.VITE_BOT_USERNAME as string) || 'your_bot';

export function initTelegram(): void {
  try {
    WebApp.ready();
    WebApp.expand();
  } catch {
    /* вне Telegram — работаем как обычная веб-страница */
  }
}

export function getStartParam(): string | null {
  try {
    const p = WebApp.initDataUnsafe?.start_param;
    if (p) return p;
  } catch {
    /* ignore */
  }
  return new URLSearchParams(location.search).get('startapp');
}

export function getUserName(): string {
  try {
    const u = WebApp.initDataUnsafe?.user;
    if (u?.first_name) return u.first_name;
  } catch {
    /* ignore */
  }
  return 'Игрок';
}

export function getUserId(): string {
  try {
    const u = WebApp.initDataUnsafe?.user;
    if (u?.id) return `tg${u.id}`;
  } catch {
    /* ignore */
  }
  let id = '';
  try {
    id = localStorage.getItem('bunker_uid') ?? '';
    if (!id) {
      id = 'u' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('bunker_uid', id);
    }
  } catch {
    id = 'u' + Math.random().toString(36).slice(2, 9);
  }
  return id;
}

export function roomLink(code: string): string {
  return `https://t.me/${BOT_USERNAME}?startapp=${code}`;
}

export function shareRoom(code: string): string {
  const link = roomLink(code);
  const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
    'Заходи в бункер — решим, кто выживет 🙂',
  )}`;
  try {
    WebApp.openTelegramLink(share);
  } catch {
    try {
      navigator.clipboard?.writeText(link);
    } catch {
      /* ignore */
    }
  }
  return link;
}
