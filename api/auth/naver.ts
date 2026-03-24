import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // [Security] Only allow POST requests for token exchange
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const { code, state } = req.body;
  const client_id = process.env.VITE_NAVER_CLIENT_ID;
  const client_secret = process.env.NAVER_CLIENT_SECRET; // Vercel 대시보드에 직접 등록 필요

  if (!client_id || !client_secret) {
    console.error('[AUTH_ERROR] Missing Naver configuration in server env');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    // [Naver API] Exchange authorization code for access token
    const apiUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&code=${code}&state=${state}`;
    
    const response = await fetch(apiUrl, { method: 'POST' });
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('[AUTH_TOKEN_FAILED]', data);
      return res.status(response.status).json({ success: false, ...data });
    }

    res.status(200).json({ success: true, ...data });
  } catch (error: any) {
    console.error('[AUTH_SERVER_ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
