# Pitfalls Research: Shopify Custom Form Builder

## Technical Gotchas

### 1. Storefront Performance
- **Issue**: Large JS bundles for simple forms slow down the store.
- **Mitigation**: Use Preact for rendering or very optimized vanilla JS. Avoid heavy libraries like full Bootstrap or Material UI. Stick to Polaris-like CSS in the extension.

### 2. File Upload Limits
- **Issue**: Shopify App Proxy has a payload size limit (usually around 10MB-20MB).
- **Mitigation**: For large files, consider direct-to-S3 uploads or warn users about limits.

### 3. Theme CSS Conflicts
- **Issue**: Store themes often have aggressive global CSS that breaks form layouts.
- **Mitigation**: Use CSS Shadow DOM or very specific BEM naming conventions to isolate form styles.

### 4. Spam Submissions
- **Issue**: Public forms are targets for bots.
- **Mitigation**: Implement a basic Honeypot field or integrate Shopify's built-in bot protection if available.

### 5. Liquid Limitations
- **Issue**: You cannot run complex logic in Liquid for dynamic forms.
- **Mitigation**: Liquid should only provide the container and initial configuration; JS must handle the dynamic parts.

## Merchant Experience Pitfalls
- **Confusing Builder**: If the builder is too abstract, merchants will struggle. Use visual previews.
- **Data Privacy**: Ensure merchants know where the data is stored (GDPR/CCPA compliance).
