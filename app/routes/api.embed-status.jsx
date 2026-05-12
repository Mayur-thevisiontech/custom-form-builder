export const loader = async () => {
    return new Response(
        JSON.stringify({
            enabled: true,
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
};