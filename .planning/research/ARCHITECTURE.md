# Architecture Research: Shopify Custom Form Builder

## System Overview
The app follows the standard Shopify Remix architecture but adds a dynamic rendering layer for the storefront.

## Data Model (Prisma)

### Form
- `id`: String (UUID)
- `shop`: String (Shop domain)
- `title`: String
- `schema`: JSON (Stores fields, types, options, and logic)
- `settings`: JSON (Success message, button text, theme settings)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Submission
- `id`: String (UUID)
- `formId`: String (FK)
- `data`: JSON (Stores all field values)
- `customerInfo`: JSON (Optional: customer ID, email if logged in)
- `createdAt`: DateTime

## Storefront Integration
1. **App Block (Liquid)**: Captures the `formId` selected by the merchant.
2. **App Proxy**: All form submissions go through an App Proxy route (`/apps/custom-form-builder/submit`) to bypass CORS and ensure secure handling.
3. **JS Renderer**: A bundled JS file (hosted as an asset in the extension) that fetches the form schema and renders the UI dynamically.

## Handling File Uploads
- Use a two-step process:
  1. Client uploads to a temporary signed URL or a direct proxy route.
  2. Server moves the file to Shopify's Files API or an S3 bucket and saves the URL in the submission data.

## Conditional Logic Engine
- A dedicated JS utility that takes the current form state and rules, returning an array of "currently visible" field IDs. This should be shared between the Builder (for preview) and the Storefront Renderer.
