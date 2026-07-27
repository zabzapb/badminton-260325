/**
 * HCTC Player - Firebase Cloud Functions (v2)
 * 
 * naverProfile: 네이버 프로필 API 서버사이드 프록시
 * - invoker: "public" 설정으로 GCP IAM 403 Forbidden 권한 에러 완벽 해결
 * - 같은 도메인(player.nstove.com)에서 호출되므로 CORS 완전 해결
 */

const { onRequest } = require("firebase-functions/v2/https");

exports.naverProfile = onRequest(
  {
    region: "asia-northeast3",
    cors: true,
    invoker: "public", // 공개 액세스 권한(allUsers -> Cloud Functions Invoker) 자동 부여
    timeoutSeconds: 10,
    memory: "128MiB"
  },
  async (req, res) => {
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
  }
);
