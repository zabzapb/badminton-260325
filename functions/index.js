/**
 * HCTC Player - Firebase Cloud Functions
 * naverProfile: 네이버 프로필 API 서버사이드 프록시
 */

const functions = require("firebase-functions");

exports.naverProfile = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // 1. CORS 헤더 명시적 설정
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    // 2. Preflight 요청 즉시 처리
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    // 3. access_token 추출 (Query 또는 Body)
    const token = req.query.token || (req.body && (req.body.token || req.body.accessToken));
    if (!token) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(400).json({ 
        success: false, 
        error: "Missing access token parameter" 
      });
    }

    try {
      // 4. 네이버 프로필 API 서버사이드 호출
      const response = await fetch("https://openapi.naver.com/v1/nid/me", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      if (!response.ok) {
        console.error("Naver API error:", response.status, data);
        return res.status(response.status).json({
          success: false,
          error: `Naver API returned ${response.status}`,
          data,
        });
      }

      // 5. 성공: 네이버 프로필 데이터 그대로 반환
      return res.status(200).json(data);
    } catch (err) {
      console.error("Naver profile proxy error:", err);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(500).json({
        success: false,
        error: err.message || "Internal proxy error",
      });
    }
  });
