/**
 * HCTC Player - Firebase Cloud Functions (v1 Compatible)
 * 
 * naverProfile: 네이버 프로필 API 서버사이드 프록시
 * - 1세대 Cloud Functions 호환으로 기존 함수와 충돌 없이 바로 덮어쓰기 배포 가능
 * - CORS 및 Same-Origin 요청 지원
 */

const functions = require("firebase-functions");

exports.naverProfile = functions
  .https.onRequest(async (req, res) => {
    // CORS 헤더 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    // access_token 추출 (쿼리 또는 바디)
    const token = req.query.token || (req.body && (req.body.token || req.body.accessToken));
    if (!token) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(400).json({ 
        success: false, 
        error: "Missing access token parameter" 
      });
    }

    try {
      // 네이버 프로필 API 서버사이드 호출
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
