# AI Code Studio - Hızlı Başlangıç

## ⚠️ ŞU ANKİ DURUM

**Çalışan Özellikler:**
- ✅ File Explorer - Dosya yönetimi
- ✅ Git Panel - Git işlemleri
- ✅ Terminal - Kod çalıştırma
- ✅ Code Editor - Kod yazma
- ✅ Preview - Canlı önizleme
- ✅ Dashboard - Task yönetimi

**Çalışmayan Özellikler:**
- ❌ AI Chat - API key gerekli
- ❌ AI Agent - API key gerekli

---

## 🔧 HIZLI ÇÖZÜM: AI Olmadan Kullanım

### **1. Sadece File Management Kullan**

AI olmadan da proje oluşturabilirsiniz:

1. **Sol üstten "New File" tıkla**
2. Dosya adı ver: `index.html`
3. Kodunu yaz
4. Kaydet

### **2. Manuel Proje Oluştur**

Terminal'de:
```bash
# React proji oluştur
npx create-vite@latest my-app --template react
cd my-app
npm install
npm run dev
```

### **3. Git Kullan**

Git panelinden:
- Initialize Repository tıkla
- Değişiklikleri stage et
- Commit yap
- Push et

---

## 🔑 AI Özelliklerini Aktif Et

### **Seçenek 1: Alibaba Qwen (ÖNERİLEN)**

1. API key al: https://dashscope.console.aliyun.com/
2. `.env.local` dosyasını oluştur:
   ```bash
   VITE_ALIBABA_API_KEY=sk-YOUR_KEY_HERE
   ```
3. Server'ı restart et: `npm run dev`

### **Seçenek 2: Google Gemini (ÜCRETSİZ)**

1. API key al: https://makersuite.google.com/app/apikey
2. `.env.local` dosyasına ekle:
   ```bash
   VITE_GEMINI_API_KEY=YOUR_KEY_HERE
   ```
3. `server.ts` dosyasında Gemini endpoint'ini kullan

### **Seçenek 3: OpenAI**

1. API key al: https://platform.openai.com/api-keys
2. `.env.local` dosyasına ekle:
   ```bash
   VITE_OPENAI_API_KEY=sk-YOUR_KEY_HERE
   ```

---

## 📁 Örnek Proje Yapısı

```
project-workspace/
├── index.html          # Ana HTML dosyası
├── src/
│   ├── App.tsx        # React component
│   ├── main.tsx       # Entry point
│   └── index.css      # Styles
├── package.json       # Dependencies
└── vite.config.ts     # Vite config
```

---

## 🎯 Hızlı Test

### **HTML Dosyası Oluştur:**

1. File Explorer → New File
2. Ad: `index.html`
3. İçerik:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```
4. Kaydet
5. Preview panel'ı aç → Görmeli!

---

## ❓ Sık Sorulan Sorular

**S: AI olmadan kullanılabilir mi?**
C: Evet! File management, Git, Terminal, Preview hepsi çalışıyor.

**S: Hangi API key daha iyi?**
C: Alibaba Qwen - ucuz ve hızlı. Google Gemini - ücretsiz kota var.

**S: API key olmadan test edebilir miyim?**
C: Evet, ama AI özellikleri çalışmaz. Manuel kod yazabilirsiniz.

---

## 🐛 Sorun Bildirimi

Hata buldunuz mu? Şunları kontrol edin:

1. ✅ Console'da hata var mı? (F12)
2. ✅ Network tab'da failed request var mı?
3. ✅ `.env.local` doğru mu?
4. ✅ Node_modules güncel mi? (`npm install`)

---

**Destek:** support@aicodestudio.dev
