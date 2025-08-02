# HOME-DRUG CONNECT Technology Stack

## Architecture

### System Design
- **Type**: Monolithic Next.js application with serverless architecture
- **Deployment Model**: JAMstack on Vercel with external services
- **API Design**: RESTful API using Next.js App Router API routes
- **Database Architecture**: PostgreSQL with Row Level Security (RLS)
- **Real-time Features**: Supabase Realtime subscriptions

### Infrastructure Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client (PWA)  │────▶│  Vercel Edge    │────▶│   Supabase      │
│  React + Next   │     │  (Next.js 15)   │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    External Services    │
                    ├──────────────────────────┤
                    │ • Google Maps API       │
                    │ • OpenAI API            │
                    │ • Stripe Payment        │
                    │ • Resend Email          │
                    └──────────────────────────┘
```

## Frontend

### Core Framework
- **Next.js 15.4.5** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.x** - Type safety with strict mode enabled

### Styling & UI
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **Framer Motion 12.x** - Animation library
- **Lucide React** - Icon library
- **Custom iOS-style components** - TouchFeedback, IOSButton, etc.

### State Management
- **Zustand 5.0.7** - Global state management
- **React Context API** - Component-level state
- **React Hook Form** - Form state (minimal usage, prefer native forms)

### Performance & Optimization
- **Turbopack** - Next.js bundler for development
- **React Server Components** - Default for all components
- **Dynamic imports** - Code splitting for large components
- **Next/Image** - Optimized image loading
- **Web Vitals** - Performance monitoring

## Backend

### Runtime & Framework
- **Node.js 18+** - JavaScript runtime
- **Vercel Edge Runtime** - Serverless functions
- **Next.js API Routes** - RESTful API endpoints

### Database & ORM
- **Supabase** - PostgreSQL 15 as a service
- **Supabase Client** - Type-safe database queries
- **Row Level Security** - Database-level authorization
- **PostGIS** - Geospatial queries for pharmacy search

### Authentication & Authorization
- **Supabase Auth** - JWT-based authentication
- **Role-Based Access Control** - doctor, pharmacy_admin, admin roles
- **httpOnly Cookies** - Secure session management

### External Services Integration
- **OpenAI API** - GPT-4o-mini for AI document generation and text refinement
- **Google Maps API** - Geocoding and map visualization
- **Stripe API** - Subscription payment processing
- **Resend API** - Transactional email delivery

## Development Environment

### Required Tools
```bash
# Core requirements
Node.js 18.x or higher
npm 9.x or higher
Git

# Recommended IDE
Visual Studio Code with extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
```

### Local Development Setup
```bash
# Clone repository
git clone <repository-url>
cd home-drug-connect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Common Commands
```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Database
npm run db:migrate   # Run Supabase migrations
npm run db:reset     # Reset database

# Drug Data Management
npm run import:drugs     # Import drug data from Excel
npm run generate:drugs   # Generate static JSON files
npm run etl:drugs       # Full ETL process

# Testing & Debugging
npm run create:test-account  # Create test accounts
npm run verify:flow         # Verify user flows
```

## Environment Variables

### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (server-side only)

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Maps JavaScript API key

# Stripe Payment
STRIPE_SECRET_KEY=                  # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Stripe publishable key
STRIPE_WEBHOOK_SECRET=              # Webhook endpoint secret
STRIPE_SUBSCRIPTION_PRICE_ID=       # Subscription price ID

# OpenAI
OPENAI_API_KEY=                     # OpenAI API key

# Email Service
RESEND_API_KEY=                     # Resend API key
EMAIL_FROM=                         # Sender email address

# Application
NEXT_PUBLIC_APP_URL=                # Production URL
```

### Development vs Production
- Development: Use `.env.local` file
- Production: Set in Vercel dashboard
- Never commit `.env` files to Git

## Port Configuration

### Default Ports
```bash
3000  # Next.js development server
54321 # Supabase local PostgreSQL
54322 # Supabase local Studio
```

### Production URLs
- Application: `https://home-drug-connect.vercel.app`
- API: Same domain with `/api/*` routes
- Supabase: `https://<project-id>.supabase.co`

## Build & Deployment

### Build Process
1. **Pre-build**: Generate static drug JSON files
2. **Build**: Next.js production build with TypeScript compilation
3. **Post-build**: Critters for critical CSS extraction

### Deployment Pipeline
- **Platform**: Vercel
- **Branch Strategy**: 
  - `main` → Production
  - Pull requests → Preview deployments
- **Environment Variables**: Managed in Vercel dashboard
- **Edge Functions**: Automatic deployment to Vercel Edge Network

### Performance Optimizations
- **Static Generation**: For public pages
- **Incremental Static Regeneration**: For pharmacy profiles
- **Edge Caching**: API responses cached at edge
- **Image Optimization**: Automatic via Next.js
- **Font Optimization**: Geist font via next/font