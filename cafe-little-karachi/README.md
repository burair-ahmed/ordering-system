# 🕌 Cafe Little Karachi (CLK)

A premium restaurant management and ordering platform designed for high-end dining experiences. CLK combines a rich, cultural aesthetic with a sophisticated technical architecture to provide a seamless journey for both customers and staff.

---

## 🏗️ System Architecture

CLK is built on a high-performance hybrid architecture that leverages the latest web technologies for real-time responsiveness and data integrity.

```mermaid
graph TD
    Client[Customer/Admin Browser] -- "HTTP/JSON" --> API[Next.js API Routes]
    Client -- "WebSockets" --> Socket[Socket.IO Server]
    API -- "Mongoose" --> DB[(MongoDB Atlas)]
    Socket -- "Real-time Events" --> Client
    API -- "Automated Notifications" --> Twilio[Twilio WhatsApp Service]
    API -- "Image Storage" --> Cloudinary[Cloudinary]
```

---

## 🔄 Order Lifecycle Flow

The following diagram illustrates the lifecycle of an order from customer initiation to real-time status updates.

```mermaid
sequenceDiagram
    participant C as Customer UI
    participant S as Server (Next.js)
    participant D as Database (MongoDB)
    participant W as WebSocket (Socket.IO)
    participant A as Admin Dashboard

    C->>S: POST /api/orders (Create Order)
    S->>D: Save Order (Status: Pending)
    S->>W: Emit "new_order" event
    W->>A: Update Live Dashboard
    A->>S: PATCH /api/updateorderstatus (Accepted)
    S->>D: Update Status
    S->>W: Emit "order_updated" event
    W->>C: Update Progress Bar
    S-->>C: Twilio WhatsApp Confirmation
```

---

## 🧬 Core Logic: Variation System

One of CLK's strongest features is its granular variation engine, allowing complex item configurations with dynamic pricing.

```mermaid
classDiagram
    class MenuItem {
        +String name
        +Number basePrice
        +VariationGroup[] variations
    }
    class VariationGroup {
        +String title
        +Boolean isRequired
        +Option[] options
    }
    class Option {
        +String name
        +Number additionalPrice
    }
    MenuItem *-- VariationGroup
    VariationGroup *-- Option
```

---

## ✨ Key Technical Highlights

- **⚡ Real-Time Engine**: Built with **Socket.IO** for instantaneous updates across the Customer UI and Admin Dashboard.
- **📱 Hybrid Routing**: Seamless transition between **Next.js App Router** (modern UI) and **Pages Router** (robust API endpoints).
- **🎨 Glassmorphism UI**: High-end visual design using **Tailwind CSS**, **Framer Motion**, and **GSAP** for a premium feel.
- **📊 Behavioral Analytics**: Integrated **PostHog** and **Google Analytics** to track conversion and optimize user flows.
- **🛡️ Secure Data**: Strict schema validation with **Zod** and **Mongoose** for data consistency.

---

## 📁 Project Structure

- `src/app/`: Modern Next.js layouts and components.
- `src/pages/api/`: Optimized API endpoints for order processing.
- `src/context/`: Centralized state management for Cart and Orders.
- `docs/`: Extensive documentation on features and API endpoints.

---

**Little Karachi Express - Empowering Premium Dining.**
*Last Updated: February 2026*
