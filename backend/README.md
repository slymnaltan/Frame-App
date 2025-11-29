## Memory Backend

Bu servis düğün/davet gibi etkinlikler için QR tabanlı içerik toplama akışını yönetir.

### Mimari Özeti

- React Native uygulaması JWT ile oturum açar ve `POST /api/events` üzerinden etkinlik kiralar.
- Sistem her etkinlik için benzersiz bir `uploadSlug`, QR görseli ve storage klasörü üretir.
- Misafirler QR kodu okutup `POST /api/upload/:eventCode` (slug veya eventId) ile foto/video yükler.
- Yüklenen dosyalar Supabase Storage, S3 (env tanımlıysa) veya sunucuda `storage/uploads` dizinine yazılır.
- Etkinlik sahibi `GET /api/events/:id/uploads` ekranından içerikleri görür; `GET /api/download/:eventId` ile ZIP indirir.

### Ortam Değişkenleri

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=super-secret
API_PUBLIC_URL=https://api.yourdomain.com
RESEND_API_KEY=xxx
RESEND_FROM="Memory <noreply@yourdomain.com>"
UPLOAD_BASE_URL=https://yourmobileapp.com/upload
MAX_FILE_SIZE_MB=50

# Supabase kullanmak için
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_BUCKET=memory-uploads

# AWS S3 kullanmak için
AWS_REGION=eu-central-1
AWS_S3_BUCKET=memory-uploads
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Yerel depolama için sadece (opsiyonel)
LOCAL_STORAGE_ROOT=/absolute/path/to/storage
```

S3 bilgileri tanımlı değilse yüklemeler otomatik olarak yerel diskte saklanır.

### Endpointler

| Method & Path | Açıklama |
| --- | --- |
| `POST /api/auth/register` | Kullanıcı kaydı, doğrulama emaili gönderir |
| `GET /api/auth/verify/:token` | Email doğrulama |
| `POST /api/auth/login` | JWT üretir (sadece doğrulanmış kullanıcılar) |
| `POST /api/auth/forgot-password` | Şifre sıfırlama kodu email ile gönderir |
| `POST /api/auth/reset-password` | Kod ile şifre yeniler |
| `POST /api/events` | Yeni etkinlik oluşturur, QR + slug döner |
| `GET /api/events` | Kullanıcının tüm etkinlikleri |
| `GET /api/events/:id` | Etkinlik ve yükleme sayısı |
| `GET /api/events/:id/uploads` | Etkinliğe ait tüm dosyalar |
| `POST /api/upload/:eventCode` | Misafir dosya yükler (slug veya eventId) |
| `GET /api/download/:eventId` | ZIP halinde tüm içerikleri indirir |

### Misafir Upload Akışı

1. QR kodu taratan misafir, mobil/web `UPLOAD_BASE_URL/:slug` adresine gider.
2. Ön uç `POST /api/upload/:slug` isteği yapar, body'de `file` (form-data) ve opsiyonel `uploaderName`, `note`.
3. Backend dosyayı Supabase/S3/lokal storage'a aktarır ve 201 döner. Artık yüklemeler MongoDB'de tutulmaz, doğrudan storage listesi kullanılır.

### ZIP İndirme

- `GET /api/download/:eventId` yalnızca etkinliğin sahibi JWT ile eriştiğinde çalışır.
- Response streaming zip olduğundan büyük içerikler için de uygundur.

### Çalıştırma

```bash
cd backend
npm install
npm run dev
```

MongoDB ve gerekli env değerleri ayarlandıktan sonra API hazırdır. Frontend tarafı sadece yeni endpointleri çağıracak şekilde güncellenmelidir.

