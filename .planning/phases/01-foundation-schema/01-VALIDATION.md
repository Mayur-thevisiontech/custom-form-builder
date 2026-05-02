# Phase 1: Foundation & Schema - Validation

**Phase:** 1
**Slug:** foundation-schema
**Date:** 2026-05-02

## Validation Strategy

### Dimension 1: Build & Types
- [ ] `npm run build` exits 0.
- [ ] `npx tsc` exits 0 (no type errors).

### Dimension 2: Functional Requirements
- [ ] **FND-01**: App initialized.
  - Verify: `shopify.app.toml` exists.
- [ ] **FND-02**: Prisma schema migrated.
  - Verify: `prisma/schema.prisma` contains `Form` and `Submission` models.
  - Verify: `npx prisma migrate status` shows no pending migrations.
- [ ] **FND-03**: App Proxy configured.
  - Verify: `shopify.app.toml` contains `[[proxies]]` block.

### Dimension 3: Success Criteria
- [ ] Success Criterion 1: App runs locally.
- [ ] Success Criterion 2: Prisma models work.
- [ ] Success Criterion 3: Proxy config exists.

## Verification Commands
- `ls shopify.app.toml`
- `grep "model Form" prisma/schema.prisma`
- `grep "[[proxies]]" shopify.app.toml`
- `npm run build`
