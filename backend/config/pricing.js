// Fiyatlandırma planları - Birleştirilmiş Paketler
const PRICING_PLANS = {
  PACKAGES: {
    free: {
      id: "free",
      name: "Deneme Paketi",
      rentalDays: 1,
      storageDays: 2,
      price: 0,
      label: "1 Gün Kiralama + 2 Gün Saklama (Ücretsiz)",
      features: ["1 Gün Karekod Kullanımı", "2 Gün Fotoğraf Saklama"]
    },
    basic: {
      id: "basic",
      name: "Başlangıç Paketi",
      rentalDays: 2,
      storageDays: 3,
      price: 129.99, // Fiyatlar temsilidir, linkte ne tanımlıysa o çekilir aslında ama frontend'de göstermek için
      label: "2 Gün Kiralama + 3 Gün Saklama",
      features: ["2 Gün Karekod Kullanımı", "3 Gün Fotoğraf Saklama"]
    },
    standard: {
      id: "standard",
      name: "Standart Paket",
      rentalDays: 4,
      storageDays: 7,
      price: 249.99,
      label: "4 Gün Kiralama + 7 Gün Saklama",
      features: ["4 Gün Karekod Kullanımı", "7 Gün Fotoğraf Saklama"]
    },
    premium: {
      id: "premium",
      name: "Premium Paket",
      rentalDays: 7,
      storageDays: 10,
      price: 349.99,
      label: "7 Gün Kiralama + 10 Gün Saklama",
      features: ["7 Gün Karekod Kullanımı", "10 Gün Fotoğraf Saklama"]
    }
  }
};

// Plan detaylarını getir
function getPlanDetails(planId) {
  return PRICING_PLANS.PACKAGES[planId] || PRICING_PLANS.PACKAGES.free;
}

// Ücretsiz mi kontrol et
function isFree(planId) {
  const plan = getPlanDetails(planId);
  return plan.price === 0;
}

module.exports = {
  PRICING_PLANS,
  getPlanDetails,
  isFree,
};
