import prisma from "../db.server";

export const loader = async ({ params }) => {
  const { id } = params;

  const form = await prisma.form.findFirst({
    where: { id: id }
  });

  if (form) {
    // Update lastSeenAt asynchronously to track storefront activity
    prisma.form.update({
      where: { id: form.id },
      data: { lastSeenAt: new Date() }
    }).catch(e => console.error("Failed to update lastSeenAt:", e));
  }

  if (!form) {
    return new Response(JSON.stringify({ error: "Form not found", code: "NOT_FOUND" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const isFormActive = form.active === true || form.active === 1 || form.active === "true";

  if (!isFormActive) {
    return new Response(JSON.stringify({ error: "Form is inactive. Please publish it from the dashboard.", code: "INACTIVE" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const responseData = {
    id: form.id,
    title: form.title,
    schema: typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema,
    settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings,
  };

  return new Response(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
};
