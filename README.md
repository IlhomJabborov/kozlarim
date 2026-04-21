# kozlarim

Ko'zi ojiz foydalanuvchi uchun kamera orqali atrofni tasvirlab beruvchi ilova.
Loyiha 2 qismdan iborat:
- FastAPI backend (`/generate` endpoint)
- Expo React Native mobile app (`mobile/`)

## 1) Talablar

Kompyuterda:
- Python 3.12 (tavsiya)
- Node.js LTS (18+ yoki 20+)
- npm
- Git

Telefonda:
- Expo Go ilovasi

## 2) Loyihani yuklab olish

```powershell
git clone https://github.com/nosirbekdev/kozlarim.git
cd kozlarim
```

## 3) Backendni ishga tushirish

### 3.1 Virtual environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3.2 Dependencylar
```powershell
pip install -r requirements.txt
```

### 3.3 Serverni LAN uchun ochish
```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger test:
- `http://127.0.0.1:8000/docs`

## 4) Mobile (Expo) ni ishga tushirish

```powershell
cd mobile
npm install
npx expo start
```

Telefon bilan QR scan qiling (Expo Go).

## 5) Backend URL qanday aniqlanadi (app ichida)

App avtomatik quyidagicha URL tanlaydi:
1. `EXPO_PUBLIC_API_BASE_URL` berilgan bo'lsa, o'sha
2. Expo host IP asosida `http://<host-ip>:8000`
3. fallback:
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`

Shuning uchun oddiy holatda URL input kerak emas.

## 6) Boshqa odamlar qanday ulaydi (eng muhim qism)

`/generate` ishlashi uchun telefon backend turgan kompyuterni tarmoqdan ko'ra olishi kerak.

### Holat A: Bitta Wi-Fi router
- Kompyuter va telefon bir xil Wi-Fi’da bo'lsin.
- Backend `0.0.0.0:8000` da ishlasin.
- Telefonda `http://<PC_IP>:8000/docs` ochilishi kerak.

### Holat B: Telefon hotspot tarqatadi
- Kompyuter telefon hotspotiga ulanadi.
- Kompyuter IPv4 manzilini oling:
```powershell
ipconfig
```
- Masalan `10.59.17.70` bo'lsa, telefon browserda `http://10.59.17.70:8000/docs` ochib ko'ring.

### Holat C: Android emulator
- URL avtomatik fallback `10.0.2.2` ishlatadi.

### Holat D: iOS simulator
- URL avtomatik fallback `127.0.0.1` ishlatadi.

## 7) Majburiy URL override (xohlasangiz)

Agar auto-detect ishlamasa, `mobile` ichida `.env` ochib qo'ying:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.15:8000
```

So'ng Expo ni restart qiling:
```powershell
cd mobile
npx expo start -c
```

## 8) Firewall muammosi

Agar telefon `docs` ni ocholmasa, Windows firewall 8000 portni bloklayotgan bo'lishi mumkin:

```powershell
netsh advfirewall firewall add rule name="FastAPI 8000" dir=in action=allow protocol=TCP localport=8000
```

## 9) Ilova ishlash oqimi

1. Kamera ruxsati so'raladi
2. `Start` bosilganda har siklda:
- rasm olinadi
- backendga yuboriladi (`POST /generate`, `multipart/form-data`, field: `image`)
- caption qaytadi
- telefon captionni ovoz chiqarib o'qiydi
- o'qib bo'lgach 3 soniya kutadi
- keyingi rasm yuboriladi

Ya'ni uzun caption bo'lsa ham ustma-ust gapirmaydi.

## 10) Tezkor tekshiruv

Backend terminal:
```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Yangi terminal:
```powershell
curl http://127.0.0.1:8000/docs
```

Telefon browser:
- `http://<PC_IP>:8000/docs`

Shu uchalasi ishlasa, mobile app ham ishlaydi.

## 11) Keng tarqalgan xatolar

- `fastapi is not recognized`
  - `.venv` yoqilmagan, `python -m uvicorn ...` ishlating.

- `Cannot use JSX unless the '--jsx' flag is provided`
  - `mobile` papkaga kirmagansiz yoki `npm install` qilinmagan.

- `expo/tsconfig.base not found`
  - `mobile` ichida dependencylar yo'q: `npm install`.

- Telefon backendga chiqolmayapti
  - Noto'g'ri IP, boshqa tarmoq, yoki firewall blok.

## 12) Repo struktura

- `main.py` FastAPI API
- `model.py` caption modeli
- `mobile/` Expo client
- `requirements.txt` Python paketlar

---
Agar jamoa bilan ishlasangiz, har developer o'z lokal IP manziliga qarab `.env`dagi `EXPO_PUBLIC_API_BASE_URL`ni sozlashi tavsiya etiladi.
