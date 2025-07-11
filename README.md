# Restoran Otomasyon Sistemi

Modern, kamera destekli, tam otomatik restoran yönetim sistemi.

## Özellikler
- **Masa, garson, yemek, sipariş ve rapor yönetimi**
- **Garson performansı ve ilgi düzeyi ölçümü** (otomatik ve manuel)
- **Gecikme cezası, masa/garson zaman damgaları, hesap sıfırlama**
- **Detaylı raporlama:** masa, garson, yemek, tarih bazlı filtreleme
- **Masa bazlı detay ekranı:** siparişler, toplam hesap, en çok tüketilen ürünler, garson performansı
- **Kamera/otomasyon entegrasyonu için API altyapısı**
- **Modern frontend:** Material UI, koyu/açık mod, animasyon, erişilebilirlik, PWA desteği

## Kullanılan Teknolojiler
- **Backend:** Python, Flask, PyTorch (model entegrasyonu), MongoDB, OpenCV (kamera için altyapı)
- **Frontend:** React, Material UI, framer-motion, axios, react-helmet-async
- **Veritabanı:** MongoDB

## Kurulum
### 1. Backend
- Python 3.12+ ve MongoDB kurulu olmalı
- `cd backend`
- `pip install -r requirements.txt`
- MongoDB'yi başlatın (örnek bağlantı: `mongodb://localhost:27017`)
- `python -m app` ile backend'i başlatın
- **Not:** Büyük model dosyaları (`food101_yolov8_cls.pt`, `food101_mobilenetv2_small.h5`, `yolov8n.pt`) repoda tutulmaz, gerekirse harici olarak indirin veya yöneticinizden isteyin.

### 2. Frontend
- `cd frontend`
- `npm install`
- `npm start` ile başlatın

### 3. Test ve Kod Kalitesi
- Backend için: `pylint backend/` (veya benzeri linter)
- Frontend için: `npm run lint`

## .gitignore ve Büyük Dosyalar
- Projede **.gitignore** ile aşağıdaki dosya ve klasörler sürüm kontrolüne dahil edilmez:
  - `__pycache__/`, `*.pyc`, `venv/`, `node_modules/`, `*.pt`, `*.h5`, `*.log`, `*.tmp`
- Büyük model dosyalarını repoya eklemeyin, harici paylaşın.

## Kamera/Otomasyon API Kullanımı
- **Yemek tanıma:**
  - `POST /api/camera/food_detected` → `{ table_id, food_id, quantity }`
- **Garson tanıma:**
  - `POST /api/camera/waiter_detected` → `{ table_id, waiter_id }`

### Temel API Endpointleri
- `/api/tables` : Masa işlemleri
- `/api/waiters` : Garson işlemleri
- `/api/foods` : Yemek işlemleri
- `/api/reports` : Raporlama
- `/api/video` : Kamera/otomasyon işlemleri

## Gelişmiş Özellikler
- Garson gecikme cezası ve ilgi düzeyi otomasyonu
- Masa bazlı detaylı rapor ve analiz
- Modern, responsive ve erişilebilir arayüz
- PWA ve offline desteği

## Yol Haritası
- Kamera entegrasyonu için frontend test paneli
- Gelişmiş raporlama ve analiz
- Admin paneli ve kullanıcı rolleri
- Canlı güncelleme ve güvenlik iyileştirmeleri

## Katkı ve Lisans
- Katkı ve önerilere açıktır.
- [MIT License](LICENSE) 