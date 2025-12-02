# Healthcare Translator

A secure, AI-powered medical translation tool designed for healthcare communication. Features real-time translation with voice input, medical terminology support, and privacy-focused design.

## 🏥 Features

- **🗣️ Voice Input**: Speech-to-text with continuous recognition
- **🧠 AI-Powered Translation**: Medical-optimized translations using Groq AI
- **💊 Medical Terminology**: Built-in support for 60+ medical abbreviations and emergency phrases
- **🔒 Privacy-First**: Zero data storage - all processing in-memory
- **📱 Mobile-Optimized**: Touch-friendly interface with proper accessibility
- **🌙 Dark Mode**: Automatic theme switching
- **🌍 Multiple Languages**: English, Spanish, French, German, Arabic, Hindi, Chinese

## ⚠️ Important Disclaimer

**This tool is for general communication assistance only.** Translations may not be 100% accurate. For critical medical decisions, always use a professional medical interpreter. See [SECURITY.md](./SECURITY.md) for HIPAA compliance considerations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Groq API key ([Get one here](https://console.groq.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/healthcare-translator.git
cd healthcare-translator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GROQ_API_KEY
```

### Environment Variables

Create a `.env.local` file:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Groq SDK (OpenAI GPT model)
- **Speech**: Web Speech API (browser native)

### Project Structure

```
healthcare-translator/
├── src/
│   └── app/
│       ├── api/
│       │   └── translate/
│       │       └── route.ts         # Translation API endpoint
│       ├── layout.tsx                # Root layout with metadata
│       ├── page.tsx                  # Home page
│       └── globals.css               # Global styles
├── component/
│   └── Translator.tsx                # Main translator component
├── hook/
│   └── useSpeech.ts                  # Speech recognition hook
├── lib/
│   └── medicalTerms.ts               # Medical terminology database
├── public/                           # Static assets
├── SECURITY.md                       # Security & HIPAA documentation
└── package.json
```

## 🔐 Security Features

### Data Protection
- **No Persistent Storage**: All data processed in-memory
- **Automatic Clearing**: Data cleared on page unload
- **HTTPS Enforcement**: Required in production
- **Security Headers**: CSP, XSS protection, frame protection

### Rate Limiting
- 20 requests per minute per IP
- Protects against abuse and DoS attacks

### Input Validation
- 3,000 character limit
- Language code whitelist
- HTML escaping on all outputs

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## 💊 Medical Features

### Supported Medical Abbreviations

The system automatically expands 60+ medical abbreviations including:

- **Vital Signs**: BP, HR, RR, SpO2, T
- **Medications**: BID, TID, QID, PRN
- **Routes**: PO, IV, IM, SC
- **Diagnostics**: CBC, ECG, MRI, CT
- **Emergencies**: CPR, MI, CVA, PE

### Emergency Detection

Automatically detects emergency medical content:
- Chest pain
- Difficulty breathing
- Severe bleeding
- Loss of consciousness
- Stroke symptoms
- And more...

### Translation Optimization

Medical-specific AI prompts ensure:
- ✅ Accurate medical terminology
- ✅ Preserved dosages and measurements
- ✅ Cultural sensitivity
- ✅ Patient-friendly language
- ✅ Safety-first approach

## 📱 Mobile Optimization

- **Touch Targets**: All buttons meet 44x44px accessibility standard
- **Responsive Design**: Optimized for phones, tablets, and desktops
- **Floating Mic Button**: Always-accessible voice input (80px mobile, 64px desktop)
- **Large Text Areas**: 200px minimum height for comfortable reading
- **Landscape Support**: Works in all orientations

## 🌍 Supported Languages

| Code | Language |
|------|----------|
| `en` | English  |
| `es` | Spanish  |
| `fr` | French   |
| `de` | German   |
| `ar` | Arabic   |
| `hi` | Hindi    |
| `zh` | Chinese  |

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Environment Requirements

- Node.js 18+
- HTTPS (enforced in production)
- Groq API key

### Security Checklist

Before deploying to production:

- [ ] HTTPS configured and enforced
- [ ] GROQ_API_KEY added to environment variables
- [ ] Security headers configured
- [ ] Rate limiting tested
- [ ] Review HIPAA compliance requirements in [SECURITY.md](./SECURITY.md)
- [ ] Staff training on de-identification procedures
- [ ] Privacy notice displayed to users

## 📖 Usage Guide

### Basic Translation

1. Select source and target languages
2. Type or speak your medical text
3. Review the translation
4. Use Copy or Speak buttons to share

### Voice Input

1. Click the green floating microphone button
2. Speak clearly near your device
3. Click stop when finished
4. Translation appears automatically

### Best Practices

- ❌ Don't include patient names or identifiers
- ✅ Use for general symptoms and instructions
- ✅ Verify critical information with professional interpreters
- ✅ Keep text clear and concise
- ✅ Review translations before sharing with patients

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure linting passes
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## ⚕️ Healthcare Notice

This software is provided "as is" without warranty. It is not a medical device and is not certified for clinical use. Healthcare organizations must:

- Conduct their own risk assessment
- Consult legal/compliance experts
- Implement appropriate safeguards
- Train staff on limitations
- Use professional medical interpreters for critical communications

## 🆘 Support

For issues or questions:
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/healthcare-translator/issues)
- **Security Issues**: See [SECURITY.md](./SECURITY.md) for responsible disclosure

## 🙏 Acknowledgments

- Groq AI for translation infrastructure
- Medical terminology standards from healthcare industry
- Web Speech API for voice recognition
- Next.js team for the excellent framework

---

**Built with care for better healthcare communication** 💙
