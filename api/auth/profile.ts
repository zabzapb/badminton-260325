import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // [Security] Only allow POST requests
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ success: false, error: 'Access token is required' });
    }

    // [Proxy] Fetch user profile from Naver server-side to avoid CORS
    const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await profileResponse.json();

    if (!profileResponse.ok || data.resultcode !== '00') {
      return res.status(profileResponse.status).json({
        success: false,
        error: data.message || 'Failed to fetch Naver profile'
      });
    }

    res.status(200).json({
      success: true,
      profile: data
    });

  } catch (error: any) {
    console.error('[PROFILE_SERVER_ERROR]', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error while fetching profile',
      message: error.message 
    });
  }
}
