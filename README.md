# Chatfolio - AI Portfolio Chatbot

An embeddable AI chatbot platform for portfolio websites. Let visitors ask questions about your experience, projects, and skills with accurate, context-aware responses.

## Features

- **Knowledge Base Management**: Upload documents via text input or URL scraping
- **RAG-Powered Responses**: Answers based only on your curated knowledge base
- **Admin Portal**: Manage documents, test chat, configure widgets
- **Embeddable Widget**: Add to any website with a single script tag
- **Source Citations**: See which documents were used to generate each response
- **Theming**: Light, dark, and auto themes with customizable colors

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Supabase account with pgvector enabled
- OpenAI API key

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Database Setup

Run the SQL migration in your Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# and run in Supabase SQL Editor
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage

### 1. Add Knowledge Base Content

1. Go to **Admin → Knowledge Base**
2. Click **Add Document**
3. Enter content directly or paste a URL to scrape
4. Documents are automatically chunked and embedded

### 2. Test Your Chatbot

1. Go to **Admin → Test Chat**
2. Ask questions to test responses
3. View source citations for each answer
4. Toggle Strict Mode to see behavior differences

### 3. Embed on Your Website

1. Go to **Admin → Integrations**
2. Create or configure a widget
3. Copy the embed code:

```html
<script
  src="https://your-domain.com/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
></script>
```

4. Paste into your website's HTML

## Project Structure

```
chatfolio/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/         # Chat API endpoint
│   │   │   ├── documents/    # Document CRUD
│   │   │   └── widget/       # Widget config
│   │   ├── admin/
│   │   │   ├── knowledge/    # Document management
│   │   │   ├── test-chat/    # Test interface
│   │   │   └── integrations/ # Widget config
│   │   └── page.tsx          # Landing page
│   ├── components/           # React components
│   ├── lib/
│   │   ├── ai/               # Embedding & RAG
│   │   ├── db/               # Database utilities
│   │   └── supabase/         # Supabase client
│   └── types/                # TypeScript definitions
├── public/
│   └── widget.js             # Embeddable widget
└── supabase/
    └── migrations/           # Database schema
```

## API Endpoints

### POST /api/chat

Send a message and get a response.

```json
{
  "message": "What projects have you worked on?",
  "widgetKey": "your-widget-key",
  "sessionId": "optional-session-id"
}
```

### GET/POST /api/documents

List or create documents.

### GET/PUT/DELETE /api/widget/[key]

Manage widget configuration.

## Customization

### Widget Themes

- **Light**: Clean white background
- **Dark**: Sleek dark mode
- **Auto**: Matches user's system preference

### Widget Position

- Bottom Right (default)
- Bottom Left

### Colors

Customize the primary color to match your brand.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI (GPT-4o-mini, text-embedding-3-small)
- **Styling**: Custom CSS with CSS variables

## License

MIT
