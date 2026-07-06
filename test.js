const supabaseUrl = process.env.PUBLIC_SUPABASE_URL.trim();
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY.trim();

async function run() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log('Fetching OpenAPI spec from:', url);
  try {
    const res = await globalThis.fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const spec = await res.json();
    console.log('OpenAPI spec retrieved successfully!');
    console.log('Paths:', Object.keys(spec.paths));
  } catch (err) {
    console.error('Error fetching spec:', err);
  }
}

run();
