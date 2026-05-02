# Phase 2: Core Admin UI - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary
This phase implements the primary form management interface. It includes a dashboard listing existing forms and a dedicated "New Form" page where users can define form names, add fields, and customize the submit button.

### Success Criteria
1. `/app/forms` page displays a list of existing forms.
2. `/app/forms/new` allows creating a new form with a title and default fields (First Name, Email).
3. "First Name" and "Email" fields are non-deletable in the builder.
4. Submit button customization (text/color) is available.
5. Forms are saved to the database.
</domain>

<decisions>
## Implementation Decisions

### Page Structure
- **app.forms.jsx**: List view with "Create Form" button.
- **app.forms.new.jsx**: Multi-step or single-page form builder.
- **app.forms.$id.jsx**: Edit view (reuse builder component).

### Form Builder Logic
- **Default Fields**: `[ {id: 'first_name', type: 'text', label: 'First Name', required: true, deletable: false}, {id: 'email', type: 'email', label: 'Email', required: true, deletable: false} ]`.
- **Validation**: Form Name must be unique and non-empty.
- **State Management**: React `useState` for local builder state, `useFetcher` for persistence.

### UI Components (Polaris)
- `IndexTable` for form listing.
- `Page`, `Layout`, `LegacyCard` for layout.
- `TextField`, `Select` for field configuration.
- `ColorPicker` or simple `Select` for button color customization.
</decisions>

<canonical_refs>
## Canonical References
- `REQUIREMENTS.md`: BLD-01.
- `ROADMAP.md`: Phase 2.
</canonical_refs>

<specifics>
## Specific Ideas
- Automatically generate a `handle` from the form `title`.
- Use `shopify.toast` for success feedback.
</specifics>

<deferred>
## Deferred Ideas
- Drag-and-drop reordering (Phase 3).
- Conditional logic (Phase 4).
</deferred>

---
*Phase: 02-core-admin-ui*
*Context gathered: 2026-05-02*
