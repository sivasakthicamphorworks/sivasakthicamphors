export async function onRequest(context) {
  const { request } = context;

  // Handle CORS OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const urlParams = new URL(request.url).searchParams;
  const pincode = urlParams.get('pincode');

  // Validate format (must be 6 digits)
  if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
    return new Response(
      JSON.stringify([{ Status: 'Error', Message: 'Invalid pincode format' }]),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Use the ultra-fast and reliable GitHub Pages API (soured from official data.gov.in)
  const apiUrl = `https://aniket-thapa.github.io/india-pincode-api/pincodes/${pincode}.json`;

  try {
    const response = await fetch(apiUrl, {
      cf: {
        cacheTtl: 86400, // Cache for 24 hours at the Cloudflare edge
        cacheEverything: true,
      },
    });

    // If pincode is not found (404), return the standard "Error" response expected by the frontend
    if (response.status === 404) {
      return new Response(
        JSON.stringify([{ Status: 'Error', Message: 'No record found' }]),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!response.ok) {
      throw new Error(`External API returned status ${response.status}`);
    }

    const rawData = await response.json();

    // Map the new API's structure to the exact format expected by script.js
    const offices = rawData.offices || [];
    const mappedResponse = [
      {
        Status: 'Success',
        Message: `Number of pincodes found: ${offices.length}`,
        PostOffice: offices.map(office => ({
          Name: office.officeName || '',
          BranchType: office.officeType || 'PO',
          District: rawData.district || '',
          State: rawData.state || '',
        })),
      },
    ];

    return new Response(JSON.stringify(mappedResponse), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400', // Browser/CDN can cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Pincode proxy error:', error);
    // Return standard error format to trigger "-- Failed to load --" gracefully in the frontend if the whole API is down
    return new Response(
      JSON.stringify([{ Status: 'Error', Message: 'Failed to fetch details: ' + error.message }]),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
