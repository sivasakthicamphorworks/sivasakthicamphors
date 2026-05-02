export async function onRequest(context) {
  const { env } = context;
  // Use environment variable for the Apps Script Web App URL
  const SCRIPT_URL = env.APPS_SCRIPT_URL;

  if (!SCRIPT_URL) {
    return new Response(JSON.stringify({ error: 'APPS_SCRIPT_URL not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = `${SCRIPT_URL}?action=products`;

  try {
    // Use Cloudflare Edge Caching for the Apps Script subrequest (Cache for 10 minutes)
    const response = await fetch(url, {
      cf: {
        cacheTtl: 600,
        cacheEverything: true
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Google Apps Script error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        // Tell the user's browser to cache this for 5 minutes
        'Cache-Control': 'public, max-age=300'
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch products: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

