# Solarify

Nuxt tabanli bir gunes enerjisi simulasyon uygulamasi. Ilk fazda `On Grid` akisi icin CW Enerji simulatorunden esinlenen bir teklif ve fizibilite deneyimi kuruldu.

## Bu surumde neler var

- Sistem secim ekrani ve fazlanabilir kart yapisi
- `Basit` ve `Gelismis` hesaplama modlari
- Lokasyon bazli verim katsayilari
- Cati tipi, panel gucu, yon, egim ve golgelenme gibi parametreler
- Finansal cikti: yillik tasarruf, sistem maliyeti, amortisman, 25 yil net kazanc

## Gelistirme

```bash
npm install
npm run dev
```

## Uretim build

```bash
npm run build
```

## Sonraki dogruluk adimlari

- Il/ilce bazli gercek radyasyon verisi entegrasyonu
- Urun kataloglariyla panel ve inverter secimi
- Mahsuplasma ve tarife tipleri icin guncel regullasyon kurallari
- Farkli sistem tipleri: off-grid, sulama, isi pompasi, EV sarj
