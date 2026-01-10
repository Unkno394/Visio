# Visio

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000000)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?logo=webrtc&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?logo=websocket&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)

## Описание
Visio — веб-приложение для видеовстреч с комнатами по ID, чатом и реакциями.

## Что сделано
- Главный экран с созданием/подключением к комнате и генерацией ID.
- Комната видеовстречи на WebRTC с сеткой участников и индикаторами состояния.
- Управление медиа: микрофон, камера, демонстрация экрана.
- Чат с историей, эмодзи-пикером и быстрыми реакциями.
- Роли admin/member и команды администратора (mute, video off, ban, chat on/off).
- Профиль с выбором цвета анимированной волны, сохранение настроек.
- Сигнальный WebSocket: встроенный `/api/ws` и отдельный `server/ws-server.js`.

## Что работает
- Создание комнаты и вход по ID.
- Подключение нескольких участников по WebRTC.
- Переключение микрофона/камеры и шаринг экрана.
- Чат и эмодзи-реакции.
- Админские действия: выключение звука/видео, блок чата, бан.
- Смена цвета волны в профиле с сохранением между сессиями.

## Стек
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- WebRTC (STUN + опциональный TURN через env)
- WebSocket (ws)
- OGL (WebGL) для анимированного фона

## Запуск
```bash
npm install
npm run dev
```

Открыть `http://localhost:3000`.

## Сигнальный сервер
По умолчанию используется встроенный `/api/ws` в Next.js.

Отдельный сервер:
```bash
npm run ws-server
```

## Переменные окружения (опционально)
- `NEXT_PUBLIC_WS_URL` — полный URL для WebSocket.
- `NEXT_PUBLIC_WS_PORT` — порт для `ws-server`, если формировать URL автоматически.
- `WS_PORT` — порт для `ws-server` (по умолчанию `3001`).
- `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USER`, `NEXT_PUBLIC_TURN_PASS` — TURN для WebRTC.
