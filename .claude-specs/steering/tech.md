# HOME-DRUG CONNECT Technology Stack

## Architecture
- **Type**: Full-stack monolithic application with serverless functions
- **Deployment Model**: JAMstack architecture on Vercel
- **Database**: Hosted PostgreSQL with PostGIS extension (Supabase)
- **API Pattern**: Next.js API routes + Supabase client SDK
- **Real-time**: Supabase Realtime subscriptions (when needed)

## Frontend
### Core Framework
- **Next.js 15**: React-based framework with App Router
- **React 19**: UI library with Server Components
- **TypeScript**: Type-safe development

### UI & Styling
- **Tailwind CSS v4**: Utility-first CSS framework
- **Lucide Icons**: Consistent icon library
- **Radix UI**: Accessible component primitives (planned)

### State Management
- **React Context API**: Global state management
- **Zustand**: For complex client state (search filters)
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Build & Development
- **Turbopack**: Fast development builds
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Backend
### API Layer
- **Next.js API Routes**: Serverless functions on Vercel
- **Supabase SDK**: Database and auth client
- **Edge Runtime**: For performance-critical endpoints

### Database
- **PostgreSQL 15**: Primary database (via Supabase)
- **PostGIS**: Geospatial queries for location-based search
- **Row Level Security (RLS)**: Fine-grained access control

### External Services
- **Supabase Auth**: Authentication and user management
- **Stripe**: Payment processing and subscriptions
- **Google Maps API**: Geocoding and map display
- **Resend**: Transactional email delivery
- **OpenAI API**: AI-powered document generation for medical requests

### Caching & Performance
- **Vercel Edge Cache**: CDN and edge caching
- **Database Indexes**: Optimized query performance
- **React Suspense**: Progressive rendering

## Development Environment
### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Local Setup
```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Required Tools
- **Node.js 18+**: JavaScript runtime
- **npm/yarn**: Package manager
- **Git**: Version control
- **Supabase CLI** (optional): Local development
- **Vercel CLI** (optional): Deployment testing

## Common Commands
```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed test data

# Testing
npm run test         # Run test suite
npm run test:e2e     # Run E2E tests

# Deployment
vercel               # Deploy preview
vercel --prod        # Deploy to production
```

## Environment Variables
### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# AI Integration
OPENAI_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=
```

### Development Variables
```env
# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
```

## Port Configuration
- **3000**: Next.js development server
- **3001**: Supabase Studio (local)
- **54321**: Supabase API (local)
- **54322**: Supabase Database (local)

## API Endpoints
### Public Routes
- `/api/pharmacies/search`: Search pharmacies
- `/api/auth/login`: User authentication
- `/api/contact`: Public contact form

### Protected Routes
- `/api/requests/*`: Medical requests management
- `/api/responses/*`: Pharmacy responses
- `/api/inquiries/*`: Direct inquiries
- `/api/admin/*`: Admin operations

### Webhook Endpoints
- `/api/stripe/webhook`: Stripe payment events

## Performance Targets
- **Initial Load**: < 2s on 3G
- **API Response**: < 500ms p95
- **Search Results**: < 1s including geocoding
- **Lighthouse Score**: > 90 for all metrics
EOF < /dev/null