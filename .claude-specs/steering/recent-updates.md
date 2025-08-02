# Recent Platform Updates

## Overview
This document tracks recent significant updates to the HOME-DRUG CONNECT platform to maintain context awareness for development and support.

## Latest Updates (2025年8月)

### 1. 在宅対応薬局 Terminology Unification
- **What**: Updated all references from generic "薬局" to specific "在宅対応薬局" throughout the platform
- **Why**: Clearly communicate the platform's focus on home-visit pharmacies
- **Impact**: Better user understanding and SEO for target audience

### 2. AI Document Generation Feature
- **What**: Added AI-powered request document generation for medical institutions
- **Technology**: OpenAI GPT-4o-mini integration
- **Benefits**: 
  - Reduced administrative burden
  - Consistent document quality
  - Faster request creation
  - Fewer errors in communication

### 3. Enhanced Map Markers
- **What**: Improved pharmacy map markers to show multiple features
- **Visual**: Pin-style markers with text indicators (24, C, N)
- **Legend**:
  - 24: 24時間対応 (24-hour support)
  - C: クリーンルーム有 (Has clean room)
  - N: 麻薬取扱可 (Handles narcotics)

### 4. Modernized Pharmacy Detail Pages
- **Design**: Gradient backgrounds, card-based layouts
- **Improvements**:
  - Better visual hierarchy
  - Mobile-responsive design
  - Clear feature indicators
  - Professional appearance

### 5. Pharmacy Website Integration
- **Database**: Added `website_url` field to pharmacies table
- **UI**: "公式サイト" button links to pharmacy websites
- **Behavior**: Button hidden if no website is set
- **Forms**: Added URL input field in pharmacy management

### 6. Security Enhancements
- **Google Maps API**: HTTP referrer restrictions recommended
- **Database Access**: Confirmed server-side only access pattern
- **RLS Policies**: Maintained for all database operations

## Migration Notes
- Database migration required for `website_url` field
- No breaking changes to existing functionality
- All updates backward compatible

## Deployment Considerations
- Manual deployment may be needed if GitHub auto-deploy fails
- Use `vercel --prod` for production deployment
- Check build logs for TypeScript or build errors