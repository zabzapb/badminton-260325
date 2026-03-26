# ABNB Insights Project Architecture Rules

우리는 '모듈형 아키텍처', '데이터 정규화', 'UI/UX 완벽주의'를 핵심 철학으로 삼아 다음과 같은 아키텍처 규칙을 준수합니다.

---

### 1. Data Persistence (기준 연도 동적 주입)
*   **원칙:** 나이/출생연도 계산 시 전역 상수(예: `currentYear`) 사용을 엄격히 금지한다.
*   **실행:** 반드시 해당 데이터가 가진 `baseYear` 스냅샷 등을 파라미터로 주입하여 순수 함수로 처리한다.
*   **목적:** 데이터의 영속성과 시간 경과에 따른 정확성을 보장하며, 테스트가 용이한 순수 함수 구성을 지향한다.

### 2. Component Fragmentation (150라인 룰)
*   **원칙:** 모든 코드는 파일당 **150라인 이하**로 유지하는 것을 지향한다.
*   **실행:**
    *   복잡한 폼(Form) UI는 도메인 영역(예: Event, Level, Age)별로 반드시 하위 컴포넌트로 분리한다.
    *   스타일은 컴포넌트 내 인라인 스타일(`style={{...}}`) 지정을 피하고, 반드시 외부 CSS 파일이나 CSS 모듈로 위임한다.
*   **목적:** 코드의 가독성을 확보하고, 각 컴포넌트의 책임을 명확히 하며, 유지보수 시 파급 효과를 최소화한다.

### 3. Resilience (안전한 식별자)
*   **원칙:** ID 생성 시 충돌 방지 및 고유성을 보장한다.
*   **실행:** `Math.random()`이나 단순 타임스탬프(`Date.now()`) 대신 브라우저 네이티브인 `crypto.randomUUID()`를 사용하여 고유 식별자를 생성한다.
*   **목적:** 대량의 데이터 처리나 동시적인 상태 변경 환경에서도 안전한 상태 관리를 보장한다.

### 4. Tournament Ecosystem (대회 참가 생태계 아키텍처)
*   **Data Normalization (데이터 정규화)**:
    *   카테고리 및 명칭 파싱 시 매직 스트링(`남복`, `MD` 등 혼용)에 의존하지 않고, 정규화된 매핑(`in` 쿼리 등)을 통해 런타임 에러와 파편화를 방지한다.
    *   연령 데이터는 텍스트 파싱을 지양하고, 기준 연도 기반의 수치형(Numeric) 연산과 직접 비교를 통해 무결성을 확보한다.
*   **Snapshot Immutability (스냅샷 불변성)**:
    *   회원 프로필의 나이나 급수는 시간이 지남에 따라 변하는 동적 데이터이므로, 대회 신청 시점의 데이터(`appliedAge`, `appliedGrade`, `tournamentBaseYear`)를 별도의 객체 레이어에 스냅샷으로 영구 박제한다. 회원 정보가 수정되더라도 과거 참가 이력의 정확성이 보장된다.
*   **Single Ownership (단일 소유권 정책)**:
    *   대회의 조작(수정, 하드 삭제) 권한을 최초 신청자(Applicant)에게만 제한한다. 
    *   초대받은 파트너는 폼을 읽기 전용(Read-only)으로 조회할 수 있으며, 다른 파트너를 임의 삭제하거나 부문을 변경하는 행위가 원천 차단된다.
*   **Data Integrity & Double-booking Shield (무결성 방어 및 이중 등록 방지)**:
    *   동일 종목 이중 등록을 방지하기 위해, Client-side UI 검증뿐만 아니라 DB Insert 직전(Server-logic) 해당 종목의 참여자 Set을 교차 분석하여 중복을 원천 차단(Throw Error)한다.
*   **Soft Disconnect & Cascade Sync (소프트 하차 및 프로필 캐스케이드 동기화)**:
    *   파트너의 하차 시 Hard Delete로 데이터 증발을 막고, `partnerId`만 `null`로 초기화하는 소프트 하차 방식을 지원하여 신청자(Applicant)가 잔류할 수 있도록 유연성을 보장한다.
    *   사용자가 프로필(급수/생년월일)을 수정할 때 신청한 전체 대회의 자격 조건을 재검증하는 캐스케이드(Cascade) 동기화 로직이 자동 실행된다.

---
---

### 5. Future Roadmap (업데이트 예정 및 향후 과제)
*   **CI/CD Transition (GitHub Actions 도입)**: 
    *   **현재:** 로컬 환경 변수(`.env.local`)의 온전한 반영을 위해 `firebase deploy` 명령어를 통한 **수동 배포** 방식을 유지한다.
    *   **향후:** GitHub Secrets에 모든 환경 변수(API Key, Secret 등) 설정을 완료한 후, Push/Merge 시 자동으로 빌드 및 배포되는 **GitHub Actions CI/CD 파이프라인**으로 전면 전환한다.
*   **Environment Variable Security (환경 변수 보안 강화)**:
    *   클라이언트 측에 노출되는 `VITE_` 접두사 변수 외에, 민감한 Secret 값들은 향후 Firebase Functions(Backend)에서만 접근하도록 아키텍처를 고도화한다.

**업데이트 일시:** 2026-03-24
**상태:** 기록 및 관리됨
