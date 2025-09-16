# Signals - Competitive Intelligence Tracking System

A fullstack competitive intelligence radar that monitors vendor pricing, product updates, and market signals using AI-powered web crawling.

## 🎯 Overview

Signals is a comprehensive competitive intelligence platform that helps you track competitors' pricing changes, product updates, security announcements, and market movements. Built with Next.js frontend and FastAPI backend, it integrates with the Exa API for intelligent web crawling and content analysis.

## ✨ Features

### 🔍 **Watchlist (Vendors)**
- Monitor specific vendor pages (pricing, release notes, security)
- Automated crawling with configurable schedules
- Diff detection for pricing and feature changes
- Real-time alerts for significant updates

### 📊 **Company Tear-Sheets**
- One-page company briefs with AI-generated summaries
- Funding information and hiring signals
- Product updates and key customer insights
- Cited sources with confidence scoring

### 🚨 **Signals & Alerts**
- Centralized inbox for detected changes
- Severity-based filtering (High/Medium/Low)
- Automated notifications via Slack/Email
- Integration with CRM systems

### 📈 **Reports**
- Weekly competitive intelligence summaries
- Exportable formats (PDF/Markdown/Notion)
- Portfolio and segment-based grouping
- Cost tracking and coverage metrics

### 🔧 **Sources & Settings**
- Domain and path management
- Content quality filters
- API budget controls
- Integration configurations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.12+ and Poetry
- Exa API key ([Get one here](https://exa.ai))

### Backend Setup

```bash
cd backend
poetry install
cp .env.example .env
# Add your EXA_API_KEY to .env
poetry run fastapi dev app/main.py
```

The backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui components
- TanStack Query for state management

**Backend:**
- FastAPI with Python 3.12
- Pydantic for data validation
- In-memory database (development)
- Async HTTP client for Exa API

**External APIs:**
- [Exa API](https://exa.ai) for web search and content retrieval
- Support for webhook integrations

### Project Structure

```
signals-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Pydantic models
│   │   ├── database.py      # In-memory database
│   │   └── exa_client.py    # Exa API integration
│   ├── pyproject.toml       # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main application
│   │   └── lib/             # Utilities
│   ├── package.json         # Node dependencies
│   └── .env                 # Environment variables
└── README.md
```

## 🔌 API Documentation

### Core Endpoints

#### Vendors
- `POST /vendors/watch` - Add vendor to watchlist
- `GET /vendors` - List all vendors
- `GET /vendors/{id}` - Get vendor details

#### Watchlist
- `POST /run/watchlist` - Execute crawl for all/specific vendors
- `GET /signals` - List detected signals

#### Tear-Sheets
- `GET /tearsheet/{company_id}` - Generate company brief

#### Reports
- `POST /reports/weekly` - Generate weekly report
- `GET /reports` - List all reports

### Exa API Integration

The application leverages Exa's powerful search and content retrieval capabilities:

**Search with Domain Filtering:**
```json
{
  "query": "pricing updates",
  "includeDomains": ["stripe.com/pricing", "stripe.com/release-notes"],
  "startPublishedDate": "2024-01-01T00:00:00.000Z",
  "numResults": 25
}
```

**Content Retrieval with Structured Summaries:**
```json
{
  "ids": ["https://stripe.com/pricing"],
  "livecrawl": "preferred",
  "summary": {
    "query": "Extract pricing table and plan features",
    "schema": { /* JSON Schema for structured data */ }
  }
}
```

**AI-Powered Answers with Citations:**
```json
{
  "query": "Summarize company overview, funding, and recent updates",
  "urls": ["https://company.com/about", "https://company.com/blog"],
  "text": true
}
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
EXA_API_KEY=your_exa_api_key_here
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000
```

### Exa API Features Used

- **Search**: Domain/path filtering, date ranges, content categories
- **Contents**: Live crawling, structured summaries, subpage discovery
- **Answer**: Cited AI responses with source attribution
- **Cost Control**: Budget limits and usage tracking

## 📊 Usage Examples

### Adding a Vendor

```bash
curl -X POST "http://localhost:8000/vendors/watch" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe",
    "domains": ["stripe.com"],
    "include_paths": ["/pricing", "/release-notes", "/security"]
  }'
```

### Running Watchlist

```bash
curl -X POST "http://localhost:8000/run/watchlist"
```

### Generating Tear-Sheet

```bash
curl "http://localhost:8000/tearsheet/1"
```

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) for consistent, accessible design:

- **Navigation**: Tabbed interface with 6 main sections
- **Data Tables**: Sortable, filterable vendor and signal lists
- **Forms**: Modal dialogs for adding vendors and generating reports
- **Cards**: Information display with badges and status indicators
- **Charts**: Visual representation of trends and metrics

## 🔍 Key Features in Detail

### Pricing Diff Detection
- Automated comparison of pricing pages
- Percentage change calculations
- Plan feature additions/removals
- Historical pricing trends

### Signal Classification
- **Pricing Changes**: Plan updates, feature gating modifications
- **Product Updates**: New releases, feature announcements
- **Security Updates**: Compliance changes, security page updates
- **Hiring Signals**: Key role postings, team expansion indicators

### Citation System
- Every claim backed by source URLs
- Confidence scoring for AI-generated insights
- Link preservation for manual verification
- Source quality assessment

## 🚀 Deployment

### Backend (FastAPI)
```bash
# Using the deployment command
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

### Frontend (React)
```bash
npm run build
# Serve the dist/ directory
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🔗 Links

- [Exa API Documentation](https://docs.exa.ai/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📞 Support

For questions and support, please contact the development team.

---

**Built with ❤️ using Exa AI for intelligent web crawling**
