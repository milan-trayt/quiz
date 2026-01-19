# Design Document: UI/UX Modernization

## Overview

This design document outlines the comprehensive UI/UX modernization of the quiz platform. The modernization transforms the current functional interface into a minimalist, modern, and meaningful design system using Tailwind CSS utility classes and custom components. The design maintains all existing functionality while significantly enhancing visual appeal, usability, and user experience.

### Design Philosophy

- **Minimalism**: Remove visual clutter, use whitespace effectively, focus on content
- **Consistency**: Unified design language across all interfaces
- **Clarity**: Clear visual hierarchy and intuitive interactions
- **Delight**: Subtle animations and micro-interactions that enhance UX
- **Accessibility**: WCAG AA compliant with keyboard navigation support

## Architecture

### Technology Stack

- **Framework**: Next.js 14 with React Server Components
- **Styling**: Tailwind CSS 3.x with custom configuration
- **Animations**: Tailwind CSS transitions + Framer Motion for complex animations
- **Icons**: Lucide React (already in use)
- **State Management**: React hooks and server actions (existing)

### Design System Structure

```
Design System
├── Foundation
│   ├── Color Palette
│   ├── Typography
│   ├── Spacing
│   └── Shadows & Elevation
├── Components
│   ├── Buttons
│   ├── Cards
│   ├── Forms
│   ├── Badges
│   ├── Timers
│   └── Modals
└── Patterns
    ├── Layouts
    ├── Navigation
    └── Feedback
```

## Components and Interfaces

### 1. Design Foundation

#### Color Palette

**Primary Colors:**
- Primary: `indigo-600` (main brand color)
- Primary Hover: `indigo-700`
- Primary Light: `indigo-500`
- Primary Dark: `indigo-800`

**Secondary Colors:**
- Secondary: `slate-700`
- Secondary Hover: `slate-800`
- Secondary Light: `slate-600`

**Accent Colors:**
- Success: `emerald-500`
- Warning: `amber-500`
- Error: `red-500`
- Info: `blue-500`

**Neutral Colors:**
- Background: `slate-950` (dark mode optimized)
- Surface: `slate-900/90` (cards, panels)
- Border: `slate-800`
- Text Primary: `slate-50`
- Text Secondary: `slate-400`
- Text Muted: `slate-500`

**Semantic Colors:**
- Correct: `green-500`
- Incorrect: `red-500`
- Partial: `yellow-500`
- Buzzer: `orange-500`

#### Typography

**Font Family:**
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif
```

**Type Scale:**
- Display: `text-5xl` (48px) - Hero headings
- H1: `text-4xl` (36px) - Page titles
- H2: `text-3xl` (30px) - Section titles
- H3: `text-2xl` (24px) - Subsection titles
- H4: `text-xl` (20px) - Card titles
- Body Large: `text-lg` (18px) - Important content
- Body: `text-base` (16px) - Default text
- Body Small: `text-sm` (14px) - Secondary text
- Caption: `text-xs` (12px) - Labels, captions

**Font Weights:**
- Regular: `font-normal` (400)
- Medium: `font-medium` (500)
- Semibold: `font-semibold` (600)
- Bold: `font-bold` (700)

#### Spacing System

Using Tailwind's 4px-based spacing scale:
- Extra Small: `space-1` (4px)
- Small: `space-2` (8px)
- Medium: `space-4` (16px)
- Large: `space-6` (24px)
- Extra Large: `space-8` (32px)
- XXL: `space-12` (48px)

#### Shadows & Elevation

- Level 1 (Cards): `shadow-sm`
- Level 2 (Hover): `shadow-md`
- Level 3 (Modal): `shadow-lg`
- Level 4 (Dropdown): `shadow-xl`

#### Border Radius

- Small: `rounded-md` (6px) - Buttons, inputs
- Medium: `rounded-lg` (8px) - Cards
- Large: `rounded-xl` (12px) - Panels
- Full: `rounded-full` - Pills, avatars

### 2. Component Library

#### Button Component

**Variants:**

```typescript
// Primary Button
className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"

// Secondary Button
className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"

// Success Button
className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"

// Danger Button
className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"

// Ghost Button
className="px-6 py-3 bg-transparent hover:bg-slate-800 text-slate-300 font-semibold rounded-lg transition-all duration-200"

// Icon Button
className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-200"
```

**States:**
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Show spinner icon, disable interaction
- Active: `scale-95` on click

#### Card Component

```typescript
// Base Card
className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"

// Elevated Card
className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg"

// Interactive Card
className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-700 transition-all duration-200 cursor-pointer"

// Status Cards
// Success
className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6"
// Warning
className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6"
// Error
className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
```

#### Form Input Component

```typescript
// Text Input
className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"

// Select Dropdown
className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"

// Textarea
className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"

// Checkbox
className="w-5 h-5 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-2 focus:ring-indigo-500"
```

#### Badge Component

```typescript
// Status Badge
className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"

// Success
className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"

// Warning
className="bg-amber-500/20 text-amber-400 border border-amber-500/30"

// Error
className="bg-red-500/20 text-red-400 border border-red-500/30"

// Info
className="bg-blue-500/20 text-blue-400 border border-blue-500/30"

// Neutral
className="bg-slate-700/50 text-slate-300 border border-slate-600"
```

#### Timer Component

```typescript
// Circular Timer
<div className="relative w-24 h-24">
  <svg className="transform -rotate-90 w-24 h-24">
    <circle
      cx="48"
      cy="48"
      r="44"
      stroke="currentColor"
      strokeWidth="8"
      fill="none"
      className="text-slate-800"
    />
    <circle
      cx="48"
      cy="48"
      r="44"
      stroke="currentColor"
      strokeWidth="8"
      fill="none"
      className={timeLeft > 10 ? "text-emerald-500" : timeLeft > 5 ? "text-amber-500" : "text-red-500"}
      strokeDasharray={`${(timeLeft / totalTime) * 276} 276`}
      strokeLinecap="round"
    />
  </svg>
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-2xl font-bold">{timeLeft}s</span>
  </div>
</div>

// Linear Timer
<div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
  <div 
    className={`h-full transition-all duration-1000 ${timeLeft > 10 ? "bg-emerald-500" : timeLeft > 5 ? "bg-amber-500" : "bg-red-500"}`}
    style={{ width: `${(timeLeft / totalTime) * 100}%` }}
  />
</div>
```

#### Toast Notification Component

```typescript
// Toast Container
className="fixed top-4 right-4 z-50 flex flex-col gap-2"

// Success Toast
className="flex items-center gap-3 px-6 py-4 bg-emerald-500/90 backdrop-blur-sm text-white rounded-lg shadow-lg animate-slide-in"

// Error Toast
className="flex items-center gap-3 px-6 py-4 bg-red-500/90 backdrop-blur-sm text-white rounded-lg shadow-lg animate-slide-in"

// Info Toast
className="flex items-center gap-3 px-6 py-4 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg shadow-lg animate-slide-in"
```

### 3. Page-Specific Designs

#### Home Page (Landing)

**Layout:**
```
┌─────────────────────────────────────┐
│         Hero Section                │
│    "Quiz Platform"                  │
│    Subtitle text                    │
└─────────────────────────────────────┘
┌───────────┬───────────┬───────────┐
│   Host    │   Team    │ Spectator │
│   Card    │   Card    │   Card    │
│  [Icon]   │  [Icon]   │  [Icon]   │
│  Button   │  Button   │  Input    │
└───────────┴───────────┴───────────┘
```

**Styling:**
- Background: Subtle gradient from `slate-950` to `slate-900`
- Hero: Large centered text with subtle glow effect
- Cards: Elevated cards with hover lift effect
- Icons: Large (48px) with accent colors
- Spacing: Generous padding and gaps

#### Host Setup Dashboard

**Layout:**
```
┌─────────────────────────────────────┐
│  Header: Quiz ID + Navigation       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Progress Indicator (Setup Steps)   │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│  Teams Section   │ Domains Section  │
│  [Add Form]      │ [Add Form]       │
│  [Team Cards]    │ [Domain Cards]   │
└──────────────────┴──────────────────┘
┌─────────────────────────────────────┐
│  Questions Section                  │
│  [Add Form with Domain Select]      │
│  [Question List by Domain]          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Buzzer Questions Section           │
│  [Add Form]                         │
│  [Question List]                    │
└─────────────────────────────────────┘
```

**Key Improvements:**
- Collapsible sections for better organization
- Inline editing with smooth transitions
- Visual feedback for all actions
- Progress indicator showing setup completion
- Sticky header with quick actions

#### Control Dashboard

**Layout:**
```
┌─────────────────────────────────────┐
│  Header: Quiz Info + Quick Links    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Evaluation Panel (Prominent)       │
│  [Question Display]                 │
│  [Answer Options]                   │
│  [Action Buttons]                   │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│  Teams Grid      │  Leaderboard     │
│  [Team Cards]    │  [Ranked List]   │
└──────────────────┴──────────────────┘
┌─────────────────────────────────────┐
│  Quiz Controls                      │
│  [Start/Pause/Reset Buttons]        │
└─────────────────────────────────────┘
```

**Key Improvements:**
- Evaluation panel takes center stage
- Color-coded evaluation buttons
- Real-time leaderboard updates
- Compact team cards with essential info
- Status indicators with clear states

#### Team Interface

**Layout:**
```
┌─────────────────────────────────────┐
│  Team Header (Name + Score)         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Phase Indicator                    │
│  (Waiting/Answering/Results)        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Main Content Area                  │
│  - Question Display (large text)    │
│  - Timer (circular, prominent)      │
│  - Answer Input/Options             │
│  - Action Buttons                   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Status Messages / Feedback         │
└─────────────────────────────────────┘
```

**Key Improvements:**
- Large, touch-friendly buttons
- Prominent timer with color transitions
- Clear phase indicators
- Simplified waiting states
- Immediate feedback for actions

#### Spectator View

**Layout:**
```
┌─────────────────────────────────────┐
│  Header: Quiz Status + Commentary   │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│  Main Display    │  Leaderboard     │
│  (2/3 width)     │  (1/3 width)     │
│                  │                  │
│  Question        │  Team Rankings   │
│  Options         │  with Scores     │
│  Results         │                  │
│  Animations      │  Animated        │
│                  │  Updates         │
└──────────────────┴──────────────────┘
```

**Key Improvements:**
- Full-screen optimized layout
- Large, readable typography
- Animated transitions between phases
- Visual ranking indicators
- Color-coded results display

## Data Models

No changes to existing data models. The modernization is purely visual and does not affect the database schema or data structures.

### Existing Models (Reference)

- Quiz
- Team
- Domain
- Question
- BuzzerQuestion

All existing relationships and fields remain unchanged.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties. Many UI/UX requirements are visual design requirements that cannot be meaningfully tested through automated tests. The testable properties focus on:

1. **Accessibility compliance** - Color contrast, keyboard navigation, ARIA labels, semantic HTML
2. **Functional UI behavior** - Feedback display, loading states, responsive behavior
3. **Component presence** - Ensuring UI elements are rendered correctly

**Redundancy Analysis:**
- Multiple criteria about "displaying" elements (buttons, cards, badges) can be consolidated into component rendering tests
- Multiple criteria about color-coding (success/error/warning) can be consolidated into a single property about semantic color usage
- Multiple criteria about feedback (toasts, messages, confirmations) can be consolidated into a single property about user feedback
- Accessibility criteria (15.1-15.7) are related and can be grouped into comprehensive accessibility properties

**Properties to Implement:**
The following properties provide unique validation value and cover the testable acceptance criteria:

1. Color contrast compliance (WCAG AA)
2. Responsive touch target sizing
3. User feedback for actions
4. Timer color transitions
5. Input validation feedback
6. Loading state indicators
7. Keyboard accessibility
8. Semantic HTML usage
9. ARIA label presence
10. Focus indicator visibility
11. Multi-modal information conveyance
12. Text alternatives for icons
13. Zoom support without layout breakage
14. Empty state handling
15. Reduced motion preference support
16. Toast auto-dismiss behavior
17. Score difference calculation

### Correctness Properties

Since this is a UI/UX modernization focused on visual design and styling, most requirements are not amenable to traditional property-based testing. The properties below focus on accessibility, functional behavior, and component rendering that can be verified programmatically.

#### Property 1: Color Contrast Compliance

*For any* text element and its background, the color contrast ratio should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text 18px+).

**Validates: Requirements 1.7, 16.3**

**Implementation Note:** Use a color contrast checker library to verify all text/background combinations in the design system.

#### Property 2: Touch Target Minimum Size

*For any* interactive element (button, link, input) on mobile viewports (< 768px), the touch target should be at least 44x44 pixels.

**Validates: Requirements 7.5, 10.6**

**Implementation Note:** Check computed dimensions of interactive elements at mobile breakpoints.

#### Property 3: User Action Feedback

*For any* user action (submit, delete, update), the system should display appropriate feedback (toast, message, or status change) within 500ms.

**Validates: Requirements 3.6, 5.6, 11.1, 11.4, 11.5**

**Implementation Note:** Verify that feedback mechanisms are triggered after user actions complete.

#### Property 4: Timer Color Transitions

*For any* countdown timer, the color should transition from green (> 10s remaining) to yellow (5-10s) to red (< 5s).

**Validates: Requirements 5.5, 14.3**

**Implementation Note:** Check that timer components apply appropriate color classes based on time remaining.

#### Property 5: Input Validation Feedback

*For any* form input with validation rules, invalid input should display inline error messages.

**Validates: Requirements 9.3**

**Implementation Note:** Verify that validation errors are displayed adjacent to the input field.

#### Property 6: Loading State Indicators

*For any* asynchronous operation (data fetch, form submit), a loading indicator should be displayed while the operation is in progress.

**Validates: Requirements 10.4, 11.3, 17.1**

**Implementation Note:** Check that loading states are shown during async operations.

#### Property 7: Keyboard Navigation Support

*For any* interactive element, it should be reachable and operable via keyboard (Tab, Enter, Space, Arrow keys).

**Validates: Requirements 15.1**

**Implementation Note:** Verify that all interactive elements have proper tabindex and keyboard event handlers.

#### Property 8: Semantic HTML Usage

*For any* page section, appropriate semantic HTML elements should be used (header, nav, main, section, article, aside, footer).

**Validates: Requirements 15.2**

**Implementation Note:** Check that semantic HTML5 elements are used instead of generic divs where appropriate.

#### Property 9: ARIA Label Presence

*For any* icon-only button or non-text interactive element, an aria-label or aria-labelledby attribute should be present.

**Validates: Requirements 15.3, 15.6**

**Implementation Note:** Verify that non-text interactive elements have accessible labels.

#### Property 10: Focus Indicator Visibility

*For any* interactive element when focused, a visible focus indicator should be present (outline, ring, or border).

**Validates: Requirements 15.4**

**Implementation Note:** Check that focus styles are defined and visible (not outline: none without alternative).

#### Property 11: Multi-Modal Information Conveyance

*For any* information conveyed by color alone (success/error states), additional indicators should be present (icons, text, or patterns).

**Validates: Requirements 15.5**

**Implementation Note:** Verify that color-coded states also include text or icons.

#### Property 12: Icon Text Alternatives

*For any* icon used to convey information, either accompanying text or an aria-label should be present.

**Validates: Requirements 15.6**

**Implementation Note:** Check that icons have accessible text alternatives.

#### Property 13: Zoom Layout Stability

*For any* page at 200% browser zoom, the layout should remain functional without horizontal scrolling or overlapping content.

**Validates: Requirements 15.7**

**Implementation Note:** Test layouts at 200% zoom to ensure they don't break.

#### Property 14: Empty State Handling

*For any* data list that can be empty (teams, domains, questions), an empty state with a message and action should be displayed when no data exists.

**Validates: Requirements 17.2, 17.3, 17.4**

**Implementation Note:** Verify that empty states are rendered with helpful messages and actions.

#### Property 15: Reduced Motion Preference

*For any* animation or transition, if the user has prefers-reduced-motion enabled, animations should be disabled or significantly reduced.

**Validates: Requirements 8.7**

**Implementation Note:** Check that CSS respects the prefers-reduced-motion media query.

#### Property 16: Toast Auto-Dismiss

*For any* non-critical toast notification, it should automatically dismiss after 3-5 seconds.

**Validates: Requirements 11.7**

**Implementation Note:** Verify that toast notifications have auto-dismiss timers.

#### Property 17: Responsive Layout Adaptation

*For any* page, the layout should adapt appropriately at mobile (< 768px), tablet (768-1024px), and desktop (> 1024px) breakpoints.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Implementation Note:** Test that responsive classes are applied and layouts change at breakpoints.

## Error Handling

### Visual Error States

All error states should be clearly communicated through:
1. Color coding (red for errors)
2. Icon indicators (X or alert icons)
3. Descriptive text messages
4. Inline positioning (near the source of error)

### Form Validation Errors

- Display inline below the input field
- Use red text and border colors
- Include specific error message (not just "Invalid")
- Maintain error state until corrected

### Network Errors

- Display toast notifications for failed requests
- Provide retry buttons where appropriate
- Show loading states during retries
- Maintain user input on error (don't clear forms)

### Empty States

- Display friendly illustrations or icons
- Provide clear explanation of why empty
- Offer primary action to resolve (e.g., "Add Team")
- Use encouraging, helpful language

## Testing Strategy

### Visual Regression Testing

Since this is primarily a UI/UX modernization, visual regression testing is the most appropriate approach:

**Tools:**
- Percy or Chromatic for visual diff testing
- Storybook for component isolation
- Playwright for E2E visual testing

**Approach:**
1. Create baseline screenshots of all components and pages
2. Run visual diff tests on every PR
3. Review and approve visual changes
4. Maintain screenshot library for all breakpoints

### Accessibility Testing

**Automated Tools:**
- axe-core for accessibility violations
- Pa11y for WCAG compliance checking
- Lighthouse for accessibility audits

**Manual Testing:**
- Keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification
- Zoom testing (up to 200%)

### Component Testing

**Unit Tests:**
- Test that components render with correct classes
- Test that props control styling variants
- Test that conditional styling works correctly
- Test that responsive classes are applied

**Example Test Structure:**
```typescript
describe('Button Component', () => {
  it('should render with primary styles', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    expect(container.firstChild).toHaveClass('bg-indigo-600');
  });

  it('should render with disabled styles when disabled', () => {
    const { container } = render(<Button disabled>Click</Button>);
    expect(container.firstChild).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should have minimum touch target size', () => {
    const { container } = render(<Button>Click</Button>);
    const button = container.firstChild as HTMLElement;
    const { width, height } = button.getBoundingClientRect();
    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});
```

### Integration Testing

**E2E Tests:**
- Test complete user flows with new UI
- Verify that interactions work correctly
- Test responsive behavior at different viewports
- Verify that animations don't break functionality

**Focus Areas:**
- Host setup flow
- Team join and answer flow
- Spectator view updates
- Real-time updates with new UI

### Property-Based Testing

While most UI properties are visual and not suitable for PBT, some functional properties can be tested:

**Testable Properties:**
1. Color contrast ratios (generate random color combinations, verify contrast)
2. Touch target sizes (generate random button content, verify minimum size)
3. Keyboard navigation (generate random component trees, verify tab order)
4. ARIA labels (generate random icon buttons, verify labels present)

**Example Property Test:**
```typescript
import fc from 'fast-check';

describe('Color Contrast Property', () => {
  it('should maintain WCAG AA contrast for all text/background combinations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...textColors),
        fc.constantFrom(...backgroundColors),
        (textColor, bgColor) => {
          const contrast = calculateContrast(textColor, bgColor);
          const isLargeText = fontSize >= 18;
          const minContrast = isLargeText ? 3 : 4.5;
          expect(contrast).toBeGreaterThanOrEqual(minContrast);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Manual Testing Checklist

**Visual Quality:**
- [ ] All components match design system
- [ ] Spacing is consistent
- [ ] Colors are applied correctly
- [ ] Typography hierarchy is clear
- [ ] Shadows and borders are subtle
- [ ] Animations are smooth

**Responsive Design:**
- [ ] Mobile layout (320px, 375px, 414px)
- [ ] Tablet layout (768px, 1024px)
- [ ] Desktop layout (1280px, 1920px)
- [ ] No horizontal scrolling
- [ ] Touch targets are adequate

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Color contrast is sufficient
- [ ] Focus indicators are visible
- [ ] Zoom to 200% works

**Cross-Browser:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## Implementation Notes

### Tailwind Configuration

Update `tailwind.config.ts` to include custom design tokens:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette if needed
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

### Global Styles

Update `globals.css` with refined gradients and base styles:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-950 text-slate-50 antialiased;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    background-attachment: fixed;
  }
  
  /* Focus visible styles */
  *:focus-visible {
    @apply outline-none ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* Custom component classes can be added here */
}
```

### Component Extraction

Consider extracting common UI patterns into reusable components:

1. `Button.tsx` - Unified button component with variants
2. `Card.tsx` - Card component with variants
3. `Input.tsx` - Form input with validation
4. `Badge.tsx` - Status badge component
5. `Timer.tsx` - Circular and linear timer components
6. `Toast.tsx` - Toast notification component
7. `EmptyState.tsx` - Empty state component
8. `LoadingSpinner.tsx` - Loading indicator component

### Migration Strategy

1. **Phase 1: Foundation** - Update global styles, colors, typography
2. **Phase 2: Components** - Modernize shared components (buttons, cards, inputs)
3. **Phase 3: Pages** - Update each page/view one at a time
   - Home page
   - Host setup dashboard
   - Control dashboard
   - Team interface
   - Spectator view
4. **Phase 4: Polish** - Add animations, micro-interactions, final touches
5. **Phase 5: Testing** - Comprehensive testing and bug fixes

### Performance Considerations

- Use Tailwind's JIT mode for optimal CSS bundle size
- Lazy load animations library (Framer Motion) only where needed
- Optimize images and icons
- Use CSS transforms for animations (GPU accelerated)
- Minimize re-renders with proper React optimization

### Browser Support

Target modern browsers with CSS Grid and Flexbox support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

No IE11 support required (modern Next.js app).
