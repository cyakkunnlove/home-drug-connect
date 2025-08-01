# HOME-DRUG CONNECT Project Structure

## Root Directory Organization
```
home-drug-connect/
├── app/                    # Next.js 15 App Router pages and API routes
├── components/             # Reusable React components
├── lib/                    # Utility functions and service clients
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── public/                 # Static assets
├── supabase/              # Database migrations and configurations
├── scripts/               # Development and deployment scripts
├── docs/                  # Project documentation
└── .claude-specs/         # AI steering and specifications
```

## Subdirectory Structures

### `/app` - Next.js App Router
```
app/
├── (public)/              # Unauthenticated routes group
│   └── doctor/           
│       ├── login/        # Doctor login page
│       └── register/     # Doctor registration
├── api/                   # API routes
│   ├── auth/             # Authentication endpoints
│   ├── pharmacies/       # Pharmacy CRUD operations
│   ├── requests/         # Medical request management
│   ├── responses/        # Pharmacy responses
│   ├── inquiries/        # Direct messaging
│   ├── stripe/           # Payment webhooks
│   └── admin/            # Admin-only endpoints
├── dashboard/             # Authenticated pharmacy dashboard
├── doctor/               # Doctor portal
├── admin/                # System admin interface
├── search/               # Public search interface
├── pharmacy/             # Public pharmacy profiles
│   └── [id]/            # Dynamic pharmacy pages
├── login/                # General login
├── layout.tsx            # Root layout
├── page.tsx              # Homepage
└── globals.css           # Global styles
```

### `/components` - UI Components
```
components/
├── auth/                  # Authentication forms
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── DoctorRegisterForm.tsx
├── dashboard/             # Dashboard-specific components
│   └── MobileNav.tsx
├── doctor/               # Doctor portal components
│   ├── RequestForm.tsx
│   └── DrugAutocomplete.tsx
├── pharmacy/             # Pharmacy management
│   ├── PharmacyForm.tsx
│   ├── RequestList.tsx
│   ├── ResponseForm.tsx
│   └── InquiryForm.tsx
├── maps/                 # Map components
│   ├── GoogleMap.tsx
│   └── PharmacyMap.tsx
├── layout/               # Layout components
│   ├── Header.tsx
│   └── AuthenticatedHeader.tsx
├── ui/                   # Generic UI components
│   ├── Modal.tsx
│   ├── LoadingSpinner.tsx
│   └── TouchFeedback.tsx
└── settings/             # Settings components
    └── DeleteAccountSection.tsx
```

### `/lib` - Core Libraries
```
lib/
├── supabase/             # Supabase client configuration
│   ├── client.ts        # Client-side instance
│   ├── server.ts        # Server-side instance
│   └── pool.ts          # Connection pooling
├── auth/                 # Authentication utilities
│   └── actions.ts       # Server actions
├── stripe/               # Stripe integration
│   ├── client.ts
│   ├── config.ts
│   └── subscription.ts
├── google-maps/          # Maps integration
│   └── geocoding.ts
├── email/                # Email service
│   ├── client.ts
│   ├── notifications.ts
│   └── templates/
├── cache/                # Caching utilities
│   ├── redis.ts
│   └── integration.ts
├── monitoring/           # Performance monitoring
│   └── performance.ts
├── rate-limit/           # API rate limiting
│   └── index.ts
├── state/                # State management
│   └── search-store.ts
└── utils/                # General utilities
```

### `/types` - TypeScript Definitions
```
types/
├── database.ts           # Database schema types
└── supabase.ts          # Auto-generated Supabase types
```

### `/supabase` - Database Configuration
```
supabase/
└── migrations/           # SQL migration files
    ├── 001_initial_schema.sql
    ├── 002_analytics_functions.sql
    ├── 003_doctor_features.sql
    ├── 004_performance_indexes.sql
    └── 009_fix_registration_issues.sql
```

## Code Organization Patterns

### Component Structure
- **Presentational Components**: Pure UI components in `/components/ui`
- **Feature Components**: Business logic components organized by feature
- **Page Components**: Top-level route components in `/app`

### API Route Pattern
```typescript
// Standard API route structure
export async function GET(request: Request) { }
export async function POST(request: Request) { }
export async function PUT(request: Request, { params }: { params: { id: string } }) { }
export async function DELETE(request: Request, { params }: { params: { id: string } }) { }
```

### Service Layer Pattern
- Database queries isolated in service modules
- External API integrations wrapped in client libraries
- Business logic separated from route handlers

## File Naming Conventions

### Components
- **PascalCase**: Component files (e.g., `PharmacyForm.tsx`)
- **Index files**: For component directories (e.g., `components/auth/index.ts`)

### Pages & Routes
- **kebab-case**: Route segments (e.g., `forgot-password/page.tsx`)
- **Brackets**: Dynamic routes (e.g., `[id]/page.tsx`)
- **Parentheses**: Route groups (e.g., `(public)/`)

### Utilities & Hooks
- **camelCase**: Utility functions (e.g., `geocodeAddress.ts`)
- **use prefix**: Custom hooks (e.g., `usePharmacySearch.ts`)

### Database & Migrations
- **snake_case**: Database tables and columns
- **Numbered prefix**: Migration files (e.g., `001_initial_schema.sql`)

## Import Organization
```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// 3. Internal absolute imports
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

// 4. Relative imports
import { PharmacyCard } from './PharmacyCard'

// 5. Type imports
import type { Database } from '@/types/supabase'
```

## Key Architectural Principles

### 1. Server-First Approach
- Prefer Server Components for data fetching
- Use Client Components only when necessary (interactivity)
- Implement Server Actions for mutations

### 2. Type Safety
- Full TypeScript coverage
- Generated types from Supabase schema
- Zod validation for runtime safety

### 3. Security by Default
- Row Level Security (RLS) on all tables
- API routes check authentication
- Input validation at all boundaries

### 4. Performance Optimization
- Static generation where possible
- Dynamic imports for code splitting
- Optimistic UI updates

### 5. Mobile-First Design
- Responsive components by default
- Touch-optimized interactions
- Progressive Web App capabilities

### 6. Separation of Concerns
- Business logic in services
- UI logic in components
- Data access in dedicated modules

### 7. Error Handling
- Graceful degradation
- User-friendly error messages
- Proper error boundaries

### 8. Testing Strategy
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical user flows
EOF < /dev/null