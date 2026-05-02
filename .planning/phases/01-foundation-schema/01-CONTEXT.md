# Phase 1: Foundation & Schema - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary
This phase establishes the base Shopify Remix application, configures the database schema for forms and submissions, and sets up the necessary app proxy for storefront communication.

### Success Criteria
1. Shopify Remix app is initialized and runs locally.
2. Prisma schema is migrated with Form and Submission tables (using JSON for dynamic fields).
3. App Proxy is configured in `shopify.app.toml`.
</domain>

<decisions>
## Implementation Decisions

### App Initialization
- **Framework**: Shopify Remix App Template (TypeScript).
- **App Name**: "Custom Form Builder".
- **Scopes**: `read_products`, `write_files` (for uploads).

### Database (Prisma)
- **Form Table**: Stores `title`, `handle`, `schema` (JSON), `settings` (JSON).
- **Submission Table**: Stores `formId` (FK), `data` (JSON).
- **Rationale**: JSON fields allow for maximum flexibility in the form builder without complex migrations for every new field type.

### Storefront Connectivity
- **App Proxy Path**: `/apps/custom-form-builder`.
- **Purpose**: Securely handle form submissions from the storefront to the app backend.

### UI/UX
- **Admin**: Polaris (latest version).
- **Icons**: Polaris Icons.
</decisions>

<canonical_refs>
## Canonical References
- `PROJECT.md`: High-level goals.
- `REQUIREMENTS.md`: Detailed v1 requirements.
- `ROADMAP.md`: Phase sequence.
</canonical_refs>

<specifics>
## Specific Ideas
- Use `npx create-shopify-app@latest` to ensure we have the most up-to-date starting point.
- Ensure the `.env` is properly populated for local development.
</specifics>

<deferred>
## Deferred Ideas
- Production database setup (sticking to SQLite for Phase 1).
- Advanced auth / custom sessions (sticking to standard Shopify auth).
</deferred>

---
*Phase: 01-foundation-schema*
*Context gathered: 2026-05-02*
