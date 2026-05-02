# Requirements: Custom Form Builder

**Defined:** 2026-05-02
**Core Value:** Empower Shopify merchants to collect specialized data from customers without needing to code, providing a seamless Polaris-based admin experience and a responsive storefront presence.

## v1 Requirements

### Foundation
- [x] **FND-01**: Initialize Shopify Remix App with TypeScript.
- [x] **FND-02**: Set up Prisma schema for Forms and Submissions.
- [x] **FND-03**: Configure App Proxy for secure storefront submissions.

### Form Builder (Admin)
- [ ] **BLD-01**: Admin can create, edit, and delete forms.
- [ ] **BLD-02**: Admin can drag and drop fields to reorder them.
- [ ] **BLD-03**: Support field types: Text, Email, Tel (with country code), URL, Textarea, Select, Checkbox, Radio.
- [ ] **BLD-04**: Admin can set field properties (Label, Placeholder, Required).
- [ ] **BLD-05**: Admin can configure conditional logic (Show/Hide fields based on rules).

### Storefront Extension
- [ ] **EXT-01**: Create Theme App Extension (App Block) for theme embedding.
- [ ] **EXT-02**: Render forms dynamically based on ID in the App Block.
- [ ] **EXT-03**: Implement conditional logic visibility engine in the storefront renderer.
- [ ] **EXT-04**: Handle form validation and error messaging on the storefront.
- [ ] **EXT-05**: Ensure full responsiveness across mobile and desktop.

### Data Management
- [ ] **DAT-01**: Handle file uploads securely via Shopify Files API.
- [ ] **DAT-02**: Admin can view a list of all submissions for a form.
- [ ] **DAT-03**: Admin can view the details of a specific submission.
- [ ] **DAT-04**: Export submissions to CSV.

## v2 Requirements
- **V2-01**: Multi-page forms.
- **V2-02**: Email notifications for customers after submission.
- **V2-03**: Integration with 3rd party marketing tools (e.g., Mailchimp).
- **V2-04**: Captcha/Spam protection (Honeypot as fallback for v1).

## Out of Scope
| Feature | Reason |
|---------|--------|
| Payment Integration | High complexity for initial release; focus on data collection first. |
| Custom CSS for merchants | Theme settings in App Block provide enough styling for v1. |
| Analytics Dashboard | Basic submission counting is enough; full analytics deferred to v2. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Complete |
| FND-02 | Phase 1 | Complete |
| FND-03 | Phase 1 | Complete |
| BLD-01 | Phase 2 | Pending |
| BLD-02 | Phase 3 | Pending |
| BLD-03 | Phase 3 | Pending |
| BLD-04 | Phase 3 | Pending |
| BLD-05 | Phase 4 | Pending |
| EXT-01 | Phase 5 | Pending |
| EXT-02 | Phase 5 | Pending |
| EXT-03 | Phase 5 | Pending |
| EXT-04 | Phase 5 | Pending |
| EXT-05 | Phase 5 | Pending |
| DAT-01 | Phase 6 | Pending |
| DAT-02 | Phase 6 | Pending |
| DAT-03 | Phase 6 | Pending |
| DAT-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-02*
*Last updated: 2026-05-02 after initial definition*
