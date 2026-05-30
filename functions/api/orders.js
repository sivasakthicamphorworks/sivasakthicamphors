export async function onRequest(context) {
  const { request, env } = context;
  const SCRIPT_URL = env.APPS_SCRIPT_URL;

  // Handle CORS OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (!SCRIPT_URL) {
    return new Response(JSON.stringify({ error: 'APPS_SCRIPT_URL not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Handle GET request to retrieve a single order's details
  if (request.method === 'GET') {
    const urlParams = new URL(request.url).searchParams;
    const orderId = urlParams.get('order_id');

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Forward the GET request to Google Apps Script
    const url = `${SCRIPT_URL}?action=getOrder&orderId=${encodeURIComponent(orderId)}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Apps Script returned status ${response.status}` }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch order: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  // Handle POST request to submit a new order
  if (request.method === 'POST') {
    const url = `${SCRIPT_URL}?action=orders`;

    try {
      const body = await request.json();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Apps Script returned status ${response.status}` }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to submit order: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
