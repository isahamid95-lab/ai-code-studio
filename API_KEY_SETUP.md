# 🔑 API Key Kurulum Rehberi

## Sorun
```
Error: invalid_api_key - invalid access token or token expired
```

## Çözüm

### 1. Alibaba Qwen API Key Al (ÖNERİLEN)

**Adımlar:**
1. https://dashscope.console.aliyun.com/ adresine git
2. Kayıt ol / Giriş yap
3. Sol menüden **API Keys** seç
4. **Create New API Key** butonuna tıkla
5. API key'i kopyala
6. `.env.local` dosyasını aç:
   ```bash
   VITE_ALIBABA_API_KEY=sk-YOUR_REAL_KEY_HERE
   ```
7. Dev server'ı yeniden başlat:
   ```bash
   npm run dev
   ```

**Ücretsiz Kota:**
- Yeni kullanıcılara ücretsiz deneme kredisi
- Detaylar: https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-qianwen-llm

---

### 2. Alternatif: Google Gemini API

**Adımlar:**
1. https://makersuite.google.com/app/apikey adresine git
2. Google hesabınla giriş yap
3. **Create API Key** tıkla
4. Key'i kopyala
5. `.env.local` dosyasına ekle:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```

**Ücretsiz:**
- Evet, cömert ücretsiz kota var
- Detaylar: https://ai.google.dev/pricing

---

### 3. Alternatif: OpenAI API

**Adımlar:**
1. https://platform.openai.com/api-keys adresine git
2. OpenAI hesabınla giriş yap
3. **Create new secret key** tıkla
4. Key'i kopyala
5. `.env.local` dosyasına ekle:
   ```bash
   VITE_OPENAI_API_KEY=sk-your_openai_key_here
   ```

**Ücretli:**
- $0.01-0.03 / 1K tokens (GPT-4o)
- Detaylar: https://openai.com/pricing

---

## Hata Ayıklama

### API Key Hala Çalışmıyorsa:

1. **Key'i kontrol et:**
   ```bash
   # .env.local dosyasında boşluk olmadığından emin ol
   VITE_ALIBABA_API_KEY=sk-abc123...  # ✅ Doğru
   VITE_ALIBABA_API_KEY= sk-abc123... # ❌ Yanlış (başında boşluk)
   ```

2. **Server'ı yeniden başlat:**
   ```bash
   # Ctrl+C ile durdur
   npm run dev
   ```

3. **Console'u kontrol et:**
   ```javascript
   // Tarayıcı console'unda (F12) şunu çalıştır:
   console.log(import.meta.env.VITE_ALIBABA_API_KEY)
   // undefined veya "sk-YOUR_ACTUAL..." görmeli
   ```

4. **API URL'yi kontrol et:**
   ```bash
   VITE_ALIBABA_BASE_URL=https://coding-intl.dashscope.aliyuncs.com/v1
   ```

---

## Hızlı Test

API key'inizi test etmek için:

```bash
# Terminal'de
curl -X POST https://coding-intl.dashscope.aliyuncs.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-turbo","messages":[{"role":"user","content":"Hello"}]}'
```

**Başarılı yanıt:**
```json
{
  "choices": [{
    "message": {"content": "Hello! How can I help you?"}
  }]
}
```

---

## Güvenlik Uyarıları

⚠️ **ASLA yapma:**
- API key'i GitHub'a commit etme
- `.env.local` dosyasını paylaşma
- Key'i client-side kodda açıkta bırakma

✅ **Her zaman yap:**
- `.env.local` dosyasını `.gitignore`'a ekle (✅ zaten ekli)
- Key'leri düzenli olarak rotate et
- Production'da environment variables kullan

---

## Yardım

Sorun devam ediyorsa:
1. API provider'ın dokümantasyonunu kontrol et
2. Console hatalarını kontrol et
3. Network tab'ında API çağrısını incele

**Destek:** support@aicodestudio.dev
