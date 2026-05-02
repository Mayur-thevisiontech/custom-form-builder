# Roadmap: Custom Form Builder

## Overview
This roadmap outlines the journey from an empty directory to a fully functional Shopify Form Builder. We will start by setting up the foundation, then build the admin interfaces for form management and creation, implement the dynamic logic engine, and finally bridge everything to the storefront via a Theme App Extension.

## Phases

- [ ] **Phase 1: Foundation & Schema** - Initialize project and define data structures.
- [ ] **Phase 2: Core Admin UI** - Basic form management (CRUD) and dashboard.
- [ ] **Phase 3: Form Builder UI** - Drag-and-drop field editor with configuration.
- [ ] **Phase 4: Logic & Validation** - Implementation of conditional visibility and input rules.
- [ ] **Phase 5: Storefront Integration** - Theme App Extension and dynamic renderer.
- [ ] **Phase 6: Data & Polish** - Submission management, CSV export, and responsive audit.

## Phase Details

### Phase 1: Foundation & Schema
**Goal**: Establish the development environment and core data models.
**Depends on**: Nothing
**Requirements**: FND-01, FND-02, FND-03
**Success Criteria**:
  1. Shopify Remix app is initialized and runs locally.
  2. Prisma schema is migrated with Form and Submission tables.
  3. App Proxy is configured in shopify.app.toml.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Initialize Shopify Remix App and set up environment.
- [ ] 01-02: Define and migrate Prisma schema.

### Phase 2: Core Admin UI
**Goal**: Create the high-level management interface for forms.
**Depends on**: Phase 1
**Requirements**: BLD-01
**Success Criteria**:
  1. User can see a list of forms on the app home page.
  2. User can create a new form (basic metadata) and delete existing ones.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Build Form Listing and Create/Delete actions.
- [ ] 02-02: Implement basic form settings page (Title, Settings).

### Phase 3: Form Builder UI
**Goal**: Build the interactive editor for form fields.
**Depends on**: Phase 2
**Requirements**: BLD-02, BLD-03, BLD-04
**Success Criteria**:
  1. User can add fields of various types to a form.
  2. User can drag and drop fields to reorder them.
  3. User can configure individual field properties (labels, placeholders).
**Plans**: 3 plans

Plans:
- [ ] 03-01: Implement Field adding and basic configuration UI.
- [ ] 03-02: Integrate Dnd-kit for field reordering.
- [ ] 03-03: Finalize all v1 field types (Textbox to Radio).

### Phase 4: Logic & Validation
**Goal**: Add dynamic behavior to forms.
**Depends on**: Phase 3
**Requirements**: BLD-05
**Success Criteria**:
  1. User can define "Show/Hide" rules for fields in the builder.
  2. The form preview reflects the conditional logic correctly.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Build the Conditional Logic rule editor UI.
- [ ] 04-02: Implement the logic evaluation engine.

### Phase 5: Storefront Integration
**Goal**: Render forms on the customer-facing store.
**Depends on**: Phase 4
**Requirements**: EXT-01, EXT-02, EXT-03, EXT-04, EXT-05
**Success Criteria**:
  1. App Block can be added to a theme in the editor.
  2. Form renders correctly on the storefront with dynamic validation.
  3. Conditional logic works as expected on the storefront.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Create Theme App Extension and basic Liquid block.
- [ ] 05-02: Build the storefront JS renderer (Preact/React).
- [ ] 05-03: Implement secure form submission via App Proxy.

### Phase 6: Data & Polish
**Goal**: Close the loop on submissions and ensure quality.
**Depends on**: Phase 5
**Requirements**: DAT-01, DAT-02, DAT-03, DAT-04
**Success Criteria**:
  1. Admin can view submissions with file attachments.
  2. Submissions can be exported to CSV.
  3. Responsive audit passes on mobile devices.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Build Submission management and detail views.
- [ ] 06-02: Implement CSV export and final responsive polish.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Schema | 0/2 | Not started | - |
| 2. Core Admin UI | 0/2 | Not started | - |
| 3. Form Builder UI | 0/3 | Not started | - |
| 4. Logic & Validation | 0/2 | Not started | - |
| 5. Storefront Integration | 0/3 | Not started | - |
| 6. Data & Polish | 0/2 | Not started | - |
