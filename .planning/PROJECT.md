# Custom Form Builder

## Context
A Shopify application that allows merchants to create custom forms for their storefront. The app features a drag-and-drop or structured form builder interface in the admin and renders these forms via Theme App Extensions (App Blocks). It supports various input types, conditional logic, and submission management.

## Core Value
Empower Shopify merchants to collect specialized data from customers without needing to code, providing a seamless Polaris-based admin experience and a responsive storefront presence.

## What This Is
- A Shopify Remix app with a database for storing form definitions and submissions.
- A Polaris-based form builder with support for:
  - Textbox, Radiobutton, Checkbox, File upload, Phone number (with country code), Email, Textarea, Dropdown, URL.
- Conditional logic (show/hide fields based on rules).
- Theme App Extension for storefront rendering.
- Admin dashboard to view and manage form submissions.

## What This Is Not
- A full-blown CRM system.
- A marketing automation tool (though it could integrate with them later).
- A checkout replacement.

## Requirements

### Validated
(None yet — ship to validate)

### Active
- [ ] Initialize Shopify Remix App project.
- [ ] Design and implement Database Schema (Forms, Fields, Submissions).
- [ ] Build the Form Builder Admin UI (Polaris).
- [ ] Implement Conditional Logic engine for forms.
- [ ] Create Theme App Extension (App Block) for storefront rendering.
- [ ] Build Submissions Dashboard in Admin.
- [ ] Implement File Upload handling (Shopify Files API).
- [ ] Ensure full responsiveness for both Admin and Storefront.

### Out of Scope
- Multi-language form translations (initial version).
- Payment processing within forms.
- Complex multi-page forms (sticking to single-page initially).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| UI Library: Polaris | Official Shopify design system, ensures native feel. | Pending |
| Logic: Conditional Fields | Highly requested feature for dynamic forms. | Pending |
| Storage: Prisma/SQLite | Standard, lightweight, and scalable within Shopify's ecosystem. | Pending |

## Evolution
This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-05-02 after initialization*
