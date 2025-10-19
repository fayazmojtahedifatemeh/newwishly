# Design Guidelines: Universal Shopping Wishlist & Price Tracker

## Design Approach

**Selected Framework**: Material Design + E-commerce Dashboard Hybrid

Drawing inspiration from Shopify Admin's clean data presentation, Linear's refined typography, and Notion's flexible organization system. This creates a professional, information-dense interface that remains visually appealing when showcasing product imagery.

**Core Principles**:
- Data clarity over decoration
- Scannable information hierarchy
- Delightful micro-interactions for status changes
- Consistent spacing rhythm for cognitive ease

---

## Color Palette

### Theme System Architecture
Implement 6 total themes (3 light, 3 dark) with pastel-forward palettes:

**Light Themes**:
1. **Lavender Dreams**: 270 35% 96% background, 270 60% 65% primary, 340 50% 70% accent
2. **Mint Fresh**: 150 30% 96% background, 150 50% 60% primary, 200 45% 65% accent
3. **Peach Soft**: 20 35% 96% background, 15 55% 65% primary, 340 50% 70% accent

**Dark Themes**:
1. **Midnight Slate**: 220 15% 12% background, 220 60% 65% primary, 270 50% 70% accent
2. **Forest Deep**: 150 12% 12% background, 150 55% 60% primary, 180 45% 65% accent
3. **Plum Night**: 280 18% 12% background, 280 60% 65% primary, 320 50% 70% accent

**Functional Colors** (consistent across themes):
- Success (price drop): 142 70% 45%
- Error (price rise/dead link): 0 65% 55%
- Warning: 38 90% 50%
- Info: 200 90% 45%

**Text Contrast**:
- Light themes: 220 10% 15% primary text, 220 8% 45% secondary
- Dark themes: 220 10% 95% primary text, 220 8% 70% secondary

---

## Typography

**Font Stack**: 
- Primary: 'Inter' via Google Fonts CDN
- Monospace: 'JetBrains Mono' for prices and data

**Scale**:
- Hero/Dashboard Title: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body: text-base (16px)
- Price Display: text-xl font-mono font-bold
- Metadata: text-sm text-secondary (14px)
- Tiny Labels: text-xs (12px)

**Price Formatting Rule**: Always hide .00 decimals (show $45 not $45.00)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (icons, badges): p-2, gap-2
- Component padding: p-4, p-6
- Section spacing: py-8, py-12, py-16
- Page margins: px-6 md:px-12

**Grid System**:
- Dashboard: Sidebar (w-64) + Main content (flex-1)
- Item Cards: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
- Detail Pages: Two-column max-w-7xl (images left, info right)

**Responsive Breakpoints**: Follow Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

---

## Component Library

### Navigation
**Sidebar Navigation**:
- Fixed left sidebar with custom list categories
- Each list shows count badge (rounded-full bg-primary/10 text-xs px-2)
- Active state: bg-primary/10 border-l-2 border-primary
- Category icons positioned left of text (w-5 h-5)

**Top Bar**:
- Add Item button (primary CTA, top-right)
- Global "Update All Prices" button with refresh icon
- Theme switcher dropdown
- Search bar (centered, w-96 max-w-full)

### Cards & Lists
**Item Card** (in grid view):
- Product image with 4:5 aspect ratio
- Price badge (top-right overlay, glass morphism effect)
- Title (truncate after 2 lines)
- Size/color indicators as small badges below
- Hover: subtle lift shadow-lg transform scale-105

**Activity Feed Items**:
- Timeline layout with connecting vertical line
- Price change indicator: green ▼ or red ▲ with percentage
- Timestamp (relative: "2 hours ago")
- Item thumbnail (48x48 rounded)

### Detail Pages
**Image Gallery**:
- Main image viewer (aspect-ratio-square lg:aspect-ratio-4/5)
- Thumbnail strip below (gap-2, scrollable horizontal)
- Lightbox on click

**Size Selector**:
- Dropdown with visual pills showing stock status
- Out of stock sizes: opacity-50 cursor-not-allowed line-through
- Selected size: border-2 border-primary bg-primary/10

**Color Picker**:
- Horizontal row of color swatches (w-8 h-8 rounded-full)
- Each swatch shows actual color with border
- Selected: ring-2 ring-primary ring-offset-2
- Color name displays on hover

**Price History Graph**:
- Line chart using Chart.js or similar
- Shaded area under line (gradient from primary to transparent)
- Tooltip showing exact price on hover
- Min/max markers with dashed horizontal lines

### Forms & Inputs
**Add Item Modal**:
- Paste URL input (large, autofocus)
- Instant preview card appears below (showing scraped data)
- Manual override fields for category, size, color
- Bottom sheet modal for Google Lens results

**Bottom Sheet**:
- Slides up from bottom (transform translateY)
- Backdrop blur
- Drag handle at top
- Close on outside click or swipe down

### Status Indicators
**Processing States**:
- Pending: Animated pulse skeleton
- Processing: Spinning loader with "Fetching details..."
- Failed: Red alert icon with "Retry" button
- Dead Link (404): Ghost icon with strikethrough

**Price Change Badges**:
- Drop: Green pill with ▼ and "-15%"
- Rise: Red pill with ▲ and "+8%"
- Stable: Gray with "—"

### Buttons & Actions
**Primary Actions**: bg-primary text-white rounded-lg px-6 py-3 font-medium shadow-sm
**Secondary**: variant="outline" with backdrop blur when on images
**Icon Buttons**: Square p-2 rounded hover:bg-primary/10
**"Update List Prices"**: Small icon button on list headers

---

## Iconography

**Category-Specific Icons** (using Heroicons):
- Dresses: Heroicon "square-3-stack-3d" styled as dress silhouette
- Skirts: Custom dress variant (shorter)
- Makeup: Heroicon "sparkles"
- Electronics: Heroicon "device-phone-mobile"
- Tops: Heroicon "shirt" style
- Perfumes: Heroicon "beaker"
- Shoes: Custom shoe icon
- Default/All Items: Heroicon "shopping-bag"

Use Heroicons CDN for all system icons (arrows, menus, actions).

---

## Special Features

### Chrome Extension Design
Minimal popup (320x480):
- Current page product preview
- One-click "Add to Wishly" button
- Quick category selector
- Matches main app theme

### CSV Import
Progress modal showing:
- Upload dropzone
- Progress bar with item count
- Auto-categorization status
- "View imported items" CTA when complete

### Goals Section (Dashboard Page)
Card-based layout:
- Budget tracker with circular progress
- Spending by category (bar chart)
- Savings from price tracking (highlighted metric)

---

## Images

**Product Images**: Always displayed at high quality with lazy loading
**Empty States**: Friendly illustrations (pastel colors) for:
- Empty lists: "Add your first item"
- No results: "No matches found"
- Failed scrape: "We couldn't fetch this item"

No large hero images needed - this is a dashboard application focused on product data and organization.