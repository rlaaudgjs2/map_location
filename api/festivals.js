import { fetchFestivals } from '../festival.js';

export async function GET() {
  try {
    const festivals = await fetchFestivals(process.env.TOUR_API_SERVICE_KEY);
    return Response.json({ festivals }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Festival lookup failed:', error.message);
    return Response.json({ festivals: [] }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

