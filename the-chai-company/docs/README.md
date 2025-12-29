# 🍽️ Ordering System Documentation

A comprehensive restaurant ordering system built with Next.js, TypeScript, and MongoDB featuring real-time order tracking, admin panel, and advanced customization options.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [API Documentation](./api/endpoints.md)
- [Component Library](./components/ui-components.md)
- [Feature Documentation](./features/)
- [Contributing](#contributing)

## ✨ Features

### Customer Features
- 🛒 **Advanced Menu System** with customizable items and platters
- 📱 **Responsive Design** optimized for mobile and desktop
- 🛍️ **Smart Cart** with persistent storage and real-time updates
- 📍 **Table-based Ordering** for dine-in customers
- 📊 **Live Order Tracking** with status updates
- 🎨 **Intuitive UI** with smooth animations and transitions
- ♿ **Accessibility Compliant** (WCAG 2.1 AA)

### Admin Features
- 📊 **Comprehensive Dashboard** with analytics and insights
- 🍽️ **Menu Management** with drag-and-drop reordering
- 📋 **Order Management** with status updates and notifications
- 🪑 **Table Management** for restaurant layout
- 👥 **Customer Feedback** collection and analysis
- 📱 **Real-time Updates** via WebSocket integration

### Technical Features
- ⚡ **Next.js 15** with App Router and Server Components
- 🔷 **TypeScript** for type-safe development
- 🎨 **Tailwind CSS** with custom design system
- 🗄️ **MongoDB** with Mongoose ODM
- 🔄 **Real-time Communication** with Socket.IO
- 📱 **Progressive Web App** capabilities

## 🏗️ Architecture

### Tech Stack
```
Frontend:    Next.js 15, TypeScript, Tailwind CSS, Framer Motion
Backend:     Next.js API Routes, MongoDB, Mongoose
Real-time:   Socket.IO
Deployment:  Vercel/Netlify
```

### Key Components
- **Variation System**: Unified customization framework
- **Context Providers**: Cart, Order, Table state management
- **Component Library**: Reusable UI components with Shadcn/ui
- **API Layer**: RESTful endpoints with validation
- **Admin Panel**: Complete management interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ordering-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Setup

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ordering-system

# Authentication (if needed)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# External Services
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# WhatsApp Integration
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel routes
│   ├── api/               # API endpoints
│   ├── checkout/          # Checkout flow
│   └── thank-you/         # Order confirmation
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── variations/       # Variation system
│   └── forms/            # Form components
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
├── contexts/             # React contexts
├── lib/                  # Utility functions
└── styles/               # Global styles

docs/                     # Documentation
├── features/            # Feature docs
├── api/                 # API docs
├── components/          # Component docs
└── updates/             # Changelog
```

## 🎨 Design System

### Color Palette
- **Primary**: `#741052` to `#d0269b` (Pink gradient)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Typography
- **Headings**: Gradient text with primary colors
- **Body**: Neutral grays for readability
- **Buttons**: Consistent sizing and styling

### Components
- **Buttons**: Gradient primary, outline secondary
- **Cards**: Glassmorphism with backdrop blur
- **Forms**: Consistent input styling with focus states
- **Modals**: Centered overlays with smooth animations

## 📚 Documentation

### Feature Documentation
- [Variation System](./features/variation-system.md)
- [Admin Panel](./features/admin-panel.md)
- [Order Tracking](./features/order-tracking.md)
- [Menu Management](./features/menu-system.md)

### API Documentation
- [REST Endpoints](./api/endpoints.md)
- [Data Schemas](./api/schemas.md)
- [Authentication](./api/auth.md)

### Component Library
- [UI Components](./components/ui-components.md)
- [Business Components](./components/business-components.md)

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** documentation first in `docs/features/`
4. **Implement** with tests
5. **Commit** with conventional commits
6. **Push** and create a Pull Request

### Code Standards
- Follow the [Cursor Rules](/.cursorrules) strictly
- Use TypeScript for all new code
- Write comprehensive tests
- Update documentation for new features
- Follow the established design system

### Commit Convention
```
feat: add new ordering feature
fix: resolve cart calculation bug
docs: update API documentation
style: format code with prettier
refactor: simplify component logic
test: add unit tests for cart functionality
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@orderingsystem.com or create an issue in the repository.

## 🙏 Acknowledgments

- Built with Next.js and the amazing React ecosystem
- UI components powered by Shadcn/ui
- Icons from Lucide React
- Animations with Framer Motion

---

**Last updated:** December 2025
**Version:** 1.0.0
