export const loader = async () => {
  return new Response(JSON.stringify({ message: "Simple API is working" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
