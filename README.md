# Avtoturargoh nazorati

Qorovul mashinani tanlangan joyga kiritadi. Server bo'sh raqamni va joy bandligini tekshiradi; xatolar panelda aniq ko'rsatiladi.

## Ishga tushirish

Talab: Node.js 22.13 yoki undan yangi versiya.

```powershell
npm install
npm start
```

Panel: `http://localhost:3000`

SQLite ma'lumotlar bazasi birinchi ishga tushganda `parking.sqlite` faylida yaratiladi va 10 ta bo'sh joy bilan boshlanadi. Boshqa manzil berish uchun `DATABASE_PATH` muhit o'zgaruvchisini sozlang.

## API

- `GET /api/spaces` — joylar va band/bo'sh holati.
- `POST /api/entries` — `{ "spaceId": 1, "vehicleNumber": "01 A 123 BC" }`.
  - Mashina raqami bo'sh bo'lsa `400` va `Raqamni kiriting`.
  - Joy band bo'lsa `400` va `Joy band`.
  - To'g'ri kirishda `201` qaytaradi.

Bandlikni tekshirish va yozish SQLite tranzaksiyasida bajariladi.

## Test

```powershell
npm test
```
