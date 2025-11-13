# Hailuo AI Design System - Quick Reference Guide

## 🎨 Color Palette

### Backgrounds
```css
--color-bg-primary: #0a0a0a;      /* Main background */
--color-bg-secondary: #1a1a1a;    /* Sidebar, secondary containers */
--color-bg-tertiary: #262626;     /* Cards, inputs, elevated surfaces */
```

### Text
```css
--color-text-primary: #ffffff;    /* Primary text */
--color-text-secondary: #9ca3af;  /* Secondary text, hints */
--color-text-muted: #666666;      /* Muted/disabled text */
```

### Accents
```css
--color-accent-purple: #a855f7;
--color-accent-pink: #ec4899;
--color-accent-gradient: linear-gradient(135deg, #a855f7, #ec4899);
```

### Semantic
```css
--color-success: #10b981;   /* Green - positive actions */
--color-error: #ef4444;     /* Red - errors, warnings */
--color-warning: #f59e0b;   /* Yellow - attention */
--color-info: #3b82f6;      /* Blue - information */
```

### Borders
```css
--color-border: #404040;           /* Standard border */
--color-border-light: #555555;     /* Lighter border */
```

## 📝 Typography

### Font Stack
```css
--font-family-primary: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes
```
Hero/Title (H1):    48-64px (bold)      [--font-size-4xl/5xl]
Heading (H2):       32-40px (bold)      [--font-size-3xl/4xl]
Subheading (H3):    32px (semibold)     [--font-size-3xl]
Card Title (H4):    24px (semibold)     [--font-size-2xl]
Label (H5):         18px (semibold)     [--font-size-lg]
Body (p):           16px (regular)      [--font-size-base]
Small Text:         12-14px (regular)   [--font-size-sm/xs]
```

### Font Weights
```
Regular:    400 (--font-weight-regular)
Medium:     500 (--font-weight-medium)
Semibold:   600 (--font-weight-semibold)
Bold:       700 (--font-weight-bold)
```

### Line Heights
```
Tight:      1.2 (--line-height-tight)      /* Headlines */
Normal:     1.4 (--line-height-normal)     /* Compact */
Relaxed:    1.6 (--line-height-relaxed)    /* Body text */
```

## 📏 Spacing Scale

```css
--space-xs:   4px     /* Micro spacing */
--space-sm:   8px     /* Small spacing */
--space-md:   16px    /* Default spacing */
--space-lg:   24px    /* Large spacing */
--space-xl:   32px    /* Extra large */
--space-2xl:  48px    /* 2x large */
--space-3xl:  64px    /* 3x large */
```

### Common Patterns
- **Button Padding**: `var(--space-md) var(--space-lg)` (16px 24px)
- **Card Padding**: `var(--space-lg)` (24px)
- **Section Padding**: `var(--space-2xl) var(--space-lg)` (48px 24px)
- **Gutter**: `var(--space-md)` to `var(--space-lg)` (16-24px)

## 🔲 Border Radius

```css
--radius-sm:   4px     /* Small elements, badges */
--radius-md:   6px     /* Default radius */
--radius-lg:   8px     /* Cards, containers */
--radius-xl:   12px    /* Larger containers */
--radius-full: 9999px  /* Fully rounded (pills) */
```

## 💫 Shadows

```css
--shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md:   0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.3);
--shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 20px rgba(168, 85, 247, 0.3);
```

## ⏱️ Transitions

```css
--transition-fast: 150ms ease-in-out   /* Quick feedback */
--transition-base: 200ms ease-in-out   /* Standard */
--transition-slow: 300ms ease-in-out   /* Smooth */
```

## 📱 Responsive Breakpoints & Adjustments

### Mobile (< 768px)
```css
#main-content: margin-left 0, width 100%
.i2v-container: padding 16px 12px
.i2v-grid: grid-template-columns 1fr (single column)
Card Gap: 16px
Card Body Padding: 16px
Card Body Gap: 12px
Upload Zone: min-height 160px
Gallery: 1-2 columns
Button Height: Full width (100%)
Form Font Size: 16px (prevents mobile zoom)
Touch Target: Minimum 44px
```

### Tablet (768px - 1024px)
```css
#main-content: margin-left 0, width 100%, padding-top 60px
.i2v-container: padding 24px 16px
.i2v-grid: grid-template-columns 1fr or responsive adjustment
Card Gap: 20px
Card Body Padding: 20px
Card Body Gap: 16px
Upload Zone: min-height 160px
Gallery: grid-template-columns repeat(2, 1fr)
Sidebar: Toggle/hidden by default
```

### Desktop (1025px - 1199px)
```css
#main-content: margin-left 240px, width calc(100% - 240px)
.i2v-container: padding 24px 16px
.i2v-grid: grid-template-columns repeat(2, 1fr)
Card Gap: 20px
Sidebar: Always visible (240px width)
Full functionality
```

### Wide Desktop (1200px+)
```css
#main-content: margin-left 240px, width calc(100% - 240px)
.i2v-container: padding 32px 24px
.i2v-grid: grid-template-columns repeat(2, 1fr)
Card Gap: 24px
Maximum spacing and content width
Premium desktop experience
```

### Touch-Friendly Targets (Mobile)
```css
Minimum Touch Target: 44px × 44px
Button Padding: 12px 16px (achieves 44px+ height)
Form Field Height: 40px (with internal 11px padding = 62px total)
Spacing Between Targets: 16px minimum gap
No Hover-Only Information: Always show critical info
Tap Feedback: Immediate visual response
```

## 🎯 Component Guidelines

### Card System (Native App Style)

**Container Card**
```css
.i2v-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all var(--transition-base);
}

.i2v-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}
```

**Card Header**
```css
.i2v-card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(236, 72, 153, 0.05));
}

.i2v-card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
```

**Card Body**
```css
.i2v-card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
```

**Card Footer**
```css
.i2v-card-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  background: rgba(168, 85, 247, 0.03);
}
```

### Form Elements

**Label**
```css
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}
```

**Input Field**
```css
.form-control,
.form-select {
  padding: 11px 13px;
  font-size: 14px;
  background-color: var(--color-bg-tertiary);
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.form-control:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent-purple);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
```

**Help Text**
```css
.form-help-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}
```

### Buttons (Enhanced)

**Primary Button**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-pink));
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Button Sizes**
```css
.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
}

.btn (default) {
  padding: 10px 16px;
  font-size: 14px;
}

.btn-lg {
  padding: 14px 24px;
  font-size: 15px;
  width: 100%;
}
```

### Form Inputs (Enhanced)

**Input Focus State**
```css
.form-control:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent-purple);
  background-color: var(--color-bg-tertiary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
```

## 🌊 Animations & Interactions

### Transition Timings
```css
Fast:      150ms ease-in-out (form interactions, small elements)
Standard:  200ms ease-in-out (cards, buttons, standard components)
Slow:      300ms ease-in-out (accordion, major state changes)
```

### Card Hover
```css
transition: all 200ms ease-in-out;

On Hover:
- box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
- border-color: subtle enhancement;
```

### Button Hover
```css
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
  duration: 200ms ease-in-out;
}

.btn-primary:active {
  transform: translateY(0);
}
```

### Input Focus Ring
```css
.form-control:focus,
.form-select:focus {
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  border-color: var(--color-accent-purple);
  duration: 150ms ease-in-out;
}
```

### Accordion Toggle
```css
Chevron Rotation: 200ms transform rotate(-180deg);
Content Expand: 300ms max-height 0 → 2000px;
Button Hover: 200ms background rgba(168, 85, 247, 0.05);
```

### Gallery Item Hover
```css
.gallery-item:hover {
  border-color: var(--color-accent-purple);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
  duration: 200ms ease-in-out;
}
```

### Upload Zone Drag Over
```css
.upload-zone.hover {
  border-color: var(--color-accent-pink);
  background: Linear gradient (12% → 10%);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
  duration: 200ms ease-in-out;
}

.upload-icon on hover {
  transform: scale(1.1);
  opacity: 1;
  duration: 200ms ease-in-out;
}
```

## ♿ Accessibility

### Color Contrast
- Text-background: Minimum 4.5:1 (WCAG AA)
- Enhanced: 7:1 (WCAG AAA)

### Focus Indicators
- Always visible
- 2px outline with accent color
- 3px glow for emphasis

### Keyboard Navigation
- Tab order logical
- All buttons/links focusable
- Form fields clearly labeled

## 📊 Common Use Cases

### Page Section
```css
padding: var(--space-2xl) var(--space-lg);
```

### Inline Spacing
```css
margin: var(--space-md);
```

### Card Layout
```css
gap: var(--space-md) to var(--space-lg);
```

### Form Field
```css
margin-bottom: var(--space-lg);
```

### Icon Spacing
```css
margin-right: var(--space-md);
```

## 🎬 Animation Timing

- Page Load: 200-300ms
- Hover Effects: 150-200ms
- Transitions: 200-300ms
- Form Fields: 60ms stagger delay

## 📚 File Structure

```
css/
├── variables.css       # Design tokens
├── global.css          # Global styles
├── style.css           # Page-specific styles
├── sidebar.css         # Sidebar styles
└── ai-tools.css        # AI tools page styles
```

## 🚀 Usage Examples

### Card with Form Group
```html
<div class="i2v-card">
  <div class="i2v-card-header">
    <h3>Image to Video</h3>
  </div>
  
  <div class="i2v-card-body">
    <div class="section">
      <div class="form-group">
        <label class="form-label">Select Model</label>
        <select class="form-select">
          <option>Kling v1.6 (Recommended)</option>
          <option>WanX I2V</option>
        </select>
        <p class="form-help-text">Choose a model for video generation.</p>
      </div>
    </div>
    
    <div class="upload-zone">
      <div class="upload-zone-content">
        <div class="upload-icon">
          <i class="bi bi-cloud-arrow-up"></i>
        </div>
        <p class="upload-text">Drag & drop an image here</p>
      </div>
    </div>
  </div>
  
  <div class="i2v-card-footer">
    <button class="btn btn-primary btn-lg">Create Video</button>
  </div>
</div>
```

### Payment Card
```html
<div class="payment-card">
  <div class="payment-info">
    <div class="payment-label">Payment</div>
    <div class="payment-amount">$2.00</div>
    <p class="form-help-text">Per video generation</p>
  </div>
  <div class="payment-status warning">
    <i class="bi bi-info-circle-fill"></i>
    <span>Payment required</span>
  </div>
</div>
```

### Button Variations
```html
<!-- Primary Large (Full Width) -->
<button class="btn btn-primary btn-lg">
  <i class="bi bi-magic"></i>Create Video
</button>

<!-- Secondary Small -->
<button class="btn btn-secondary btn-sm">Select Image</button>

<!-- Outline Primary -->
<button class="btn btn-outline-primary">Browse</button>
```

### Form with Accordion
```html
<div class="accordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" 
              data-bs-toggle="collapse" data-bs-target="#advancedOptions">
        Advanced Options
      </button>
    </h2>
    <div id="advancedOptions" class="accordion-collapse collapse">
      <div class="accordion-body">
        <div class="form-group">
          <label class="form-label">Motion Intensity</label>
          <div id="motionSlider"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Gallery Grid
```html
<div class="gallery">
  <div class="gallery-item">
    <img src="sample1.jpg" alt="Sample 1">
  </div>
  <div class="gallery-item">
    <img src="sample2.jpg" alt="Sample 2">
  </div>
  <!-- More items... -->
</div>
```

## 📝 Implementation Notes

### Professional Native App Design Characteristics
- **Polished Interactions**: Smooth 200ms transitions with ease-in-out easing
- **Proper Spacing**: Consistent gap system (12px for compact, 20px for standard, 24px for generous)
- **Visual Hierarchy**: Clear depth with shadow system and color contrast
- **Native Feel**: Mimics iOS/Material Design patterns
- **Accessibility**: WCAG AA compliant with visible focus indicators
- **Performance**: GPU-accelerated transforms (translateY), minimal repaints

### CSS Architecture
- All colors defined as CSS custom properties for easy maintenance
- Spacing uses consistent scale (4px base unit)
- Transitions use standard durations (150ms fast, 200ms base, 300ms slow)
- Components use BEM-inspired naming (`.i2v-card`, `.i2v-card-header`, etc.)
- Responsive design follows mobile-first approach
- All animations respect `prefers-reduced-motion` preference

### Browser Support
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- All modern mobile browsers

### Key Design System Files
```
css/
├── variables.css       # Design tokens (colors, spacing, typography)
├── global.css          # Base styles and resets
├── sidebar.css         # Sidebar and main layout
└── image-to-video.css  # Component-specific styles
```

### Component Class Structure
```
.i2v-container          /* Main container with responsive padding */
.i2v-grid              /* 2-column grid layout (responsive) */
.i2v-card              /* Main card container */
├── .i2v-card-header   /* Card header with gradient background */
├── .i2v-card-body     /* Card body with flexible layout */
└── .i2v-card-footer   /* Card footer with action buttons */

.form-group            /* Form field wrapper */
├── .form-label        /* Uppercase label with tracking */
├── .form-control      /* Input/textarea */
├── .form-select       /* Select dropdown */
└── .form-help-text    /* Supporting text */

.upload-zone           /* Drag & drop area */
├── .upload-zone-content
├── .upload-icon
├── .upload-text
└── .preview-container

.btn                   /* Base button */
├── .btn-primary       /* Gradient accent button *)
├── .btn-secondary     /* Outlined button *)
├── .btn-sm            /* Small button *)
└── .btn-lg            /* Large full-width button *)

.accordion             /* Collapsible sections */
├── .accordion-item
├── .accordion-button
├── .accordion-collapse
└── .accordion-body

.gallery               /* Image grid layout *)
└── .gallery-item      /* Individual gallery item *)

.payment-card          /* Payment information card *)
├── .payment-info
├── .payment-label
├── .payment-amount
└── .payment-status
```

### Design Decision Rationale

1. **Card System**: Structured header/body/footer mimics native app patterns
2. **Spacing**: 12px compact → 20px standard → 24px generous creates clear hierarchy
3. **Shadows**: Subtle (2px) at rest, enhanced (4px) on hover maintains elevation
4. **Transitions**: 200ms standard balances responsiveness with smoothness
5. **Border Radius**: 12px cards, 8px inputs, 10px upload zones feels premium
6. **Focus Indicators**: 3px glow with 10% opacity visible but not intrusive
7. **Typography**: Uppercase labels with 0.4px tracking improves scannability

---

**Last Updated**: November 13, 2025
**Version**: 2.0
**Design System**: Professional Native App Style
