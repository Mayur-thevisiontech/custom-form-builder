# Phase 3: Form Builder UI - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary
This phase expands the form builder to support a variety of input types beyond simple text fields. It includes UI for configuring field-specific properties (like options for dropdowns) and ensuring the data structure remains consistent.

### Success Criteria
1. Builder supports: `text`, `email`, `textarea`, `checkbox`, `radio`, `select`, `file`, `phone`.
2. Options editor for `radio`, `select`, and `checkbox` (multiple choice).
3. Field type can be changed after adding a field.
4. Preview updates based on field type.
</domain>

<decisions>
## Implementation Decisions

### Field Schema
Extended schema:
- `id`: Unique identifier.
- `type`: Enum (text, email, textarea, checkbox, radio, select, file, phone).
- `label`: Display label.
- `required`: Boolean.
- `options`: Array of strings (only for choice types).
- `deletable`: Boolean (fixed for First Name/Email).

### UI Components
- `Select` for choosing field type.
- Conditional rendering in the field editor for `options` list.
- `TextField` for label and individual options.
</decisions>

<canonical_refs>
## Canonical References
- `REQUIREMENTS.md`: BLD-02.
- `ROADMAP.md`: Phase 3.
</canonical_refs>

---
*Phase: 03-form-builder-ui*
*Context gathered: 2026-05-02*
