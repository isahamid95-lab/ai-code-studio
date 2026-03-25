# ⚠️ SİSTEM DURUMU

## 🟢 ÇALIŞAN ÖZELLİKLER

✅ **File Explorer** - Dosya yönetimi çalışıyor
✅ **Git Panel** - Git işlemleri çalışıyor  
✅ **Terminal** - Kod çalıştırma çalışıyor
✅ **Code Editor** - Kod yazma çalışıyor
✅ **Preview** - Canlı önizleme çalışıyor
✅ **Dashboard** - Task yönetimi çalışıyor

## 🔴 ÇALIŞMAYAN ÖZELLİKLER

❌ **AI Chat** - API key gerekli
❌ **AI Agent** - API key gerekli

---

## 🔧 HIZLI ÇÖZÜM

### **AI Olmadan Kullanım:**

1. **Dosya Oluştur:**
   - Sol üstten "New File" tıkla
   - Dosya adı ver
   - Kodunu yaz
   - Kaydet

2. **Terminal Kullan:**
   - Alt panelden Terminal aç
   - Komutları çalıştır:
   ```bash
   npx create-vite@latest my-app --template react
   cd my-app
   npm install
   npm run dev
   ```

3. **Git Kullan:**
   - Git panel aç
   - "Initialize Repository" tıkla
   - Değişiklikleri stage et
   - Commit yap

---

## 🔑 AI Özelliklerini Aktif Et

### **1. Alibaba Qwen API Key Al:**

1. Git: https://dashscope.console.aliyun.com/
2. Kayıt ol / Giriş yap
3. API Keys → Create New API Key
4. Key'i kopyala

### **2. .env.local Dosyasını Oluştur:**

```bash
VITE_ALIBABA_API_KEY=sk-YOUR_REAL_KEY_HERE
```

### **3. Server'ı Yeniden Başlat:**

```bash
# Ctrl+C ile durdur
npm run dev
```

---

## 📚 DOKÜMANTASYON

- `API_KEY_SETUP.md` - Detaylı API key rehberi
- `QUICK_START.md` - Hızlı başlangıç kılavuzu
- `README.md` - Ana dokümantasyon

---

## 🐛 SORUN BİLDİRİMİ

Hata görüyorsanız:

1. **Console'u kontrol et** (F12)
2. **Network tab'ı kontrol et**
3. **`.env.local` dosyasını kontrol et**
4. **Server'ı restart et**

---

**Durum:** Geliştirme devam ediyor 🚀  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 24 Mart 2026
