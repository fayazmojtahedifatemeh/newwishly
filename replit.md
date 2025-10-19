# Wishly - Universal Shopping Wishlist & Price Tracker

## Overview
Wishly is a comprehensive shopping wishlist and price tracker application that consolidates items from any online store, monitors their prices over time, and helps users shop intelligently with AI-powered features.

## Core Features (MVP)
- **Multi-scraper Architecture**: Specialized scrapers for Shopify, Zara, H&M with universal fallback
- **Item Management**: Add items via URL or image search using Google Lens
- **Price Tracking**: Automatic price history with visual graphs showing 3-month trends
- **Activity Feed**: Real-time updates on price changes with visual indicators
- **Custom Lists**: Organize items by categories with matching icons
- **Theme System**: 6 beautiful pastel themes (3 light + 3 dark)
- **Size & Color Selection**: Full product variant support
- **AI Auto-Categorization**: Gemini-powered automatic list suggestions
- **CSV Import**: Bulk import with automatic categorization
- **Status Tracking**: Proper handling of pending/processed/failed states
- **Find Similar**: Google Lens integration for product discovery

## Project Architecture

### Frontend (React + TypeScript)
- **Theme System**: 6 pastel themes with seamless switching
  - Light: Lavender Dreams, Mint Fresh, Peach Soft
  - Dark: Midnight Slate, Forest Deep, Plum Night
- **Components**:
  - AppSidebar: Navigation with category-specific icons
  - ItemCard: Product cards with price badges and status indicators
  - ActivityFeed: Timeline of recent price changes
  - AddItemModal: Dual-tab interface for URL and image-based adding
  - ThemeSelector: Dropdown theme switcher
  - Item Detail: Full product view with gallery, selectors, and price history
- **Pages**:
  - Home: Main dashboard with all items and activity feed
  - ItemDetail: Individual item view with variants and history
  - ListView: Category-filtered item grid

### Backend (Express + TypeScript)
- **Storage Layer**: In-memory storage with full CRUD operations
- **Data Models**:
  - Items: Product information with scraping status
  - Lists: User-created categories
  - PriceHistory: Time-series price data
  - ScraperJobs: Background job queue
  - ActivityEvents: Price change tracking
  - UserPreferences: Theme and settings

### Future Enhancements
- PostgreSQL database for persistence
- Background worker queue with Bull
- Scraper factory with platform-specific implementations
- Chrome extension for one-click adding
- Goals/budget tracking system
- Comparison shopping features

## Technical Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Shadcn UI, Recharts
- **Backend**: Express.js, Drizzle ORM (schema-only for now)
- **AI**: Gemini 2.5 for categorization and image search
- **Styling**: Tailwind CSS with custom pastel themes
- **Icons**: Lucide React with category-specific mappings

## Development Notes
- Price formatting: Always hide .00 decimals
- Theme persistence: localStorage with data-theme attribute
- Icon mapping: Automatic category-to-icon conversion
- All interactive elements have proper test IDs
- Responsive design with mobile-first approach

## Recent Changes (October 19, 2025)
- Created complete data schema for all models
- Implemented 6-theme system with pastel colors
- Built all core React components (sidebar, cards, modals, pages)
- Set up theme provider with localStorage persistence
- Created comprehensive utility functions for price formatting and time calculations
- Established storage interface for backend operations
