import prisma from "../db.server";

export const loader = async ({ params, request }) => {
  const { id } = params;

  const forms = await prisma.$queryRaw`SELECT * FROM Form WHERE id = ${id} LIMIT 1`;
  const form = forms && forms.length > 0 ? forms[0] : null;

  const isFormActive = form && (form.active === true || form.active === 1 || form.active === "true");

  if (!form) {
    return new Response(JSON.stringify({ error: "Form not found", code: "NOT_FOUND" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (!isFormActive) {
    return new Response(JSON.stringify({ error: "Form is inactive. Please publish it from the dashboard.", code: "INACTIVE" }), {
      status: 403, // Use 403 for inactive to distinguish from 404
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const responseData = {
    title: form.title,
    schema: typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema,
    settings: typeof form.settings === 'string' ? JSON.parse(form.settings) : form.settings,
  };

  return new Response(JSON.stringify(responseData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
