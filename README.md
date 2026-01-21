# Chatfolio - AI Portfolio Chatbot

An embeddable AI chatbot platform for portfolio websites. Let visitors ask questions about your experience, projects, and skills with accurate, context-aware responses.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai)

---

## Key Features

### Admin Dashboard

- **Visual Experience** – A modern, minimalist dashboard built with glassmorphism, smooth micro-animations, and a premium dark-mode interface.
- **Dynamic AI Persona** – Customize your bot's name, personality traits, and communication style to match your personal brand.
- **Secure Authentication** – Multi-layered authentication supporting traditional email/password and Google OAuth.

### AI Engine & Knowledge Base

- **Advanced RAG Engine** – Uses Retrieval Augmented Generation to ensure the AI only answers based on your verified knowledge base.
- **Multi-Format Ingestion** – Support for PDF, DOCX, TXT, MD, and direct URL scraping to build your bot's brain.
- **GitHub Integration** – Built-in tool for the AI to fetch and discuss your latest repositories and technical contributions.

### Integration & Testing

- **Effortless Embedding** – A lightweight, performant JS widget that can be added to any site with a single script tag.
- **Persistent Test Chat** – Stateful testing environment with localStorage persistence and a 50-message limit for thorough verification.

## Project Structure

```
chatfolio/
├── src/
│   ├── app/
│   │   ├── admin/         # Main admin dashboard (tabbed navigation)
│   │   ├── api/           # Backend routes (RAG, documents, widget config)
│   │   ├── login/         # Auth pages
│   │   └── globals.css    # Core design system & theme tokens
├── components/            # Reusable UI components
├── lib/
│   ├── ai/                # Vector search & OpenAI orchestration
│   ├── db/                # Database access layer
│   └── supabase/          # Supabase client instances
└── widget/                # Source code for the embeddable chat widget
```

---

## Tech Stack

| Category            | Technology                              |
| ------------------- | --------------------------------------- |
| **Framework**       | Next.js 14 (App Router)                 |
| **Language**        | TypeScript                              |
| **Database**        | Supabase (PostgreSQL + pgvector)        |
| **AI/LLM**          | OpenAI (GPT-4o-mini & Text Embeddings)  |
| **Auth**            | Supabase Auth                           |
| **Styling**         | Vanilla CSS (Variables + Glassmorphism) |
| **File Processing** | Mammoth (DOCX), UnPDF (PDF)             |

---

## Prerequisites

- **Node.js** 18+
- **Supabase** account (with `pgvector` enabled)
- **OpenAI API key**

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
```

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd chatfolio

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

## Version History

| Version      | Date       | Changes                                                                         |
| ------------ | ---------- | ------------------------------------------------------------------------------- |
| v0.1.0-alpha | 2026-01-21 | Initial alpha release with RAG engine, admin dashboard, and widget integration. |

---

## License

MIT

---

Built with ❤️ by [Areef Syed](https://github.com/the-sniper)
