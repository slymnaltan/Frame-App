# Güvenlik Önlemleri

Bu proje brute force saldırılarına karşı çok katmanlı güvenlik önlemleri içermektedir.

## Uygulanan Güvenlik Katmanları

### 1. Rate Limiting (İstek Sınırlama)

#### Genel API Limiti
- **Süre**: 15 dakika
- **Limit**: IP başına 100 istek
- **Kapsam**: Tüm API endpoint'leri

#### Login Limiti
- **Süre**: 15 dakika
- **Limit**: IP başına 5 başarısız deneme
- **Özellik**: Başarılı istekler sayılmaz
- **Mesaj**: "Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin."

#### Register Limiti
- **Süre**: 1 saat
- **Limit**: IP başına 3 kayıt
- **Mesaj**: "Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin."

### 2. Hesap Kilitleme Sistemi

- **Maksimum Deneme**: 5 başarısız giriş
- **Kilit Süresi**: 2 saat
- **Özellikler**:
  - Başarısız her denemede sayaç artar
  - 5. denemeden sonra hesap otomatik kilitlenir
  - Başarılı girişte sayaç sıfırlanır
  - Kilit süresi dolunca otomatik açılır

### 3. Request Slowing (İstek Yavaşlatma)

- **Başlangıç**: 50 istekten sonra
- **Gecikme**: Her istek için +100ms
- **Amaç**: Rate limit'e ulaşmadan önce saldırganı yavaşlatmak

### 4. NoSQL Injection Koruması

- `express-mongo-sanitize` ile tüm kullanıcı girdileri temizlenir
- MongoDB operatörlerini ($, .) içeren girdiler engellenir

### 5. HTTP Güvenlik Başlıkları

`helmet` middleware'i ile:
- XSS koruması
- Clickjacking koruması
- MIME type sniffing koruması
- DNS prefetch kontrolü
- Referrer policy

## Kullanım

Tüm güvenlik önlemleri otomatik olarak aktiftir. Ek yapılandırma gerekmez.

### Login Endpoint'i

```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Olası Yanıtlar**:
- `200`: Başarılı giriş
- `400`: Yanlış şifre (deneme sayısı artar)
- `423`: Hesap kilitli (kilit süresi bilgisi ile)
- `429`: Çok fazla istek (rate limit aşıldı)

### Register Endpoint'i

```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Olası Yanıtlar**:
- `201`: Başarılı kayıt
- `400`: Email zaten kullanımda
- `429`: Çok fazla kayıt denemesi

## Güvenlik İpuçları

1. **JWT_SECRET**: `.env` dosyasında güçlü bir secret kullanın
2. **HTTPS**: Production'da mutlaka HTTPS kullanın
3. **Şifre Politikası**: Frontend'de güçlü şifre kontrolü ekleyin
4. **2FA**: İki faktörlü kimlik doğrulama eklenebilir
5. **IP Whitelist**: Kritik endpoint'ler için IP whitelist düşünülebilir

## Monitoring

Rate limit aşımları ve hesap kilitlemeleri loglanabilir:
- Şüpheli aktiviteleri tespit etmek için
- Saldırı paternlerini analiz etmek için
- Güvenlik raporları oluşturmak için
