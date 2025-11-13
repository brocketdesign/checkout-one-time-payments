# TwiixAI - Features Quick Reference

## 🎯 Implemented Features (5)

### Video AI Tools
1. **Image to Video** (`/image-to-video`)
   - Convert static images to animated videos
   - Models: WAN-I2V, Kling-V1.6-I2V
   - Premium feature ($1 USD / ¥100 JPY)
   - Configurable: aspect ratio, duration, motion intensity

2. **Video Face Swap** (`/?mode=video`)
   - Replace faces in videos with a source image
   - Free mode: Image-to-image swap
   - Paid mode: Video-to-video swap ($1 USD / ¥100 JPY)
   - Max video: 10MB, Max image: 1MB

### Image AI Tools
3. **Image Face Swap** (`/?mode=image`)
   - Replace faces in static images
   - 100% Free
   - Supports: JPEG, PNG, WebP
   - Max size: 1MB per image

### Content & Discovery
4. **AI Tools** (`/ai-tools`)
   - Showcase of all available AI tools
   - Tool cards with comparison previews
   - Quick launch buttons

5. **My Creations** (`/history`)
   - View processing history
   - Download generated content
   - Track past creations

---

## ❌ Placeholder Features (Not Yet Implemented)

These features appear in the sidebar but have no working implementation:

- Text to Video
- Consistent Character Video
- AI Animation
- AI Video Effects
- AI Image Generator
- AI Photo Effects
- Explore (Beta)
- Download App

---

## 💳 Payment & Pricing

| Feature | Price | Status |
|---------|-------|--------|
| Image Face Swap | Free | ✅ Working |
| Video Face Swap (paid) | $1 USD / ¥100 JPY | ✅ Working |
| Image to Video | $1 USD / ¥100 JPY | ✅ Working |
| UI Features | Free | ✅ Working |

---

## 🌍 Language Support

- **English** (en) → USD pricing
- **Japanese** (ja) → JPY pricing
- Language selection via cookie (`preferredLanguage`)

---

## 📚 Documentation

Full details available in:
- `docs/FEATURES.md` - Comprehensive feature documentation
- `docs/UPDATE_SUMMARY.md` - Summary of recent changes
- `README.md` - Project overview

---

## 🔗 Key Routes

```
GET  /                          # Home (Video Face Swap by default)
GET  /?mode=image               # Image Face Swap mode
GET  /image-to-video            # Image to Video tool
GET  /ai-tools                  # AI Tools showcase
GET  /history                   # My Creations
POST /api/create-checkout-session # Payment processing
POST /webhook                   # Stripe webhook
```

---

## 🛠️ Technical Stack

- **Frontend**: Handlebars, Vanilla JavaScript, Bootstrap
- **Backend**: Express.js, Node.js
- **Payment**: Stripe Checkout
- **AI APIs**: Novita.ai (video/image manipulation)
- **Storage**: AWS S3
- **Real-time**: WebSocket
- **Processing**: Sharp (image), Multer (uploads)

---

**Last Updated**: November 13, 2025
