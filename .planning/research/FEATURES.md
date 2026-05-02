# Features Research: Shopify Custom Form Builder

## Table Stakes (Must-Have)
- **Field Types**:
  - Text, Email, Phone (with country code), URL.
  - Textarea (multi-line).
  - Select (Dropdown), Multi-select.
  - Checkbox, Radio buttons.
  - File Upload (Images, PDFs).
- **Form Builder**:
  - Drag-and-drop ordering.
  - Field settings (Label, Placeholder, Help Text, Required toggle).
- **Conditional Logic**:
  - Rule-based visibility (e.g., "Show field X if field Y contains 'value'").
- **Submissions**:
  - List view of all entries.
  - Detail view for each entry.
  - Email notifications to merchant.

## Differentiators (Should-Have)
- **Styling Customization**: Change colors and fonts to match the store theme via the App Block settings.
- **Export**: Export submissions to CSV/Excel.
- **Auto-Fill**: Use customer data (name/email) if the customer is logged in.

## Expected Behavior
- **File Uploads**: Files should be accessible via the admin for at least 30 days.
- **Responsiveness**: Forms must look perfect on mobile devices (90% of Shopify traffic).
- **Validation**: Real-time validation errors (e.g., invalid email format).

## Pitfalls to Avoid
- **Overcomplicating the Logic UI**: Keep the rule builder simple (If [Field] [Operator] [Value] then [Action] [Target]).
- **Slow Storefront Loading**: Optimize the bundle size for the storefront script.
