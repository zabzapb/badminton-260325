---
description: HCTC Player 로컬 개발 서버 구동 방법 (Vite 기반)
---

# HCTC Player — 로컬 개발 서버 구동 지침 (Vite)

---

## 1. 핵심 원칙

- 서버는 반드시 프로젝트 루트의 **`dev.bat` 더블클릭**으로 시작한다.
- `dev.bat`은 이전에 꼬인 프로세스(node.exe)를 강제 종료하고 최적의 메모리(4GB) 설정으로 서버를 띄워준다.
- 소스 수정은 **HMR (Hot Module Replacement)** 덕분에 저장 즉시 브라우저에 반영된다. (서버 재시작 불필요)
- `vite.config.ts` 변경 시에만 `dev.bat`을 재실행한다.

---

## 2. 새 프로젝트 최초 세팅 순서

### Step 1 — 의존성 설치

// turbo
```powershell
npm install
```

---

### Step 2 — `dev.bat` 파일 확인 및 실행

이미 프로젝트 루트에 있는 `dev.bat` 파일을 더블클릭한다. 이 파일은 다음과 같은 핵심 기능을 포함한다:
1. 기존 `node.exe` 프로세스 정리 (포트 충돌 방지)
2. `NODE_OPTIONS=--max-old-space-size=4096` 메모리 증설
3. `npm run dev` 실행

---

## 3. 서버 시작 및 접속

### 방법 A — 탐색기 (권장)

1. 탐색기에서 `C:\Users\CHW\Desktop\HCTCplayer` 폴더를 연다.
2. `dev.bat`을 **더블클릭**한다.
3. 터미널에 `VITE vX.X.X  ready in XX ms` 메시지가 나오면 접속한다.
   - **기본 접속**: [http://localhost:3000](http://localhost:3000)
   - **대시보드**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 방법 B — VS Code 터미널

// turbo
```powershell
.\dev.bat
```

---

## 4. 접속 문제 해결 가이드

PowerShell이 죽거나 서버가 응답하지 않을 때 아래 순서대로 시도한다.

| 단계 | 조치 방법 | 효과 |
|---|---|---|
| **1단계** | `dev.bat` 재실행 | 90% 이상 해결 (좀비 프로세스 정리) |
| **2단계** | `npm run clean` | 빌드 결과물(`dist`) 및 캐시 삭제 |
| **3단계** | 시스템 재부팅 | OS 레벨의 포트 잠김 등 해결 |

---

## 5. 자주 묻는 질문 (FAQ)

**Q. PowerShell 창이 자꾸 그냥 꺼져요.**
A. `dev.bat`은 오류 발생 시 창이 바로 닫히지 않고 `PAUSE` 상태가 되도록 설계되었습니다. 만약 창이 바로 닫힌다면, 에러가 발생하기 전에 쉘 자체가 죽는 경우이므로 `dev.bat`을 통해 좀비 노드 프로세스를 한 번 정리해 주는 것이 좋습니다.

**Q. 포트가 이미 사용 중(EADDRINUSE)이라고 나와요.**
A. `dev.bat`을 다시 실행하면 기존 노드 프로세스를 모두 `taskkill` 하므로 해결됩니다.

---
