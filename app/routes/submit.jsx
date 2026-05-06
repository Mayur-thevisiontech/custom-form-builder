import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  // We can't use authenticate.admin because it's a proxy request from the storefront
  // But we can use authenticate.public.appProxy if available, or just handle it manually

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

  const submission = await prisma.submission.create({
    data: {
      formId,
      data: typeof data === 'object' ? JSON.stringify(data) : data,
    }
  });

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
