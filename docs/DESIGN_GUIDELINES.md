# Hailuo AI-Inspired Design Guidelines

## Design Overview

This document outlines the comprehensive design guidelines for the checkout-one-time-payments application, featuring a **professional native app design** with modern aesthetics, superior contrast, and polished interactions inspired by premium application standards.

### Design Philosophy
- **Professional & Premium**: Sophisticated dark theme with accent colors
- **Native App Feel**: Smooth animations, proper spacing, native-like components
- **User-Centric**: Clear information hierarchy and intuitive interactions
- **Accessibility First**: High contrast, semantic structure, inclusive design
- **Performance-Focused**: Smooth 60fps animations, optimized components

---

## 1. Color Palette

### Primary Colors
- **Dark Background**: `#0a0a0a` or `#1a1a1a` - Deep black for main page background
- **Accent Gradient**: Purple to Pink/Magenta gradient (`#a855f7` → `#ec4899`)
- **White/Light**: `#ffffff` - For text and highlights
- **Neutral Gray**: `#666666` - For secondary text and borders

### Secondary Colors
- **Success Green**: `#10b981` - For positive actions (subscribe button style)
- **Warning/Hot Red**: `#ef4444` - For "Hot" badges and special highlights
- **Muted Dark**: `#262626` - For card backgrounds and subtle dividers

### Gradient Usage
- **Hero Section Gradient**: Dark background with subtle purple-pink gradient accents
- **Button Gradients**: Subtle color transitions on interactive elements
- **Border Accents**: Gradient borders on featured cards

---

## 2. Typography

### Font Family
- **Primary Font**: Modern sans-serif (recommend: `Inter`, `Poppins`, or `SF Pro Display`)
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Font Sizes & Hierarchy
- **Hero Headline**: 48px - 64px, Bold/Semibold (e.g., "Transform Idea to Visual")
- **Section Titles**: 32px - 40px, Semibold
- **Card Titles**: 18px - 24px, Semibold
- **Body Text**: 14px - 16px, Regular
- **Small Text/Labels**: 12px - 13px, Regular
- **Button Text**: 14px - 16px, Medium/Semibold

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Line Height
- Headlines: 1.2
- Body Text: 1.6
- Compact Labels: 1.4

---

## 3. Layout & Spacing

### Grid System
- **Container**: `.i2v-container` with max-content, responsive padding
- **Card Grid**: `.i2v-grid` with CSS Grid (2 columns → 1 on mobile)
- **Gap**: 24px between cards (desktop), 20px (tablet), 16px (mobile)
- **Content Grid**: `.gallery` with 2-column layout for media

### Container Padding
```css
Desktop (1200px+):  padding: 32px 24px
Tablet (768-1199px): padding: 24px 16px
Mobile (<768px):     padding: 16px 12px
```

### Spacing System (Updated)
- **XS**: 4px (micro spacing, badges)
- **SM**: 8px (compact spacing, form elements)
- **MD**: 16px (default spacing, gutter)
- **LG**: 24px (card padding, section gap)
- **XL**: 32px (section padding)
- **2XL**: 48px (major section spacing)
- **3XL**: 64px (hero/banner spacing)

### Component Spacing

**Card System**
```css
Card Container: 0 padding (structure handled by header/body/footer)
Card Header Padding: 20px 24px
Card Body Padding: 24px
Card Body Gap: 20px (between children)
Card Footer Padding: 20px 24px
```

**Form Groups**
```css
Form Group: 12px gap between label/input
Form Control Height: 40px (44px touch target with padding)
Form Help Text: 4px margin-top
Between Form Groups: 20px
```

**Sections Within Card Body**
```css
Section Gap: 12px (internal organization)
Section Divider: 8px margin vertical
```

### Visual Hierarchy Through Spacing
- **Tighter Spacing** (8-12px): Form fields, badges, compact elements
- **Medium Spacing** (16-24px): Cards, sections, standard gaps
- **Generous Spacing** (32-48px): Major sections, page layout
- **Maximum Spacing** (64px+): Hero sections, full-page layout

---

## 4. Components & UI Elements

### Card System (Professional Native Style)
The application uses a hierarchical card system that mimics native app design:

- **Container Card** (`.i2v-card`)
  - Background: Secondary color (`#1a1a1a`)
  - Border: 1px solid border color (`#404040`)
  - Border Radius: 12px
  - Box Shadow: `0 2px 8px rgba(0, 0, 0, 0.12)` (subtle)
  - Hover Shadow: `0 4px 12px rgba(0, 0, 0, 0.16)`
  - Padding: 0 (structured sections)
  - Overflow: Hidden

- **Card Header** (`.i2v-card-header`)
  - Padding: 20px 24px
  - Background: Linear gradient from secondary with accent accent (5% opacity)
  - Border-Bottom: 1px solid border color
  - Title Style: 18px, semibold (600), uppercase tracking
  - Content: Compact, label-focused

- **Card Body** (`.i2v-card-body`)
  - Padding: 24px
  - Background: Transparent (inherits from card)
  - Display: Flex column with 20px gap
  - Content: Form groups, sections, controls

- **Card Footer** (`.i2v-card-footer`)
  - Padding: 20px 24px
  - Background: Subtle gradient (3% opacity)
  - Border-Top: 1px solid border color
  - Content: Buttons, actions

### Form Elements (Enhanced Accessibility)

**Labels** (`.form-label`)
```css
Font Size: 13px
Font Weight: 600
Color: Primary text
Transform: Uppercase
Letter Spacing: 0.4px
Margin Bottom: 8px
```

**Input Fields** (`.form-control`, `.form-select`)
```css
Padding: 11px 13px
Font Size: 14px
Background: Tertiary color (#262626)
Border: 1.5px solid border
Border Radius: 8px
Font Family: Inherit
Transition: All 150ms ease-in-out
```

**Input Focus State**
```css
Outline: None
Border Color: Accent purple (#a855f7)
Background: Unchanged (maintains visual balance)
Box Shadow: 0 0 0 3px rgba(168, 85, 247, 0.1)
```

**Help Text** (`.form-help-text`)
```css
Font Size: 12px
Color: Secondary text (#9ca3af)
Margin Top: 4px
Line Height: 1.4
```

**Form Groups** (`.section`, `.form-group`)
```css
Display: Flex flex-direction column
Gap: 12px
Margin Bottom: 20px
```

### Upload Zones (Modern Drag & Drop)

**Zone Container** (`.upload-zone`)
```css
Border: 2px dashed accent purple
Border Radius: 10px
Background: Linear gradient (accent 8%, pink 5%)
Padding: 40px 24px
Min Height: 200px
Cursor: Pointer
Transition: All 200ms ease
```

**Zone Hover/Drag State**
```css
Border Color: Accent pink
Background: Linear gradient (accent 12%, pink 10%)
Box Shadow: 0 4px 12px rgba(168, 85, 247, 0.15)
```

**Upload Content** (`.upload-zone-content`)
```css
Display: Flex column
Align Items: Center
Gap: 12px
Text Align: Center
```

**Upload Icon** (`.upload-icon`)
```css
Font Size: 48px
Color: Accent purple with 70% opacity
Transition: All 200ms ease
Hover: Scale 1.1, full opacity
```

### Buttons (Native App Style)

**Primary Button** (`.btn-primary`)
```css
Background: Linear gradient(135deg, #a855f7 0%, #ec4899 100%)
Color: White
Padding: 10px 16px (default), 14px 24px (large)
Font Size: 14px (default), 15px (large)
Font Weight: 600
Border Radius: 8px
Box Shadow: 0 4px 12px rgba(168, 85, 247, 0.3)
Transition: All 200ms ease
```

**Primary Hover/Active**
```css
Hover: 
  - Transform: translateY(-2px)
  - Box Shadow: 0 6px 20px rgba(168, 85, 247, 0.4)
Active:
  - Transform: translateY(0)
Disabled: Opacity 0.5, cursor not-allowed
```

**Secondary Button** (`.btn-secondary`)
```css
Background: Tertiary color
Color: Primary text
Border: 1.5px solid border
Hover Background: Border color
```

**Button Sizes**
```css
.btn-sm: 8px 12px, font-size 12px
.btn (default): 10px 16px, font-size 14px
.btn-lg: 14px 24px, font-size 15px, width 100%
```

### Accordion (Collapsible Sections)

**Accordion Item** (`.accordion-item`)
```css
Border: 1px solid border
Border Radius: 8px
Background: Tertiary color
Hover Border Color: Accent purple
Margin Bottom: 8px
Overflow: Hidden
Transition: All 200ms ease
```

**Accordion Button** (`.accordion-button`)
```css
Padding: 14px 16px
Display: Flex justify-content space-between
Font Weight: 500
Font Size: 14px
Cursor: Pointer
Transition: All 200ms ease
Background: Tertiary
Hover: Background accent at 5% opacity
```

**Accordion Chevron** (`.accordion-button::after`)
```css
Content: SVG chevron icon
Width: 20px, Height: 20px
Transition: Transform 200ms ease
Collapsed: Down arrow
Expanded: Rotated -180deg (up arrow)
```

**Accordion Body** (`.accordion-body`)
```css
Padding: 16px
Background: Secondary color
Border Top: 1px solid border
Display: Flex flex-direction column
Gap: 16px
Transition: Max-height 300ms ease
Max Height: 0 (collapsed), 2000px (expanded)
```

### Info & Status Boxes

**Info Box** (`.info-box`)
```css
Padding: 16px
Border Radius: 8px
Border Left: 4px solid accent purple
Background: Accent with 8% opacity
Display: Flex
Gap: 12px
```

**Payment Card** (`.payment-card`)
```css
Padding: 16px
Border Radius: 10px
Background: Linear gradient (accent 8%, pink 5%)
Border: 1px solid border
Display: Flex justify-content space-between
Gap: 16px
```

**Payment Status** (`.payment-status`)
```css
Display: Flex items-center
Gap: 8px
Font Size: 13px
Padding: 8px 12px
Background: Accent with 10% opacity
Border Radius: 6px
Color: Accent purple

States:
- Default: Purple accent
- Success: Green with 10% bg
- Warning: Yellow/orange with 10% bg
- Error: Red with 10% bg
```

### Gallery Grid (`.gallery`)

**Grid Layout**
```css
Display: Grid
Grid Columns: 2fr (desktop), 1fr (mobile)
Gap: 12px
Responsive: Adjusts from 2 to 1 column
```

**Gallery Item** (`.gallery-item`)
```css
Aspect Ratio: 16/9
Border Radius: 8px
Border: 1px solid border
Overflow: Hidden
Cursor: Pointer
Transition: All 200ms ease

Hover:
- Border Color: Accent purple
- Transform: translateY(-2px)
- Box Shadow: 0 4px 12px rgba(168, 85, 247, 0.2)
```

### Output Placeholder (`.output-placeholder`)

**Placeholder Container**
```css
Aspect Ratio: 16/9
Display: Flex flex-direction column
Align Items: Center
Justify Content: Center
Gap: 12px
Background: Gradient (accent 5%, pink 5%)
Border: 1px dashed border
Border Radius: 10px
Padding: 20px
Text Align: Center
```

**Placeholder Icon** (`.output-icon`)
```css
Font Size: 56px
Color: Text muted
Opacity: 0.4
```

**Placeholder Text** (`.output-text`)
```css
Font Size: 14px
Color: Secondary text
Margin: 0
Line Height: 1.5
```

---

## 5. Visual Effects & Interactions

### Native App Interactions
The design emphasizes smooth, predictable interactions that feel responsive and polished:

### Hover Effects

**Cards** (`.i2v-card`)
```css
Transition: all 200ms ease-in-out
On Hover:
- Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.16) [from 0 2px 8px]
- Border Color: Subtle enhancement
- Background: Unchanged (maintains visual consistency)
```

**Buttons**
```css
Primary Button:
- Duration: 200ms ease-in-out
- Transform: translateY(-2px) on hover
- Box Shadow: Enhanced (0 6px 20px from 0 4px 12px)
- On Active: Transform returns to 0

Secondary Button:
- Background: Changes to border color
- Duration: 150ms ease-in-out
```

**Gallery Items** (`.gallery-item`)
```css
On Hover:
- Border Color: var(--color-accent-purple)
- Transform: translateY(-2px)
- Box Shadow: 0 4px 12px rgba(168, 85, 247, 0.2)
- Duration: 200ms ease-in-out
```

**Upload Zone** (`.upload-zone`)
```css
On Hover/Drag Over:
- Border Color: var(--color-accent-pink)
- Background: Enhanced gradient
- Box Shadow: 0 4px 12px rgba(168, 85, 247, 0.15)
- Upload Icon: Scale 1.1, full opacity
- Duration: 200ms ease-in-out
```

**Form Inputs**
```css
On Focus:
- Border Color: var(--color-accent-purple)
- Box Shadow: 0 0 0 3px rgba(168, 85, 247, 0.1)
- Background: Unchanged
- Duration: 150ms ease-in-out

On Hover (unfocused):
- Subtle border enhancement
- Duration: 150ms
```

### Transitions
- **Fast**: 150ms (form interactions, small elements)
- **Standard**: 200ms (cards, buttons, standard components)
- **Slow**: 300ms (accordion collapse, major state changes)
- **Easing**: `ease-in-out` (smooth, natural motion)

### Animations

**Page Load**
```css
Section Fade In: 200-300ms fade + scale(0.98 → 1)
Staggered Cards: 100ms delay between each card
```

**Form Interactions**
```css
Focus Ring: 300ms fade-in
Error State: 200ms pulse or shake
Success State: 200ms scale + fade
```

**Accordion Toggle**
```css
Chevron Rotate: 200ms transform
Content Expand: 300ms max-height transition
```

### Focus Indicators (Accessibility)

**Keyboard Focus (All Interactive Elements)**
```css
Outline: 2px solid transparent (outline-offset: 2px)
Box Shadow: 0 0 0 3px rgba(168, 85, 247, 0.2)
Color: var(--color-accent-purple)
Visible: Always clear and high contrast
```

### Shadows (Depth System)

**Shadow Hierarchy**
```css
--shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3)      /* Subtle, minimal elevation */
--shadow-md:   0 4px 6px rgba(0, 0, 0, 0.3)      /* Standard, interactive elements */
--shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.3)    /* Emphasis, hover states */
--shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.4)    /* Maximum elevation */
--shadow-glow: 0 0 20px rgba(168, 85, 247, 0.3)  /* Accent glow for focus */
```

**Shadow Application**
```css
Resting Cards: --shadow-md
Hover Cards: --shadow-lg
Buttons (Resting): --shadow-md
Buttons (Hover): --shadow-lg
Focus States: --shadow-glow
Modals/Overlays: --shadow-xl
```

### Color Transitions

**Gradient Buttons on Hover**
```css
Original: linear-gradient(135deg, #a855f7 0%, #ec4899 100%)
Hover: Opacity 0.95 (subtle dimming) or brightness(1.05)
Maintains gradient direction for visual consistency
```

**Border Color Changes**
```css
Input Unfocused: var(--color-border) (#404040)
Input Focused: var(--color-accent-purple) (#a855f7)
Transition: 150ms ease-in-out
```

---

## 6. Dark Mode

### Implementation
- **Primary Background**: `#0a0a0a` (darkest)
- **Secondary Background**: `#1a1a1a` (slightly lighter)
- **Card Background**: `#262626` or `#1f1f1f`
- **Text Primary**: `#ffffff` (white)
- **Text Secondary**: `#9ca3af` (light gray)
- **Borders**: `#404040` (dark gray)

### Best Practices
- Avoid pure black for reduced eye strain; use `#0a0a0a`
- Use high contrast text for readability (AA standard minimum)
- Subtle gradients for visual hierarchy
- Strategic use of accent colors to guide attention

---

## 7. Responsive Design

### Mobile-First Approach
Design starts at 375px (mobile) and scales up to larger screens.

### Breakpoints & Adjustments

**Mobile (< 768px)**
```css
#main-content: margin-left 0, width 100%
.i2v-container: padding 16px 12px
.i2v-grid: grid-template-columns 1fr (single column)
Gap: 16px between cards
Card Body: padding 16px, gap 12px
Upload Zone: min-height 160px, padding 32px 16px
Gallery: grid-template-columns 1fr or 2fr (responsive)
Buttons: Full width (100%)
Form Controls: Font size 16px (prevents zoom on focus)
```

**Tablet (768px - 1024px)**
```css
#main-content: margin-left 0, width 100%, padding-top 60px
.i2v-container: padding 24px 16px
.i2v-grid: grid-template-columns 1fr (single column) or 2fr with adjustments
Gap: 20px between cards
Card Body: padding 20px, gap 16px
Upload Zone: min-height 160px, padding 32px 16px
Gallery: grid-template-columns repeat(2, 1fr)
Sidebar: Toggle or collapse visible
```

**Desktop (1025px - 1199px)**
```css
#main-content: margin-left 240px, width calc(100% - 240px)
.i2v-container: padding 24px 16px
.i2v-grid: grid-template-columns repeat(2, 1fr)
Gap: 20px between cards
Sidebar: Always visible at 240px
```

**Wide Desktop (1200px+)**
```css
#main-content: margin-left 240px, width calc(100% - 240px)
.i2v-container: padding 32px 24px, max-content layout
.i2v-grid: grid-template-columns repeat(2, 1fr)
Gap: 24px between cards
Full feature parity with desktop
```

### Sidebar Responsive

**Desktop (> 1024px)**
```css
Display: Fixed left sidebar
Width: 240px
Visible: Always
Main Content: margin-left 240px
```

**Tablet & Mobile (≤ 1024px)**
```css
Display: Hidden by default
Position: Fixed, overlay
Animation: Slide from left
Overlay: Semi-transparent background
Toggle: Hamburger menu in header
Z-Index: Above main content
```

**Minimized State (when available)**
```css
Width: 80px (instead of 240px)
Text Labels: Hidden
Icons Only: Visible
Main Content: margin-left 80px
Transition: Smooth width change
```

### Touch-Friendly Design

**Mobile Interactions**
```css
Minimum Touch Target: 44px x 44px
Button Padding: 12px 16px (provides 44px min height)
Form Fields: 40px height with internal padding
Spacing Between Targets: 16px minimum gap
No Hover-Dependent Information: Mobile has no hover
Tap Feedback: Brief animation/color change
```

### Media Query Organization

**Mobile First Pattern**
```css
/* Base mobile styles */
.component { padding: 12px; }

/* Tablet and up */
@media (min-width: 768px) {
  .component { padding: 16px; }
}

/* Desktop and up */
@media (min-width: 1025px) {
  .component { padding: 24px; }
}

/* Wide screens */
@media (min-width: 1200px) {
  .component { max-width: 1280px; }
}
```

### Content Reflow

**Typography Adjustments**
```css
Mobile: Reduce font sizes by 1-2px, maintain readability
Tablet: 90% of desktop size
Desktop: Full design sizes
```

**Component Sizing**
```css
Mobile: Reduced padding/margin (reduce by 25-33%)
Tablet: 75-85% of desktop sizing
Desktop: Full sizing
```

---

## 8. Images & Media

### Image Guidelines
- **Format**: WebP (with PNG/JPG fallback)
- **Optimization**: Compressed for web, lazy-loaded
- **Aspect Ratios**: 
  - Hero: 16:9 or 21:9
  - Cards: 16:9 or 1:1
  - Thumbnails: 4:3 or 16:9
- **Object-fit**: `cover` for consistent sizing

### Icon Guidelines
- **Style**: Clean, simple, filled or outline
- **Size**: Multiples of 4 (16px, 20px, 24px, 32px)
- **Color**: Match text color or accent color
- **Consistency**: Use unified icon library (e.g., Feather, Heroicons)

### Video Thumbnails
- **Overlay**: Gradient or semi-transparent dark overlay
- **Play Button**: Centered, large, with shadow
- **Text**: Title/description on hover
- **Engagement Metrics**: Views, likes in corner with icons

---

## 9. Accessibility

### Color Contrast
- **Minimum**: WCAG AA standard (4.5:1 for text)
- **Enhanced**: WCAG AAA standard (7:1 for text)
- **Test**: Use tools like WebAIM Contrast Checker

### Keyboard Navigation
- **Tab Order**: Logical flow
- **Focus Indicators**: Visible outline (2px, accent color)
- **Keyboard Shortcuts**: Documented and consistent

### Screen Readers
- **ARIA Labels**: Descriptive labels for buttons and icons
- **Alt Text**: Meaningful descriptions for images
- **Semantic HTML**: Proper heading hierarchy, list structure

### Motion & Animation
- **Reduced Motion**: Respect `prefers-reduced-motion`
- **No Flash**: Avoid rapid flashing (> 3 per second)
- **Timing**: Ensure animations don't interfere with readability

---

## 10. Implementation Checklist

### CSS Architecture
- [ ] Use CSS variables for colors, spacing, typography
- [ ] Organize with BEM or similar methodology
- [ ] Separate concerns: layout, components, utilities
- [ ] Use preprocessor (SCSS) for nesting and functions

### HTML Structure
- [ ] Semantic HTML5 tags
- [ ] Proper heading hierarchy
- [ ] Accessible form labels
- [ ] Valid HTML validation

### Performance
- [ ] Optimize images and media
- [ ] Minify CSS and JavaScript
- [ ] Lazy-load images and components
- [ ] Critical CSS inline, non-critical deferred

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS and iOS)
- [ ] Mobile browsers

### Testing Devices
- [ ] iPhone 12/13/14 (375px - 390px)
- [ ] iPad (768px - 1024px)
- [ ] Desktop (1440px, 1920px, 2560px)
- [ ] Various screen densities

---

## 11. File Organization

### CSS Structure
```
css/
├── base/
│   ├── reset.css          # Reset and normalize
│   ├── variables.css      # CSS custom properties
│   └── typography.css     # Font definitions
├── components/
│   ├── buttons.css
│   ├── cards.css
│   ├── header.css
│   ├── sidebar.css
│   ├── inputs.css
│   └── badges.css
├── layouts/
│   ├── hero.css
│   ├── grid.css
│   └── sections.css
├── utilities/
│   ├── spacing.css
│   ├── animations.css
│   └── responsive.css
├── themes/
│   └── dark.css
└── global.css             # Main stylesheet
```

### HTML Structure
```
html/
├── layouts/
│   ├── base.handlebars    # Master layout
│   └── sidebar.handlebars # Sidebar template
├── pages/
│   ├── index.handlebars
│   ├── ai-tools.handlebars
│   ├── success.handlebars
│   └── history.handlebars
└── components/
    ├── header.handlebars
    ├── navigation.handlebars
    ├── cards.handlebars
    └── buttons.handlebars
```

---

## 12. Design Tokens

### Color Tokens
```css
--color-bg-primary: #0a0a0a;
--color-bg-secondary: #1a1a1a;
--color-bg-tertiary: #262626;

--color-text-primary: #ffffff;
--color-text-secondary: #9ca3af;

--color-accent-purple: #a855f7;
--color-accent-pink: #ec4899;
--color-accent-gradient: linear-gradient(135deg, #a855f7, #ec4899);

--color-success: #10b981;
--color-error: #ef4444;
--color-warning: #f59e0b;

--color-border: #404040;
```

### Spacing Tokens
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### Typography Tokens
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-2xl: 24px;
--font-size-3xl: 32px;
--font-size-4xl: 40px;
--font-size-5xl: 48px;
```

---

## 13. Quick Reference

### Key Design Principles
1. **Dark & Premium**: Dark backgrounds with accent colors for sophistication
2. **Content-Focused**: UI elements support content without overwhelming
3. **Interactive**: Smooth animations and hover effects enhance user engagement
4. **Accessible**: High contrast and semantic markup for inclusivity
5. **Responsive**: Mobile-first design scales to all devices
6. **Modern**: Clean lines, generous whitespace, contemporary aesthetics

### Color Quick Reference
- **Call-to-Action**: Purple-Pink Gradient
- **Positive/Success**: Green (`#10b981`)
- **Highlight/New**: Purple or Pink
- **Neutral**: Gray (`#666666` or `#9ca3af`)
- **Background**: Deep Dark (`#0a0a0a`)

### Spacing Quick Reference
- **Button**: 12-16px vertical, 20-32px horizontal
- **Card**: 24px padding inside
- **Section**: 48-64px padding top/bottom
- **Gap between items**: 16-24px

---

## 14. Resources & References

### Font Resources
- [Google Fonts: Inter, Poppins](https://fonts.google.com)
- [Font Pairings for Modern Design](https://www.fontpair.co)

### Icon Libraries
- [Heroicons](https://heroicons.com)
- [Feather Icons](https://feathericons.com)

### Color Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors.co](https://coolors.co) - Color palette generator

### Inspiration & References
- [Hailuo AI Video Generator](https://hailuoai.video)
- [Design System Best Practices](https://www.designsystems.com)

---

## Version History

- **v1.0** (November 13, 2025): Initial design guidelines based on Hailuo AI design analysis
- **Updated**: Color palette, typography, component specifications, responsive design

---

*Last Updated: November 13, 2025*
