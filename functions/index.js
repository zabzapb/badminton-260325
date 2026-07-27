/**
 * HCTC Player - Firebase Cloud Functions
 * 
 * naverProfile: 네이버 프로필 API 서버사이드 프록시
 * - 같은 도메인(player.nstove.com)에서 호출되므로 CORS 완전 해결
 * - 클라이언트가 /api/auth/naver-profile?token=xxx 로 호출
 * - 서버에서 네이버 OpenAPI 호출 후 결과 반환
 */

const functions = require("firebase-functions");

exports.naverProfile = functions
  .region("asia-northeast3") // 서울 리전 (최소 지연)
  .runWith({ timeoutSeconds: 10, memory: "128MB" })
  .https.onRequest(async (req, res) => {
    // CORS 헤더 (로컬 개발 환경 대응)
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    // access_token 추출 (쿼리 또는 바디)
    const token = req.query.token || (req.body && req.body.token);
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing access token parameter" 
      });
    }

    try {
      // 네이버 프로필 API 서버사이드 호출 (CORS 없음!)
      const response = await fetch("https://openapi.naver.com/v1/nid/me", {
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

      // 성공: 네이버 프로필 데이터 그대로 반환
      return res.status(200).json(data);
    } catch (err) {
      console.error("Naver profile proxy error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Internal proxy error",
      });
    }
  });
