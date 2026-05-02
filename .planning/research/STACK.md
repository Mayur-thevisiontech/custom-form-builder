# Stack Research: Shopify Custom Form Builder

## Overview
The project will use the modern Shopify App ecosystem (Remix) to ensure high performance, security, and developer productivity.

## Recommended Stack

### Core Framework
- **Shopify Remix Template**: The standard for building Shopify apps in 2025/2026.
- **Node.js**: LTS version.
- **TypeScript**: For type safety, especially critical for complex form schemas.

### Frontend (Admin)
- **Shopify Polaris**: For a native-feeling UI.
- **React Hook Form**: For managing complex builder state.
- **Dnd Kit**: For drag-and-drop functionality in the form builder.

### Frontend (Storefront)
- **Theme App Extensions (App Blocks)**: To embed forms without modifying theme code.
- **Liquid + Preact/React**: Using a lightweight React-like library or standard React to render the dynamic form and handle conditional logic.

### Backend & Database
- **Prisma ORM**: For database management.
- **SQLite (Development)**: Included in the Remix template.
- **Postgres (Production)**: Recommended for scaling.
- **Zod**: For runtime validation of form schemas and submissions.

### Utilities
- **i18n-iso-countries**: For the country code selection.
- **date-fns**: For submission date formatting.

## Confidence Level
- **High**: This is the standard, well-supported stack for Shopify apps.

## Rationale
- Using the official Remix template ensures we have the latest App Bridge and security features.
- Polaris is mandatory for a premium merchant experience.
- Prisma makes schema migrations seamless.
