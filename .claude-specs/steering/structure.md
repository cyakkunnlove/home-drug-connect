# HOME-DRUG CONNECT Project Structure

## Root Directory Organization

```
home-drug-connect/
├── app/                    # Next.js App Router (pages, layouts, API routes)
├── components/             # Reusable React components
├── lib/                    # Utilities, helpers, and service integrations
├── types/                  # TypeScript type definitions
├── public/                 # Static assets and generated files
├── scripts/                # Build and maintenance scripts
├── supabase/              # Database migrations and configuration
├── docs/                   # Project documentation
├── .claude-specs/         # Kiro spec-driven development files
└── [config files]         # Configuration files at root level
```

## Subdirectory Structures

### `/app` - Next.js App Router
```
app/
├── (public)/              # Route group for public pages
├── admin/                 # Admin dashboard routes
├── api/                   # API endpoints
│   ├── auth/             # Authentication endpoints
│   ├── ai/               # AI integration endpoints
│   ├── drugs/            # Drug search endpoints
│   └── [resource]/       # RESTful resource endpoints
├── dashboard/             # Pharmacy dashboard routes
├── doctor/                # Doctor portal routes
├── pharmacy/              # Individual pharmacy pages
├── auth/                  # Authentication pages
├── search/                # Search functionality
├── globals.css           # Global styles
├── layout.tsx            # Root layout
└── page.tsx              # Homepage
```

### `/components` - Component Organization
```
components/
├── auth/                  # Authentication-related components
├── dashboard/             # Dashboard-specific components
├── doctor/                # Doctor portal components
├── forms/                 # Reusable form components
├── layout/                # Layout components (Header, Footer, etc.)
├── maps/                  # Google Maps integration components
├── pharmacy/              # Pharmacy-related components
├── search/                # Search interface components
├── settings/              # Settings page components
└── ui/                    # Generic UI components
    ├── AnimatedPage.tsx   # Page transition wrapper
    ├── TouchFeedback.tsx  # iOS-style touch interactions
    ├── IOSButton.tsx      # iOS-style button
    └── Modal.tsx          # Modal dialog component
```

### `/lib` - Library Code
```
lib/
├── auth/                  # Authentication utilities
│   └── actions.ts        # Server actions for auth
├── email/                 # Email service integration
│   ├── client.ts         # Resend client setup
│   └── templates/        # Email HTML templates
├── google-maps/           # Google Maps utilities
├── monitoring/            # Performance monitoring
├── stripe/                # Stripe payment integration
├── supabase/              # Database client configuration
│   ├── client.ts         # Browser client
│   └── server.ts         # Server client
└── utils/                 # General utilities
```

## Code Organization Patterns

### Component Structure
- **Server Components**: Default for all components
- **Client Components**: Explicitly marked with `'use client'`
- **Component Files**: PascalCase naming (e.g., `RequestForm.tsx`)
- **Utility Files**: camelCase naming (e.g., `formatDate.ts`)

### Route Organization
- **Route Groups**: Used for logical grouping without URL impact
- **Dynamic Routes**: Square brackets for parameters `[id]`
- **Route Handlers**: `route.ts` files for API endpoints
- **Layouts**: Nested layouts for shared UI structure

### API Structure
```typescript
// Standard API route pattern
export async function GET(request: NextRequest) { }
export async function POST(request: NextRequest) { }
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) { }
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { }
```

## File Naming Conventions

### TypeScript/JavaScript Files
- **Components**: `PascalCase.tsx` (e.g., `PharmacyCard.tsx`)
- **Hooks**: `use` prefix with camelCase (e.g., `usePharmacySearch.ts`)
- **Utilities**: camelCase (e.g., `calculateDistance.ts`)
- **Constants**: UPPER_SNAKE_CASE in files (e.g., `MAX_SEARCH_RADIUS`)
- **Types**: PascalCase for interfaces/types (e.g., `PharmacyData`)

### Route Files
- **Pages**: `page.tsx` for route pages
- **Layouts**: `layout.tsx` for route layouts
- **API Routes**: `route.ts` for API endpoints
- **Loading**: `loading.tsx` for loading states
- **Error**: `error.tsx` for error boundaries

### Database Files
- **Migrations**: `xxx_description.sql` (e.g., `001_initial_schema.sql`)
- **Types**: Generated in `types/database.ts`

## Import Organization

### Standard Import Order
```typescript
// 1. React and Next.js imports
import { useState, useEffect } from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. External library imports
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// 3. Internal absolute imports
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/hooks'

// 4. Relative imports
import { formatPharmacyData } from './utils'

// 5. Type imports
import type { Database } from '@/types/database'
```

### Path Aliases
- `@/*` maps to project root
- Used for clean imports: `@/components/...`, `@/lib/...`

## Key Architectural Principles

### 1. **Server-First Architecture**
- Server Components by default
- Client Components only when needed (forms, interactivity)
- Server Actions for mutations

### 2. **Type Safety**
- Strict TypeScript configuration
- Generated types from Supabase schema
- Zod validation for runtime type checking

### 3. **Performance Optimization**
- Static generation where possible
- Dynamic imports for code splitting
- Optimistic UI updates
- Edge function deployment

### 4. **Security by Design**
- Row Level Security (RLS) at database level
- Server-side authentication checks
- Environment variable separation
- Input validation and sanitization

### 5. **Mobile-First Responsive Design**
- iOS-style interactions and animations
- Touch-optimized UI components
- Progressive Web App capabilities
- Responsive breakpoints: mobile → tablet → desktop

### 6. **Modular Service Integration**
- Separate client modules for each service
- Clear separation of concerns
- Dependency injection pattern
- Testable service interfaces

## Development Patterns

### State Management
```typescript
// Global state with Zustand
const useSearchStore = create<SearchState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
}))

// Local state with React hooks
const [isLoading, setIsLoading] = useState(false)
```

### Error Handling
```typescript
// Consistent error response format
try {
  // operation
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'ERROR_CODE', message: 'User-friendly message' } },
    { status: 400 }
  )
}
```

### Data Fetching
```typescript
// Server Components - Direct database access
const pharmacy = await supabase.from('pharmacies').select('*').single()

// Client Components - API routes
const response = await fetch('/api/pharmacies/search')
const data = await response.json()
```