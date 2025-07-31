# HOME-DRUG CONNECT Project Structure

## Root Directory Organization

```
home-drug-connect/
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── lib/                    # Utility functions and service clients
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── public/                 # Static assets
├── scripts/                # Build and utility scripts
├── supabase/              # Database migrations and schemas
├── docs/                   # Project documentation
└── .claude-specs/         # AI steering and specification documents
```

## Subdirectory Structures

### `/app` - Next.js App Router
```
app/
├── (auth)/                # Auth-related grouped routes
├── admin/                 # Admin dashboard pages
│   ├── layout.tsx        # Admin layout wrapper
│   ├── page.tsx          # Admin dashboard home
│   └── pharmacies/       # Pharmacy management
├── api/                   # API routes
│   ├── auth/             # Authentication endpoints
│   ├── admin/            # Admin-only endpoints
│   ├── inquiries/        # Inquiry management
│   ├── pharmacies/       # Pharmacy data endpoints
│   ├── stripe/           # Payment webhooks
│   └── test/             # Test/debug endpoints
├── dashboard/             # User dashboard
│   ├── analytics/        # Analytics pages
│   ├── inquiries/        # Inquiry management
│   ├── pharmacies/       # Pharmacy CRUD
│   └── subscription/     # Billing management
├── pharmacy/              # Public pharmacy pages
│   ├── [id]/            # Dynamic pharmacy profiles
│   ├── login/           # Pharmacy login
│   └── register/        # Pharmacy registration
├── search/               # Search functionality
├── layout.tsx           # Root layout
├── page.tsx             # Home page
└── globals.css          # Global styles
```

### `/components` - React Components
```
components/
├── auth/                  # Authentication components
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── dashboard/             # Dashboard-specific components
│   └── MobileNav.tsx
├── pharmacy/              # Pharmacy-related components
│   ├── PharmacyForm.tsx
│   └── InquiryForm.tsx
├── maps/                  # Map components
│   ├── GoogleMap.tsx
│   └── PharmacyMap.tsx
└── ui/                    # Generic UI components
    ├── Modal.tsx
    └── LoadingSpinner.tsx
```

### `/lib` - Utilities and Services
```
lib/
├── auth/                  # Authentication utilities
│   └── actions.ts        # Auth server actions
├── email/                 # Email service
│   ├── client.ts         # Resend client
│   └── notifications.ts  # Email templates
├── google-maps/           # Maps integration
│   └── geocoding.ts      # Geocoding utilities
├── stripe/                # Payment integration
│   ├── client.ts         # Stripe client
│   ├── config.ts         # Stripe configuration
│   └── subscription.ts   # Subscription logic
├── supabase/              # Database clients
│   ├── client.ts         # Browser client
│   └── server.ts         # Server client
└── utils/                 # General utilities
```

## Code Organization Patterns

### Page Components
- Server Components by default for better performance
- Client Components marked with `'use client'` when needed
- Dynamic routes use bracket notation `[id]`
- Route groups use parentheses `(auth)`

### API Routes
- RESTful naming conventions
- Request handlers export named functions (GET, POST, etc.)
- Consistent error handling and response formats
- Authentication checks at route level

### Component Structure
- Functional components with TypeScript
- Props interfaces defined inline or in types/
- Hooks for state and side effects
- Server actions for form submissions

## File Naming Conventions

### General Rules
- **Components**: PascalCase (e.g., `PharmacyForm.tsx`)
- **Pages**: lowercase with hyphens (e.g., `page.tsx`, `not-found.tsx`)
- **API Routes**: lowercase with hyphens (e.g., `route.ts`)
- **Utilities**: camelCase (e.g., `geocoding.ts`)
- **Types**: PascalCase with `.ts` extension (e.g., `Database.ts`)

### Special Files
- `layout.tsx`: Layout wrapper for route segment
- `page.tsx`: Page component for route
- `loading.tsx`: Loading UI
- `error.tsx`: Error boundary
- `route.ts`: API route handler

## Import Organization

### Import Order
1. External packages (React, Next.js, etc.)
2. Internal aliases (`@/components`, `@/lib`)
3. Relative imports (`./`, `../`)
4. Type imports (`import type`)

### Example:
```typescript
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PharmacyForm } from '@/components/pharmacy/PharmacyForm'
import { validatePharmacy } from './utils'
import type { Pharmacy } from '@/types/database'
```

## Key Architectural Principles

### 1. Server-First Approach
- Leverage Server Components for data fetching
- Minimize client-side JavaScript bundle
- Use Server Actions for mutations

### 2. Type Safety
- Strict TypeScript configuration
- Generated types from Supabase schema
- Comprehensive type coverage

### 3. Security by Design
- Authentication checks in middleware
- Row Level Security in database
- Environment variables for secrets
- Input validation and sanitization

### 4. Performance Optimization
- Static generation where possible
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- Efficient database queries

### 5. Maintainability
- Clear separation of concerns
- Reusable component library
- Consistent naming and structure
- Comprehensive documentation