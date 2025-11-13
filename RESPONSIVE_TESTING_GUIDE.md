# Responsive Viewport Testing Guide

## Quick Test Checklist

### Desktop (1200px+)
- [ ] Sidebar visible on left (240px)
- [ ] Main content takes remaining width
- [ ] Multi-column layouts active
- [ ] Full spacing and padding
- [ ] All features visible

### Tablet (1024px)
- [ ] Sidebar hidden
- [ ] Main content full width
- [ ] Single column card layouts
- [ ] Reduced but readable spacing
- [ ] Touch-friendly sizing

### Mobile (768px)
- [ ] No horizontal scrollbars
- [ ] Full width content area
- [ ] All cards single-column
- [ ] Buttons full-width
- [ ] Form inputs 100% width
- [ ] Modals fit on screen
- [ ] Compact spacing (12px)

### Small Mobile (480px)
- [ ] Extreme compact mode
- [ ] Minimal padding (8px)
- [ ] All content visible
- [ ] Touch targets min 40px
- [ ] No overflow anywhere
- [ ] Bottom-sheet modals
- [ ] Single-hand operation possible

## Device Breakpoints

| Device | Width | Status |
|--------|-------|--------|
| iPhone 12 mini | 375px | Small Mobile |
| iPhone 12 | 390px | Small Mobile |
| iPhone 12 Pro Max | 428px | Small Mobile |
| iPhone SE | 375px | Small Mobile |
| Samsung S21 | 360px | Small Mobile |
| iPad Mini | 768px | Mobile |
| iPad (9") | 810px | Tablet |
| iPad Air | 820px | Tablet |
| iPad Pro 11" | 834px | Tablet |
| iPad Pro 12.9" | 1024px | Tablet |
| Desktop | 1280px+ | Desktop |

## Browser DevTools Testing

### Chrome/Edge DevTools
1. Press `F12` to open DevTools
2. Press `Ctrl+Shift+M` to toggle device toolbar
3. Select device from dropdown
4. Test responsive behavior
5. Verify no horizontal scrollbars

### Firefox DevTools
1. Press `F12` to open DevTools
2. Click "Responsive Design Mode" button
3. Select device or enter custom dimensions
4. Test all breakpoints

### Safari DevTools
1. Press `Cmd+Option+I` to open Web Inspector
2. Click "Responsive Design Mode"
3. Test different dimensions

## Manual Testing Steps

### Layout Verification
```
1. Load each template:
   - index.handlebars (main app)
   - image-to-video.handlebars (i2v tool)
   - ai-tools.handlebars (tool showcase)
   - history.handlebars (user history)

2. At each breakpoint:
   ✓ Verify no horizontal scroll
   ✓ Check all content visible
   ✓ Test sidebar show/hide
   ✓ Verify button sizing
   ✓ Check form input sizing
   ✓ Verify card layouts
   ✓ Test modal positioning
```

### Touch Testing (Physical Devices)
```
1. Open app on:
   - iPhone (any generation)
   - iPad
   - Android phone
   - Android tablet

2. Verify:
   ✓ No pinch-to-zoom needed for content
   ✓ All buttons tappable (min 44px)
   ✓ Forms readable without zoom
   ✓ No horizontal scrolling
   ✓ Bottom navigation accessible
```

### Orientation Testing
```
1. Portrait mode:
   ✓ Content fits vertically
   ✓ Horizontal scroll NOT visible
   
2. Landscape mode:
   ✓ Content fits horizontally
   ✓ Vertical scroll only (if needed)
   ✓ Header/footer visible
```

## CSS Breakpoints Used

```css
/* Small Mobile */
@media (max-width: 480px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (max-width: 1024px) { }

/* Large */
@media (max-width: 1200px) { }

/* Desktop (default) */
/* No media query - base styles */
```

## Common Issues & Fixes

### Issue: Horizontal Scrollbar Appears
**Fix**: Ensure `overflow-x: hidden` is set on body and main containers
**Check**: CSS files have `overflow-x: hidden` on appropriate elements

### Issue: Text Too Small to Read
**Fix**: Use `clamp()` function for fluid font scaling
**Example**: `font-size: clamp(12px, 2.5vw, 16px);`

### Issue: Buttons Not Tappable on Mobile
**Fix**: Ensure minimum 40px height, 44px recommended
**Check**: `padding: 10px 12px;` on small screens

### Issue: Form Inputs Zoom on iOS
**Fix**: Set font size to 16px on inputs
**Code**: `input { font-size: 16px; }`

### Issue: Images Overflow Container
**Fix**: Set `max-width: 100%;` on all images
**Code**: `img { max-width: 100%; height: auto; }`

## Performance Considerations

- Media queries are applied in cascade (most specific last)
- No redundant CSS rules
- Efficient use of CSS custom properties (variables)
- Minimal animation/transition overhead on mobile
- Images scale without duplication

## Accessibility Checklist

- [ ] Sufficient color contrast (WCAG AA)
- [ ] Touch targets min 40px (44px recommended)
- [ ] Text readable at all sizes
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] No content hidden except for responsive reasons
- [ ] Focus states visible
- [ ] Forms have proper labels

## Future Enhancements

1. Add `prefers-color-scheme` media query
2. Add `prefers-reduced-motion` support
3. Landscape-specific optimizations
4. Dynamic font scaling based on viewport
5. Picture element for image optimization
6. WebP image formats with fallbacks

## Documentation References

- DESIGN_GUIDELINES.md - Design system reference
- RESPONSIVE_VIEWPORT_FIXES.md - Complete changes
- CSS files:
  - global.css - Universal styles
  - style.css - Main application
  - image-to-video.css - I2V tool
  - sidebar.css - Navigation
  - ai-tools.css - Tool showcase
