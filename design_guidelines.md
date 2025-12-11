# Design Guidelines: Admissions CRM for Addiction Treatment

## Design Approach

**Selected Approach**: Design System - Material Design Principles

**Justification**: This is a data-intensive, workflow-focused healthcare application where efficiency, clarity, and usability are paramount. The "grandmother-friendly" requirement and mobile-first constraint demand a proven, accessible design system. Material Design provides excellent patterns for forms, data display, and progressive workflows while maintaining professional credibility for healthcare contexts.

**Key Design Principles**:
- Mobile-first responsive design (optimized for phone use)
- Maximum clarity and readability (large touch targets, clear hierarchy)
- Progressive disclosure (show only what's needed at each pipeline stage)
- Persistent context (always show where user is in the workflow)

---

## Typography

**Font Family**: Inter or Roboto via Google Fonts CDN (excellent readability, professional healthcare tone)

**Type Scale** (mobile-optimized, large and clear):
- **Page Titles**: text-3xl font-bold (pipeline stage names, main headings)
- **Section Headers**: text-xl font-semibold (form sections, card headers)
- **Body Text/Labels**: text-base font-medium (form labels, descriptions)
- **Input Text**: text-lg (form inputs - larger for easy reading/typing)
- **Secondary Info**: text-sm (timestamps, metadata, helper text)
- **Buttons**: text-base font-semibold (clear, tappable)

**Line Height**: Use generous spacing (leading-relaxed for body text) to enhance readability on mobile screens.

---

## Layout System

**Spacing Primitives**: Tailwind units of **4, 6, 8, 12** (as in p-4, mb-6, gap-8, py-12)
- Standard spacing: gap-4, p-6
- Section separation: mb-8, py-12
- Component padding: p-6 (cards), p-4 (buttons)

**Container Strategy**:
- Mobile-first: Full-width with px-4 padding (max-w-full)
- Tablet+: max-w-4xl mx-auto (centered, comfortable reading width)
- Forms: max-w-2xl for optimal input layout

**Responsive Breakpoints**:
- Base (mobile): Single column, stacked layout
- md: Two-column for dashboard cards if space allows
- lg: Sidebar + main content for pipeline overview

---

## Component Library

### Core Navigation
- **Mobile Header**: Sticky top bar with app logo, current stage indicator, and hamburger menu
- **Pipeline Navigation**: Horizontal scrollable tabs or vertical list showing all stages with counts (e.g., "VOB (3)" for 3 pending items)
- **Back/Forward Buttons**: Large, clearly labeled navigation between forms/stages

### Dashboard/Pipeline View
- **Stage Cards**: Rounded cards (rounded-lg) with clear stage name, inquiry count, and list of active inquiries
- **Inquiry List Items**: Each inquiry shown as a card with client name, referral source badge, timestamp, and "Continue" button
- **Status Badges**: Small, rounded pills (rounded-full) indicating inquiry status (Viable, Pending VOB, Scheduled, etc.)

### Forms (Critical Component)
- **Input Fields**: 
  - Large touch-friendly inputs (min-h-12)
  - Clear labels above inputs (not floating labels for simplicity)
  - Generous padding within inputs (px-4 py-3)
  - Single-column stacked layout for mobile
- **Text Areas**: For notes, min-h-32 with visible border
- **Select Dropdowns**: Large, native mobile-friendly selects with clear options
- **Date Pickers**: Use native HTML5 date inputs for mobile optimization
- **Required Field Indicators**: Simple asterisk (*) next to label, not subtle

### Buttons & Actions
- **Primary Actions**: Full-width on mobile (w-full md:w-auto), large (py-3 px-6), rounded-lg
- **Secondary Actions**: Outlined style, same size as primary
- **Destructive Actions** (e.g., "Mark Non-Viable"): Visually distinct treatment
- **Button Groups**: Stacked vertically on mobile (space-y-4), horizontal on tablet+ (space-x-4)

### Data Display
- **Info Cards**: Clean cards with label-value pairs, generous spacing between items (space-y-4)
- **Summary Blocks**: Box with key admission details in readable format (border, p-6, rounded-lg)
- **Copy-to-Clipboard**: Icon button next to generated admission summaries

### Pipeline Stage Indicators
- **Progress Bar/Stepper**: Visual representation of current stage in the admission pipeline
- **Stage Completion Checkmarks**: Clear visual feedback for completed stages

### Modals/Overlays
- **Non-Viable Reason Selector**: Full-screen on mobile, modal on desktop, with large radio buttons or cards for each reason
- **Confirmation Dialogs**: Simple, centered overlays with clear "Confirm" and "Cancel" actions

### AI Transcription Feature
- **File Upload Area**: Large dropzone (min-h-48) with clear "Upload Recording" text and icon
- **Processing Indicator**: Loading spinner with "Transcribing call..." message
- **Review Panel**: Auto-filled fields highlighted with subtle indicator, editable with clear "Edit" affordance

---

## Animations

**Minimal, Functional Only**:
- **Stage Transitions**: Simple fade (200ms) when moving between pipeline stages
- **Form Submission**: Brief loading spinner on button during save
- **Success Feedback**: Quick checkmark animation (300ms) when inquiry is saved/updated
- **No decorative animations**: Focus on speed and clarity over visual flair

---

## Mobile-Specific Considerations

- **Touch Targets**: Minimum 44px height for all interactive elements
- **Thumb-Friendly**: Primary actions positioned in easy-to-reach zones (bottom of screen when appropriate)
- **Scrolling**: Allow natural scrolling; avoid fixed positioning except for critical navigation
- **Form Navigation**: Sticky "Save" or "Next" button at bottom of long forms
- **Keyboard Avoidance**: Ensure important CTAs remain visible when mobile keyboard is open

---

## Images

**No images required** - This is a data-entry application where clarity and efficiency take precedence over visual marketing elements. The interface should be clean, functional, and focused entirely on the workflow.