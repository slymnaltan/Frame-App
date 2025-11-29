const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, securityQuestion, securityAnswer } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "Bu email zaten kullanılıyor" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedAnswer
    });
    await newUser.save();

    res.status(201).json({ message: "Kayıt başarılı" });
  } catch (err) {
    res.status(500).json({ error: "Kayıt olurken hata oluştu" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Şifre yanlış" });
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "2d" });
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Giriş sırasında hata oluştu" });
  }
});

// VERIFY SECURITY ANSWER
router.post("/verify-security", async (req, res) => {
  const { email, securityAnswer } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    
    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    if (!isMatch) return res.status(400).json({ error: "Güvenlik cevabı yanlış" });
    
    res.json({ 
      success: true, 
      securityQuestion: user.securityQuestion 
    });
  } catch (err) {
    res.status(500).json({ error: "Doğrulama sırasında hata oluştu" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { email, securityAnswer, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    
    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    if (!isMatch) return res.status(400).json({ error: "Güvenlik cevabı yanlış" });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (err) {
    res.status(500).json({ error: "Şifre sıfırlama sırasında hata oluştu" });
  }
});

// GET SECURITY QUESTION
router.post("/get-security-question", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı" });
    
    res.json({ securityQuestion: user.securityQuestion });
  } catch (err) {
    res.status(500).json({ error: "Güvenlik sorusu alınırken hata oluştu" });
  }
});

module.exports = router;