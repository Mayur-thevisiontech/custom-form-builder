export const loader = async () => {
  return new Response(JSON.stringify({ message: "App ping works" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
