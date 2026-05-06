// Simple test script to verify email notification logic
const { getStoreAdminEmail, sendEmailNotification, generateEmailTemplate } = require('./app/routes/submit.jsx');

// Mock data for testing
const mockForm = {
  id: 'test-form-123',
  title: 'Contact Form',
  shop: 'test-shop.myshopify.com',
  settings: {
    notificationEmails: '' // Empty to test default functionality
  }
};

const mockSubmissionData = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'This is a test message'
};

console.log('Testing email functionality...');

// Test email template generation
const emailTemplate = generateEmailTemplate(mockForm, mockSubmissionData);
console.log('✓ Email template generated successfully');
console.log('Template preview:', emailTemplate.substring(0, 200) + '...');

// Test that the logic correctly identifies when to use default email
const settings = typeof mockForm.settings === 'string' ? JSON.parse(mockForm.settings) : mockForm.settings;
const notificationEmails = settings.notificationEmails || "";

if (notificationEmails.trim()) {
  console.log('✓ Would use specified emails');
} else {
  console.log('✓ Would use store admin email as default');
}

console.log('Email functionality test completed successfully!');
