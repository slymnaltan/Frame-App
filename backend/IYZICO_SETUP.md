# İyzico Ödeme Entegrasyonu

Bu proje İyzico ödeme sistemi ile entegre edilmiştir. Etkinlik oluştururken farklı kiralama ve saklama süreleri için ödeme alınabilir.

## Kurulum

### 1. İyzico Hesabı Oluşturma

1. [İyzico](https://www.iyzico.com/) web sitesine gidin
2. Ücretsiz hesap oluşturun
3. Sandbox (test) API anahtarlarınızı alın

### 2. API Anahtarlarını Yapılandırma

`.env` dosyasına aşağıdaki bilgileri ekleyin:

```env
# İyzico Ayarları
IYZICO_API_KEY=your-sandbox-api-key
IYZICO_SECRET_KEY=your-sandbox-secret-key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
FRONTEND_URL=exp://192.168.43.117:8081
```

**Önemli:** Production'a geçerken:
- `IYZICO_BASE_URL` değerini `https://api.iyzipay.com` olarak değiştirin
- Gerçek API anahtarlarınızı kullanın

## Fiyatlandırma Yapısı

### Kiralama Süreleri (QR Kod Aktif Kalma Süresi)

| Plan | Süre | Fiyat |
|------|------|-------|
| Ücretsiz | 1 Gün | ₺0 |
| Haftalık | 7 Gün | ₺49.99 |
| İki Haftalık | 14 Gün | ₺89.99 |
| Aylık | 30 Gün | ₺149.99 |
| 3 Aylık | 90 Gün | ₺399.99 |
| 6 Aylık | 180 Gün | ₺699.99 |
| Yıllık | 365 Gün | ₺1199.99 |

### Saklama Süreleri (Dosyaların Saklanma Süresi)

| Plan | Süre | Fiyat |
|------|------|-------|
| Ücretsiz | 5 Gün | ₺0 |
| Haftalık | 7 Gün | ₺29.99 |
| İki Haftalık | 14 Gün | ₺49.99 |
| Aylık | 30 Gün | ₺79.99 |
| 3 Aylık | 90 Gün | ₺199.99 |
| 6 Aylık | 180 Gün | ₺349.99 |
| Yıllık | 365 Gün | ₺599.99 |

**Not:** Fiyatları `backend/config/pricing.js` dosyasından değiştirebilirsiniz.

## API Endpoint'leri

### 1. Fiyatlandırma Planlarını Getir

```http
GET /api/payment/pricing
```

**Yanıt:**
```json
{
  "rental": {
    "free": { "days": 1, "price": 0, "label": "1 Gün (Ücretsiz)" },
    "week": { "days": 7, "price": 49.99, "label": "1 Hafta" }
    // ...
  },
  "storage": {
    "free": { "days": 5, "price": 0, "label": "5 Gün (Ücretsiz)" }
    // ...
  }
}
```

### 2. Ödeme Başlat

```http
POST /api/payment/initialize
Authorization: Bearer {token}
```

**İstek Body:**
```json
{
  "rentalPlan": "week",
  "storagePlan": "month",
  "eventData": {
    "name": "Düğün",
    "description": "Düğün etkinliği",
    "eventDate": "2024-12-31",
    "venue": "İstanbul"
  }
}
```

**Yanıt:**
```json
{
  "success": true,
  "paymentPageUrl": "https://sandbox-payment.iyzipay.com/...",
  "token": "payment-token",
  "conversationId": "unique-id",
  "pricing": {
    "rentalPrice": 49.99,
    "storagePrice": 79.99,
    "totalPrice": 129.98,
    "rentalDays": 7,
    "storageDays": 30
  }
}
```

### 3. Ödeme Durumunu Kontrol Et

```http
GET /api/payment/status/:conversationId
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "status": "success",
  "amount": 129.98,
  "rentalPlan": "week",
  "storagePlan": "month",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Etkinlik Oluştur (Ödeme Sonrası)

```http
POST /api/payment/complete-event
Authorization: Bearer {token}
```

**İstek Body:**
```json
{
  "conversationId": "unique-id",
  "eventData": {
    "name": "Düğün",
    "description": "Düğün etkinliği",
    "eventDate": "2024-12-31",
    "venue": "İstanbul"
  }
}
```

## Ödeme Akışı

### Ücretsiz Plan (1 Gün Kiralama + 5 Gün Saklama)

1. Kullanıcı etkinlik bilgilerini girer
2. Ücretsiz planları seçer
3. "Oluştur" butonuna basar
4. Etkinlik anında oluşturulur (ödeme yok)

### Ücretli Plan

1. Kullanıcı etkinlik bilgilerini girer
2. Ücretli planlardan birini seçer
3. Fatura özeti gösterilir
4. "Ödemeye Geç" butonuna basar
5. İyzico ödeme sayfası açılır (tarayıcı/webview)
6. Kullanıcı ödemeyi tamamlar
7. Callback URL'e yönlendirilir
8. Ödeme başarılıysa etkinlik oluşturulur

## Callback URL

İyzico ödeme tamamlandığında şu URL'e POST isteği gönderir:

```
POST {API_PUBLIC_URL}/api/payment/callback
```

Bu endpoint:
- Ödeme sonucunu doğrular
- Payment kaydını günceller
- Kullanıcıyı başarı/hata sayfasına yönlendirir

## Test Kartları (Sandbox)

İyzico sandbox ortamında test için kullanabileceğiniz kartlar:

### Başarılı Ödeme
- Kart No: `5528790000000008`
- Son Kullanma: `12/30`
- CVC: `123`
- 3D Secure Şifre: `123456`

### Başarısız Ödeme
- Kart No: `5406670000000009`
- Son Kullanma: `12/30`
- CVC: `123`

Daha fazla test kartı için: [İyzico Test Kartları](https://dev.iyzipay.com/tr/test-kartlari)

## Güvenlik

- API anahtarları asla frontend'e gönderilmez
- Tüm ödeme işlemleri backend üzerinden yapılır
- Callback URL doğrulaması yapılır
- HTTPS kullanımı zorunludur (production)

## Sorun Giderme

### Ödeme sayfası açılmıyor
- `IYZICO_BASE_URL` doğru mu kontrol edin
- API anahtarları geçerli mi kontrol edin
- İnternet bağlantısını kontrol edin

### Callback çalışmıyor
- `API_PUBLIC_URL` doğru ve erişilebilir olmalı
- Ngrok veya benzer tunnel servisi kullanabilirsiniz (development)
- Production'da gerçek domain kullanın

### Ödeme başarılı ama etkinlik oluşmuyor
- Payment kaydının status'ü "success" mi kontrol edin
- Backend loglarını kontrol edin
- Database bağlantısını kontrol edin

## Production Checklist

- [ ] Gerçek İyzico API anahtarlarını kullan
- [ ] `IYZICO_BASE_URL` değerini production URL'e değiştir
- [ ] HTTPS kullan
- [ ] Gerçek kullanıcı bilgilerini topla (GSM, kimlik no, adres)
- [ ] Fiyatları gözden geçir
- [ ] Callback URL'in erişilebilir olduğundan emin ol
- [ ] Error handling ve logging ekle
- [ ] Ödeme loglarını kaydet
- [ ] Email bildirimleri ekle (opsiyonel)
