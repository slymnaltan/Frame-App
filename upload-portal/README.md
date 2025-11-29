## Memory Upload Portal

Bu React tabanlı mini portal, misafirlerin QR kodunu okuttuktan sonra fotoğraf/video yüklemesini sağlar. Arayüz, mobil uygulamadaki koyu tema renklerini kullanır ve üç adımlı akış içerir:

1. **Karşılama metni** – etkinlik hakkında kısa bilgilendirme.
2. **Yükleme kartı** – dosya seçimi, opsiyonel isim/not alanları ve `Gönder` butonu.
3. **Teşekkür adımı** – başarılı yüklemeden sonra mesaj ve “Başka yükle” butonu (formu sıfırlar).

### Çalıştırma

```bash
cd upload-portal
npm install
npm run dev
```

Varsayılan olarak `http://localhost:5174` adresinde çalışır. QR linklerinin işleyebilmesi için dağıttığınız domain `UPLOAD_BASE_URL` ile eşleşmelidir (örn. `https://memory.example.com/upload/:slug`).

### Ortam Değişkenleri

`.env` dosyası oluşturup API adresini tanımlayın:

```
VITE_API_URL=http://localhost:5000/api
```

Üretimde bu adres backend sunucunuza işaret etmelidir.

### Yapı

- `src/pages/App.jsx` – akış kontrolü, upload isteği.
- `src/sections/WelcomeView.jsx` – karşılama başlığı.
- `src/sections/UploadForm.jsx` – dosya seçimi ve form alanları.
- `src/sections/SuccessView.jsx` – teşekkür mesajı + “Başka yükle” butonu.
- `src/styles.css` – Memory temasına uyumlu koyu renk paleti.

Projeyi herhangi bir static hosting (Vercel, Netlify vb.) üzerine atabilir veya Nginx ile servis edebilirsin. QR linkleri otomatik olarak `/upload/:slug` biçiminde olduğu için Router bu rotayı karşılar. Slug URL’de yoksa kullanıcıya uyarı çıkar. 


