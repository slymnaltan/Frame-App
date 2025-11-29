// Fiyatlandırma planları
const PRICING_PLANS = {
  rental: {
    free: {
      days: 1,
      price: 0,
      label: "1 Gün (Ücretsiz)",
    },
    week: {
      days: 7,
      price: 49.99,
      label: "1 Hafta",
    },
    twoWeeks: {
      days: 14,
      price: 89.99,
      label: "2 Hafta",
    },
    month: {
      days: 30,
      price: 149.99,
      label: "1 Ay",
    },
    threeMonths: {
      days: 90,
      price: 399.99,
      label: "3 Ay",
    },
    sixMonths: {
      days: 180,
      price: 699.99,
      label: "6 Ay",
    },
    year: {
      days: 365,
      price: 1199.99,
      label: "1 Yıl",
    },
  },
  storage: {
    free: {
      days: 3,
      price: 0,
      label: "3 Gün (Ücretsiz)",
    },
    week: {
      days: 7,
      price: 29.99,
      label: "1 Hafta",
    },
    twoWeeks: {
      days: 14,
      price: 49.99,
      label: "2 Hafta",
    },
    month: {
      days: 30,
      price: 79.99,
      label: "1 Ay",
    },
    threeMonths: {
      days: 90,
      price: 199.99,
      label: "3 Ay",
    },
    sixMonths: {
      days: 180,
      price: 349.99,
      label: "6 Ay",
    },
    year: {
      days: 365,
      price: 599.99,
      label: "1 Yıl",
    },
  },
};

// Fiyat hesaplama
function calculatePrice(rentalPlan, storagePlan) {
  const rental = PRICING_PLANS.rental[rentalPlan] || PRICING_PLANS.rental.free;
  const storage = PRICING_PLANS.storage[storagePlan] || PRICING_PLANS.storage.free;
  
  return {
    rentalPrice: rental.price,
    storagePrice: storage.price,
    totalPrice: rental.price + storage.price,
    rentalDays: rental.days,
    storageDays: storage.days,
    rentalLabel: rental.label,
    storageLabel: storage.label,
  };
}

// Ücretsiz mi kontrol et
function isFree(rentalPlan, storagePlan) {
  const { totalPrice } = calculatePrice(rentalPlan, storagePlan);
  return totalPrice === 0;
}

module.exports = {
  PRICING_PLANS,
  calculatePrice,
  isFree,
};
