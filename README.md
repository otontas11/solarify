# Solarify

On-grid gunes enerjisi simulasyonu icin Nuxt tabanli bir uygulama.

Bu surumde:

- Google Places ile il / ilce / adres secimi
- Google Map uzerinde polygon alan cizimi
- Nuxt server proxy uzerinden PVGIS uretim tahmini
- On-grid basit hesaplama dashboard'u

## Kurulum

```bash
npm install
```

## Gerekli ortam degiskeni

```bash
NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

Google tarafinda en az su servislerin acik olmasi gerekir:

- Maps JavaScript API
- Places API

## Gelistirme

```bash
npm run dev
```

## Uretim build

```bash
npm run build
```

## API endpoint'leri

- `GET /api/pvgis`
- `GET /api/solar/calculate`

## Not

PVGIS cagrisi tarayicidan dogrudan degil, Nuxt server endpoint'i uzerinden yapilir. Bu sayede frontend tarafinda Google Places + harita deneyimi korunurken uretim verisi de resmi kaynaktan alinabilir.
