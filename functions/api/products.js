export async function onRequest(context) {
  const { env } = context;
  // Use environment variable for security, with a fallback for initial testing
  const API_ID = env.PRODUCTS_API_ID || 'n5nagleb2znaw';
  const url = `https://sheetdb.io/api/v1/${API_ID}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'SheetDB API error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Allow for local testing if needed
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch products: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
