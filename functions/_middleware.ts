// This file serves as an entry point for Cloudflare Pages Functions
// Place this in a `functions/` directory at the root for API routes

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    // Import your API handlers
    if (url.pathname === '/api/book-session' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        // Your handler logic here
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Session booked successfully' 
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to process request' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
  }

  // Default: serve static files (handled by Cloudflare Pages automatically)
  return context.next();
}
