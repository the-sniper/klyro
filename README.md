# Klyro - AI Portfolio Chatbot

An embeddable AI chatbot platform for portfolio websites. Let visitors ask questions about your experience, projects, and skills with accurate, context-aware responses.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa)

---

## Key Features

### Admin Dashboard

- **Visual Experience** – A modern, minimalist dashboard built with glassmorphism, smooth micro-animations, and a premium dark-mode interface.
- **Dynamic AI Persona** – Customize your bot's name, personality traits (friendly, professional, casual, formal, enthusiastic, calm), and communication style to match your personal brand.
- **Persona Presets** – Choose from pre-built persona templates or create custom configurations for your AI assistant.
- **User Profiles** – Manage your account with profile settings, display name customization, and secure password changes.
- **Secure Authentication** – Cookie-based session authentication with email/password support and protected routes via middleware.

### AI Engine & Knowledge Base

- **Advanced RAG Engine** – Uses Retrieval Augmented Generation with pgvector for semantic search, ensuring the AI only answers based on your verified knowledge base.
- **Multi-Format Ingestion** – Support for PDF, DOCX, TXT, MD, and direct URL scraping to build your bot's brain.
- **AI Tool Calling** – Dynamic tool execution for fetching live data:
  - `fetch_latest_projects` – Retrieve latest GitHub repositories
  - `fetch_url_content` – Get fresh content from portfolio URLs
  - `fetch_repository_details` – Fetch detailed README content for specific repos
  - `get_calendly_availability` – Check scheduling availability (when Calendly is connected)
- **GitHub Integration** – Built-in tool for the AI to fetch and discuss your latest repositories and technical contributions.
- **Calendly Integration** – Connect your Calendly account to let the AI share your availability and scheduling links.

### Widget & Integration

- **Effortless Embedding** – A lightweight (~25KB), performant JS widget (v2.0.0) that can be added to any site via script tag or NPM.
- **Customizable Widget Options:**
  - Position (bottom-right, bottom-left)
  - Theme (light, dark, auto)
  - Custom primary color
  - Header title customization
  - Launcher mode (icon or text button)
  - Custom launcher text
  - Allowed domains whitelist
  - Route-based visibility control
- **Chat Persistence** – Messages persist via localStorage for seamless conversations across page navigations.
- **Chat Transcript Download** – Users can download their conversation history.
- **Multi-Widget Support** – Create and manage multiple widgets for different websites.

### Testing Environment

- **Persistent Test Chat** – Stateful testing environment with localStorage persistence for thorough verification.
- **Strict Mode Toggle** – Test with strict mode to ensure AI only answers from knowledge base.
- **Real-time Preview** – See exactly how your chatbot responds before deploying.

### Progressive Web App (PWA)

- **Installable App** – Install Klyro on desktop and mobile devices for a native app experience.
- **Smart Install Banner** – Contextual install prompts for Android/Chrome and iOS Safari with platform-specific instructions.
- **Offline Support** – Service worker with network-first strategy and offline fallback.
- **Push Notifications** – Infrastructure ready for push notification support.
- **App Manifest** – Full PWA manifest with icons for all device sizes.

## Project Structure

```
klyro/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard
│   │   │   ├── page.tsx        # Dashboard overview with stats
│   │   │   ├── knowledge/      # Knowledge base management
│   │   │   ├── persona/        # AI persona configuration
│   │   │   ├── integrations/   # Widget management & embed codes
│   │   │   ├── profile/        # User profile & password
│   │   │   └── test-chat/      # Live chat testing environment
│   │   ├── api/
│   │   │   ├── auth/           # Login, signup, logout endpoints
│   │   │   ├── chat/           # RAG-powered chat endpoint
│   │   │   ├── documents/      # Knowledge base CRUD
│   │   │   ├── embeddings/     # Vector embedding generation
│   │   │   ├── persona/        # Persona config & presets
│   │   │   ├── profile/        # User profile management
│   │   │   └── widget/         # Widget configuration API
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   └── globals.css         # Core design system & theme tokens
│   ├── components/
│   │   ├── admin/              # Admin UI components (sidebar, etc.)
│   │   ├── chat/               # Chat UI components
│   │   ├── pwa/                # PWA components
│   │   │   ├── pwa-provider.tsx    # PWA context & install logic
│   │   │   ├── install-banner.tsx  # Smart install prompts
│   │   │   └── service-worker-registration.tsx
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── rag.ts          # RAG engine with tool calling
│   │   │   ├── embeddings.ts   # Text embedding generation
│   │   │   └── calendly.ts     # Calendly API integration
│   │   ├── db/
│   │   │   └── documents.ts    # Document database operations
│   │   ├── external/
│   │   │   ├── github.ts       # GitHub API integration
│   │   │   └── portfolio.ts    # Portfolio content scraping
│   │   ├── hooks/              # React hooks
│   │   └── supabase/           # Supabase client instances
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── middleware.ts           # Auth middleware for route protection
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── widget.js               # Compiled embeddable widget
│   └── icons/                  # PWA icons
├── widget/
│   ├── src/index.js            # Widget source code
│   └── build.js                # Widget build script (esbuild)
└── supabase/
    └── migrations/             # Database migrations
```

---

## Tech Stack

| Category            | Technology                                     |
| ------------------- | ---------------------------------------------- |
| **Framework**       | Next.js 14 (App Router)                        |
| **Language**        | TypeScript 5.0                                 |
| **Database**        | Supabase (PostgreSQL + pgvector)               |
| **AI/LLM**          | OpenAI (GPT-4o-mini & Text Embeddings 3 Small) |
| **Auth**            | Custom cookie-based sessions with bcrypt       |
| **Styling**         | Tailwind CSS 4.1 + Custom CSS Variables        |
| **File Processing** | Mammoth (DOCX), UnPDF (PDF)                    |
| **Widget Bundler**  | esbuild                                        |
| **Icons**           | Lucide React                                   |
| **Notifications**   | React Hot Toast                                |
| **Markdown**        | React Markdown                                 |

---

## Prerequisites

- **Node.js** 18+
- **Supabase** account (with `pgvector` enabled)
- **OpenAI API key**
- **GitHub Token** (optional, for higher rate limits)
- **Calendly API Token** (optional, for scheduling integration)

---

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Application URL (for widget embedding)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: GitHub Token (for higher API rate limits)
GITHUB_TOKEN=your-github-token

# Optional: Calendly (configured per-user in Persona settings)
# Users add their own Calendly tokens via the admin UI
```

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd klyro

# Install dependencies
npm install

# Build the widget script
npm run build:widget

# Run database migrations
npx supabase db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Widget Integration

Add the chat widget to any website with a single script tag:

```html
<script
  src="https://your-klyro-domain.com/widget.js"
  data-widget-key="your-widget-key"
  defer
></script>
```

### Widget Configuration Options

Configure your widget through the admin dashboard:

| Option          | Description                                 |
| --------------- | ------------------------------------------- |
| Position        | bottom-right or bottom-left                 |
| Theme           | light, dark, or auto                        |
| Primary Color   | Hex color for accent elements               |
| Header Title    | Custom title shown in chat header           |
| Welcome Message | First message displayed to users            |
| Launcher Mode   | Icon-only or text button                    |
| Launcher Text   | Custom text for text launcher mode          |
| Allowed Domains | Whitelist of domains where widget can run   |
| Allowed Routes  | Specific routes where widget should display |

---

## Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start development server         |
| `npm run build`        | Build for production             |
| `npm run start`        | Start production server          |
| `npm run lint`         | Run ESLint                       |
| `npm run build:widget` | Build the embeddable chat widget |

---

## Database Schema

The application uses the following main tables:

- **users** – User accounts and profiles
- **documents** – Knowledge base documents
- **document_chunks** – Chunked documents with embeddings
- **widgets** – Widget configurations
- **persona_config** – AI persona settings
- **persona_presets** – Pre-built persona templates
- **chat_sessions** – Chat session tracking
- **chat_messages** – Message history with sources

---

## Version History

| Version      | Date       | Changes                                                                                               |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| v1.0.0-alpha | 2026-01-31 | Official @klyro/widget NPM package release, tabbed installation interface, and documentation updates. |
| v0.2.0-alpha | 2026-01-25 | PWA support, Tailwind CSS integration, Calendly integration, persona presets, user profiles           |
| v0.1.0-alpha | 2026-01-21 | Initial alpha release with RAG engine, admin dashboard, and widget integration                        |

---

## Roadmap

- [ ] Google OAuth integration
- [ ] Analytics dashboard with conversation insights
- [ ] Multi-language support
- [ ] Voice chat capabilities
- [ ] Slack/Discord bot integrations
- [ ] Custom training data fine-tuning

---

## License

MIT

---

Built with ❤️ by [Areef Syed](https://github.com/the-sniper)
