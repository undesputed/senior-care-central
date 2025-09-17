# Senior Care Central

## Project Overview
A mobile-first, AI-enabled care placement platform that connects families with senior care agencies, addressing the opaque referral marketplace problem.

## Problem Statement
Current senior-care referral marketplaces profit from opaque, lead-generation tactics rather than successful care matches. Families receive a flood of calls with little decision support and no price transparency; agencies pay high per-lead fees ($58 each) for incomplete, non-qualified referrals.

## Solution
AI-driven care placement platform with dual-access system for families and agencies, providing transparent matching, streamlined communication, and performance tracking.

## Tech Stack
- **Frontend**: Next.js (TypeScript, App Router, no src/)
- **UI Framework**: Shadcn/ui with Tailwind CSS
- **Database & Auth**: Supabase
- **Chat**: GetStream
- **AI**: OpenAI for matching algorithms
- **Payments**: Stripe (10% platform fee)
- **Maps**: Google Maps & Places API

## Key Features

### Family/Client Side
- Google/Email signup with guided onboarding
- AI-driven care type suggestions and provider matching
- Searchable provider directory with map integration
- Secure in-app messaging with agencies
- Tour scheduling and contract management
- Integrated payments with 10% platform fee

### Agency/Provider Side
- Verified account creation and service offerings
- AI-matched client referrals based on capabilities
- Self-identified service taxonomy for specialty alignment
- Referral lead management and conversation tools
- Contract creation and payment tracking
- Performance dashboard with sales insights

## Development Approach
- Mobile-first responsive design
- Role-based access control (RBAC)
- Vertical slice development (backend + UI simultaneously)
- Small, semantic commits with atomic changes
