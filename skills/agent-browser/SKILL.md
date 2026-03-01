---
name: agent-browser
description: Automates browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, or extract information from web pages.
license: MIT
metadata:
  author: create-fast-stack
  version: "1.0.0"
---

# Agent Browser

Browser automation skill for AI-assisted web testing, visual verification, and data extraction using headless browser tools.

## When to Apply

Use this skill when:
- Running E2E or visual regression tests on frontend apps
- Taking screenshots for design review or bug reports
- Filling and submitting forms programmatically
- Extracting data from rendered web pages
- Verifying UI state after deployments
- Testing responsive layouts across viewports

## Core Capabilities

### Navigation & Interaction
- Navigate to URLs and wait for page load
- Click buttons, links, and interactive elements
- Fill input fields, select dropdowns, toggle checkboxes
- Handle modals, dialogs, and popups
- Wait for elements, network requests, or specific conditions

### Screenshots & Visual Verification
- Capture full-page or element-specific screenshots
- Compare screenshots against baselines for visual regression
- Capture viewport at multiple breakpoints (mobile, tablet, desktop)

### Data Extraction
- Extract text content from rendered DOM elements
- Read table data into structured formats
- Capture network responses and API calls
- Extract meta tags, Open Graph data, and SEO attributes

### Form Testing
- Fill complex multi-step forms
- Validate client-side form validation messages
- Test form submission and error states
- Handle file uploads and drag-and-drop

## Usage Patterns

### Basic Page Verification
```
1. Navigate to the target URL
2. Wait for the page to fully load
3. Take a screenshot for visual verification
4. Extract and validate key page content
```

### Form Interaction
```
1. Navigate to the form page
2. Fill each field with test data
3. Submit the form
4. Verify success/error state
5. Screenshot the result
```

### Responsive Testing
```
1. Set viewport to mobile (375x667)
2. Screenshot and verify layout
3. Set viewport to tablet (768x1024)
4. Screenshot and verify layout
5. Set viewport to desktop (1440x900)
6. Screenshot and verify layout
```

## Best Practices

- Always wait for elements before interacting (avoid flaky tests)
- Use semantic selectors (data-testid, aria-label, role) over CSS classes
- Take screenshots at key checkpoints for debugging
- Set reasonable timeouts (5-10s for page loads, 2-5s for elements)
- Clean up browser state between test scenarios
- Test on multiple viewport sizes for responsive verification
