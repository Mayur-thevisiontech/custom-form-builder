# Phase 1: Foundation & Schema - Research

## Objective
Establish the project foundation using the official Shopify Remix template and define the data structures for forms and submissions.

## Findings

### 1. Project Initialization
- **Command**: `npx create-shopify-app@latest --template remix --name "custom-form-builder" --path . --yes`
- **Note**: Since the current directory already has `.git` and `.planning`, we need to ensure the template doesn't conflict. Usually, it's better to run it in the root.
- **Scaffold**: The template includes Remix, Prisma, Polaris, and App Bridge by default.

### 2. Prisma JSON Fields
- Prisma supports `Json` type for SQLite (stored as a string) and Postgres (native JSONB).
- **Schema Suggestion**:
```prisma
model Form {
  id        String   @id @default(uuid())
  shop      String
  title     String
  handle    String   @unique
  schema    Json     // [{id: "1", type: "text", label: "Name", logic: {...}}, ...]
  settings  Json     // {submitButtonText: "Send", successMessage: "Thank you!"}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Submission {
  id        String   @id @default(uuid())
  formId    String
  data      Json     // {name: "John", email: "john@example.com"}
  createdAt DateTime @default(now())
}
```

### 3. App Proxy Setup
- **File**: `shopify.app.toml`
- **Config**:
```toml
[[proxies]]
url = "/apps/custom-form-builder"
subpath = "submit"
prefix = "apps"
```
- **Note**: The proxy will route requests to `app/routes/api.submit.jsx` (or similar).

### 4. Scopes
- Required: `read_products` (standard), `write_files` (for user file uploads).

## Validation Architecture
- **FND-01**: Check for `package.json`, `remix.config.js`, and `shopify.app.toml`.
- **FND-02**: Run `npx prisma validate` and verify `schema.prisma`.
- **FND-03**: Verify proxy block in `shopify.app.toml`.

## Success Criteria (Must Haves)
- [ ] App structure initialized.
- [ ] Prisma models defined and migrated.
- [ ] App Proxy configured.
