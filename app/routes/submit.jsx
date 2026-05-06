import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// Helper function to get store admin email using Shopify Admin API
async function getStoreAdminEmail(shop) {
  try {
    // Get a valid session for this shop
    const sessions = await prisma.session.findMany({
      where: { 
        shop: shop,
        isOnline: true
      },
      orderBy: { expires: 'desc' },
      take: 1
    });

    if (sessions.length === 0) {
      console.error("No active session found for shop:", shop);
      return null;
    }

    const session = sessions[0];
    
    // Create a mock session object for authenticate.admin
    const mockSession = {
      shop: shop,
      accessToken: session.accessToken,
      scope: session.scope
    };

    const { admin } = await authenticate.admin(
      new Request(`https://${shop}/admin`, {
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { session: mockSession }
    );
    
    const response = await admin.rest.resources.Shop.all({
      session: mockSession,
    });
    
    if (response && response.length > 0) {
      return response[0].contactEmail;
    }
  } catch (error) {
    console.error("Error fetching store admin email:", error);
  }
  return null;
}

// Helper function to generate email template
function generateEmailTemplate(form, submissionData) {
  const submission = typeof submissionData === 'string' ? JSON.parse(submissionData) : submissionData;
  
  let fieldsHtml = '';
  for (const [key, value] of Object.entries(submission)) {
    if (Array.isArray(value)) {
      fieldsHtml += `<p><strong>${key}:</strong> ${value.join(', ')}</p>`;
    } else {
      fieldsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #008060; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .field { margin-bottom: 15px; padding: 10px; background-color: white; border-left: 4px solid #008060; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Form Submission</h1>
          <h2>${form.title}</h2>
        </div>
        <div class="content">
          <p>A new submission has been received for your form "${form.title}".</p>
          <div class="fields">
            ${fieldsHtml}
          </div>
        </div>
        <div class="footer">
          <p>This email was sent automatically from your Shopify Custom Form Builder app.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to send email notifications
async function sendEmailNotification(form, submissionData, recipientEmails) {
  // This is a placeholder for email sending functionality
  // In a real implementation, you would integrate with an email service like:
  // - SendGrid, Nodemailer, or Shopify's own email service
  console.log(`Email notification would be sent to: ${recipientEmails.join(", ")}`);
  console.log(`Form: ${form.title}`);
  console.log(`Submission data:`, JSON.stringify(submissionData, null, 2));
  
  // Generate email content
  const emailHtml = generateEmailTemplate(form, submissionData);
  const subject = `New Form Submission: ${form.title}`;
  
  // TODO: Implement actual email sending logic
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // 
  // const msg = {
  //   to: recipientEmails,
  //   from: process.env.FROM_EMAIL,
  //   subject: subject,
  //   html: emailHtml,
  // };
  // 
  // await sgMail.send(msg);
  
  // Example with Nodemailer:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransporter({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS
  //   }
  // });
  // 
  // await transporter.sendMail({
  //   from: process.env.FROM_EMAIL,
  //   to: recipientEmails.join(', '),
  //   subject: subject,
  //   html: emailHtml
  // });
}

export const action = async ({ request }) => {
  const body = await request.json();
  const { formId, data } = body;

  if (!formId || !data) {
    return new Response(JSON.stringify({ error: "Missing formId or data" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Get the form to access notification settings
  const form = await prisma.form.findUnique({
    where: { id: formId }
  });

  if (!form) {
    return new Response(JSON.stringify({ error: "Form not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Create the submission
  const submission = await prisma.submission.create({
    data: {
      formId,
      data: typeof data === 'object' ? JSON.stringify(data) : data,
    }
  });

  // Handle email notifications
  try {
    const settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings;
    let notificationEmails = settings.notificationEmails || "";
    
    let recipientEmails = [];
    
    if (notificationEmails.trim()) {
      // Use the emails specified in the form settings
      recipientEmails = notificationEmails.split(",").map(email => email.trim()).filter(email => email);
    } else {
      // No emails specified, use store admin email as default
      const storeAdminEmail = await getStoreAdminEmail(form.shop);
      if (storeAdminEmail) {
        recipientEmails = [storeAdminEmail];
        console.log(`Using store admin email as default: ${storeAdminEmail}`);
      } else {
        console.warn("No notification emails specified and could not retrieve store admin email");
      }
    }

    if (recipientEmails.length > 0) {
      await sendEmailNotification(form, data, recipientEmails);
    }
  } catch (error) {
    console.error("Error handling email notifications:", error);
    // Don't fail the submission if email sending fails
  }

  const responseData = { success: true, submissionId: submission.id };
  return new Response(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

// Also handle OPTIONS for CORS
export const loader = async () => {
  return new Response(JSON.stringify({ message: "Ready for submissions" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
