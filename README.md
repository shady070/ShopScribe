# 🛒 ShopScribe

<div align="center">

![ShopScribe](https://img.shields.io/badge/ShopScribe-E%2DCommerce-10B981?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript%205-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss)

**Modern e-commerce platform for shop management and customer engagement**

🌐 [Live Demo](https://shop-scribe-six.vercel.app) • 📖 [Docs](#-project-structure) • 🐛 [Report Bug](https://github.com/shady070/ShopScribe/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Internationalization](#-internationalization)
- [Email Integration](#-email-integration)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🎯 About

ShopScribe is a full-featured e-commerce platform frontend built with Next.js 15. It provides shop owners and managers with professional tools to create, manage, and optimize their online product presence with multi-language support and email integration.

Deployed on Vercel for optimal performance and automatic scaling.

---

## ✨ Features

- ✅ **Product Management** - Create and manage product listings
- ✅ **Shop Dashboard** - Comprehensive analytics and overview
- ✅ **Multi-Language** - Internationalization (i18n) support
- ✅ **Email Notifications** - Resend integration
- ✅ **Toast Notifications** - Sonner for user feedback
- ✅ **Accessible Forms** - Radix UI form components
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **TypeScript** - Full type safety
- ✅ **Dark Mode** - Theme customization
- ✅ **Performance** - Next.js 15 optimization

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) - React framework |
| **UI Library** | [React 19](https://react.dev/) - User interface |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) - Type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) - Utility CSS |
| **Components** | [Radix UI](https://www.radix-ui.com/) - Accessible UI |
| **Icons** | [Lucide React](https://lucide.dev/) - Icon system |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) - Internationalization |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) - Toast alerts |
| **Email** | [Resend](https://resend.com/) - Email service |
| **HTTP Client** | [Axios](https://axios-http.com/) - API requests |
| **Deployment** | [Vercel](https://vercel.com/) - Hosting |

---

## 📸 Screenshots

### Shop Dashboard
```
[Screenshot Placeholder: Main shop dashboard]
- Product overview
- Sales analytics
- Recent orders
- Performance metrics
```

### Product Management
```
[Screenshot Placeholder: Product management interface]
- Product listing
- Add/Edit product
- Image upload
- Pricing & inventory
```

### Multi-Language Support
```
[Screenshot Placeholder: Language switcher]
- Language selection dropdown
- Instant translation
- Regional content
- Currency adaptation
```

### Order Notifications
```
[Screenshot Placeholder: Email notifications]
- Order confirmation
- Shipping updates
- Customer notifications
- Template customization
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x (recommended 20.x)
- **npm** >= 9.x or **yarn**

### Quick Setup

```bash
# Clone repository
git clone https://github.com/shady070/ShopScribe.git
cd ShopScribe

# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
# Visit http://localhost:3000
```

---

## 📦 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/shady070/ShopScribe.git
cd ShopScribe
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Development Server

```bash
npm run dev
```

Application available at `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com

# Resend Email
NEXT_PUBLIC_RESEND_API_KEY=your_resend_key

# App Configuration
NEXT_PUBLIC_APP_NAME=ShopScribe
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Internationalization Setup

Configure languages in `i18n.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}))
```

---

## 💻 Usage

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Build & Deploy

```bash
# Production build
npm run build

# Deploy to Vercel (automatic)
git push origin main
```

---

## 📁 Project Structure

```
shopscribe/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── [locale]/              # Locale routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── (shop)/
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── orders/
│   │       └── settings/
│   └── api/                   # API routes
│
├── components/                 # Reusable components
│   ├── ui/                    # UI primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── shop/                  # Shop components
│   │   ├── ProductCard.tsx
│   │   ├── OrderList.tsx
│   │   └── Dashboard.tsx
│   └── navigation/
│
├── lib/                        # Utilities
│   ├── i18n.ts                # i18n config
│   ├── resend.ts              # Email service
│   └── api.ts                 # API client
│
├── messages/                   # i18n messages
│   ├── en.json                # English
│   ├── es.json                # Spanish
│   └── fr.json                # French
│
├── styles/                     # Global styles
│   └── globals.css
│
├── public/                     # Static assets
│   └── images/
│
├── package.json               # Dependencies
├── i18n.ts                    # i18n configuration
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── README.md                  # Documentation
```

---

## 🌍 Internationalization

### Adding New Languages

1. Create message file: `messages/[language].json`

```json
{
  "home": {
    "title": "Welcome to ShopScribe",
    "description": "Manage your shop with ease"
  }
}
```

2. Use in components:

```typescript
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('home')
  return <h1>{t('title')}</h1>
}
```

### Language Switcher

```typescript
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const router = useRouter()
  const locale = useLocale()

  return (
    <select value={locale} onChange={(e) => router.push(`/${e.target.value}`)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  )
}
```

---

## 📧 Email Integration

### Resend Setup

1. Create account at [resend.com](https://resend.com/)
2. Get API key
3. Add to `.env.local`:

```env
NEXT_PUBLIC_RESEND_API_KEY=your_api_key
```

### Send Email

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function sendOrderConfirmation(email: string, order: Order) {
  await resend.emails.send({
    from: 'orders@shopscribe.com',
    to: email,
    subject: 'Order Confirmation',
    html: `<h1>Order #${order.id} confirmed</h1>`
  })
}
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

---

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts`:

```typescript
theme: {
  colors: {
    primary: '#10B981',
    secondary: '#06B6D4',
  }
}
```

### Custom Components

Create in `components/ui/`:

```typescript
import { cva } from "class-variance-authority"

const buttonVariants = cva("base-styles", {
  variants: {
    variant: {
      primary: "bg-blue-600",
      secondary: "bg-gray-200"
    }
  }
})
```

---

## 🚀 Future Improvements

- [ ] **Payment Gateway** - Stripe integration
- [ ] **Inventory Management** - Stock tracking
- [ ] **Analytics Dashboard** - Advanced metrics
- [ ] **Customer Management** - CRM integration
- [ ] **Mobile App** - React Native version
- [ ] **AI Recommendations** - Smart suggestions
- [ ] **Social Media Integration** - Multi-channel selling
- [ ] **Loyalty Program** - Rewards system

---

## 📝 License

This project is **private**. 

---

## 🤝 Support

- **GitHub**: [@shady070](https://github.com/shady070)
- **Live Demo**: [https://shop-scribe-six.vercel.app](https://shop-scribe-six.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/shady070/ShopScribe/issues)

<div align="center">

### Show Your Support ⭐

If this helped you, give it a star!

**Made with ❤️ by [@shady070](https://github.com/shady070)**

</div>
