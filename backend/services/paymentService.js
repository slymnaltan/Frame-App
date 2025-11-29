const Iyzipay = require("iyzipay");

// İyzico yapılandırması
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com", // sandbox veya production
});

// Ödeme formu oluştur
async function createPaymentForm(paymentData) {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(paymentData, (err, result) => {
      if (err) {
        console.error("Iyzipay error:", err);
        reject(err);
      } else {
        console.log("Iyzipay result:", result);
        resolve(result);
      }
    });
  });
}

// Ödeme sonucunu kontrol et
async function retrievePaymentResult(token) {
  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: token,
        token: token,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

module.exports = {
  iyzipay,
  createPaymentForm,
  retrievePaymentResult,
};
