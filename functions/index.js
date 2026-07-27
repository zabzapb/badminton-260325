/**
 * HCTC Player - Firebase Cloud Functions (1st Gen Classic)
 * 
 * 1st Gen functions.https.onRequest는 Firebase CLI 배포 시
 * GCP IAM 403 Forbidden 차단 없이 allUsers 공개 호출 권한이 자동으로 승인됩니다.
 */

const functions = require("firebase-functions");

exports.naverProfile = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS 헤더 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    const token = req.query.token || (req.body && req.body.token);
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing access token parameter" 
      });
    }

    try {
      // 네이버 OpenAPI 호출 (Bearer 헤더 + oauth_token 쿼리 이중 보장)
      const response = await fetch(`https://openapi.naver.com/v1/nid/me?oauth_token=${encodeURIComponent(token)}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Naver API error:", response.status, data);
        return res.status(response.status).json({
          success: false,
          error: `Naver API returned ${response.status}`,
          data,
        });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error("Naver profile proxy error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Internal proxy error",
      });
    }
  });
