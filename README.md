# OmniPost AI

OmniPost AI는 하나의 원본 콘텐츠를 여러 SNS 채널에 맞게 변환하고, 발행 파이프라인을 시각적으로 관리하기 위한 AI 에이전트 오케스트레이션 프로젝트입니다.

현재 구현은 실제 SNS API 연동 전 단계의 **파이프라인 엔진 + 시뮬레이션 + 운영 UI MVP**입니다. X, Threads, Instagram, Facebook, YouTube Community 같은 플랫폼 에이전트를 붙이기 전에, “어떤 에이전트가 어떤 순서로 콘텐츠를 처리하고 실패를 어떻게 복구할지”를 검증하는 기반을 만들고 있습니다.

## 만들고 있는 것

목표는 크리에이터나 마케터가 한 번 작성한 콘텐츠를 여러 플랫폼에 맞게 자동 변환하고 발행하도록 돕는 도구입니다.

예상 흐름:

1. 사용자가 원본 글, 이미지, 링크, 해시태그, 목표를 입력합니다.
2. Manager Agent가 작업을 나눕니다.
3. Formatter, Media, Compliance Agent가 플랫폼별 문구와 미디어를 조정합니다.
4. Platform Agent가 X, Threads, Instagram 등 각 채널 발행을 담당합니다.
5. 실패한 작업은 재시도하거나 fallback 경로로 보냅니다.
6. 결과는 성공/실패/비용/지연/실패 사유 리포트로 정리됩니다.

## 현재 구현된 범위

### 코어 엔진

- 파이프라인 노드/엣지 스키마
- DAG 위상 정렬과 사이클 검증
- 정적 검증기: 중복 ID, 끊어진 엣지, fallback 경로, 비활성 노드, onFail 검증
- 실행 시뮬레이터: 상태 전이, 실패율, 재시도, 백오프, 로그, 메트릭 계산
- Markdown 실행 리포트 생성

### 운영 계층

- 파일 기반 파이프라인 저장소
- 파일 기반 실행 이력 저장소
- 템플릿 기반 파이프라인 생성
- 실행 이력 통계와 실패 원인 집계
- 전체 작업 진행률 계산
- 다음 작업 추천
- 통합 대시보드 응답

### 추천/감사 기능

- 실행 프로파일: `default`, `fast`, `resilient`
- 실행 전 예상치 계산
- 프로파일 매트릭스 비교
- 목표 기반 프로파일 추천
- 추천 근거, 트레이드오프, 합의 프로파일, 결정 로그
- 추천 결과 감사 번들
- 감사 상태, 이슈 집계, 우선순위 hotspot, 상위 hotspot 조회

### 인터페이스

- CLI: `npm run pipeline -- <command>`
- HTTP API: `/pipelines`, `/runs`, `/templates`, `/dashboard`, `/progress` 등
- 브라우저 UI: `/ui`
  - 그래프 캔버스
  - 속성 패널
  - 실행 로그
  - 비용/지연 메트릭
  - localStorage 저장/복원

## 프로젝트 구조

```text
.
├─ docs/
│  ├─ TASKS.md                     # 전체 작업 보드
│  └─ omnipostai_prd_plan_ko.md    # 기획/사양/로드맵
├─ src/
│  ├─ api/                         # HTTP API 서버
│  ├─ cli/                         # CLI 명령
│  ├─ pipeline/                    # 스키마, 검증, 시뮬레이션, 리포트
│  ├─ services/                    # 저장소와 서비스 계층
│  └─ ui/                          # 브라우저 그래프 UI
├─ tests/                          # node:test 기반 자동 테스트
├─ setup_env.js                    # 실행 산출물 폴더 초기화
└─ package.json
```

## 실행 방법

```bash
npm install
npm run setup
npm test
```

API 서버와 UI를 실행하려면:

```bash
npm run api
```

브라우저에서 다음 주소를 엽니다.

```text
http://localhost:3000/ui
```

## 주요 CLI

```bash
npm run pipeline -- bootstrap
npm run pipeline -- template-list
npm run pipeline -- template-create mvp-x-threads my_pipeline "My Pipeline"
npm run pipeline -- validate my_pipeline
npm run pipeline -- run my_pipeline
npm run pipeline -- run my_pipeline fast
npm run pipeline -- run my_pipeline resilient
npm run pipeline -- insights my_pipeline
npm run pipeline -- estimate my_pipeline resilient
npm run pipeline -- profile-matrix my_pipeline
npm run pipeline -- recommend-profile my_pipeline reliability
npm run pipeline -- recommendation-audit my_pipeline
npm run pipeline -- recommendation-audit-top-hotspots 3 1 TIE-DETECTED,tie-detected
npm run pipeline -- run-stats
npm run pipeline -- progress
npm run pipeline -- next-tasks 5
npm run pipeline -- dashboard 5
```

## 주요 API

- `GET /health`
- `GET /ui`
- `GET /templates`
- `POST /templates/create`
- `GET /pipelines`
- `POST /pipelines`
- `POST /pipelines/validate`
- `POST /pipelines/:id/run?profile=fast`
- `GET /pipelines/:id/insights`
- `GET /pipelines/:id/estimate?profile=resilient`
- `GET /pipelines/:id/profile-matrix`
- `GET /pipelines/:id/recommend-profile?objective=speed`
- `GET /pipelines/:id/recommendation-audit`
- `GET /pipelines/recommendation-audit-top-hotspots?limit=3&minImpactScore=1&includeIssues=TIE-DETECTED`
- `GET /runs`
- `GET /runs/stats`
- `GET /progress`
- `GET /next-tasks?limit=5`
- `GET /dashboard?limit=5`

## 진행 상황

현재 기준으로 `docs/TASKS.md`의 대부분 항목은 `DONE` 상태입니다.

완료된 핵심 흐름:

- 파이프라인 스키마, 검증, 시뮬레이션
- CLI/API/UI 3가지 실행 표면
- 실행 이력, 통계, 리포트
- 진행률/다음 작업/대시보드
- 실행 프로파일과 추천/감사 계층

아직 남은 방향:

- 실제 SNS OAuth와 발행 API 어댑터 연결
- 플랫폼별 포맷 정책 구체화
- 예약 발행과 큐 처리
- 이미지 리사이즈/압축/ALT 생성용 Media Agent
- 토큰 암호화 저장과 재인증 UX
- 팀 승인 워크플로우와 성과 대시보드

## 로드맵

### Phase 0: 파이프라인 운영 기반

- Job/Task 상태 모델
- 파이프라인 검증/실행/리포트
- 그래프 기반 운영 UI
- 현재 구현 대부분 완료

### Phase 1: 텍스트 중심 SNS 발행

- X/Threads 우선 연동
- 플랫폼별 글자 수, 해시태그, 링크 정책 반영
- 실패 재시도와 부분 성공 리포트

### Phase 2: 미디어 파이프라인

- Instagram/Facebook 이미지 발행
- 이미지 리사이즈/압축
- Media Agent와 Compliance Agent 강화

### Phase 3: 예약/운영 기능

- 예약 발행
- 알림
- 실패 복구 워크플로우
- 운영 지표 대시보드

### Phase 4: 협업과 수익화

- 팀 승인 플로우
- 브랜드 템플릿
- Pro/Team 플랜 기능 분리

## 데이터와 산출물

아래 폴더는 실행 중 생성되는 산출물입니다.

- `reports/`
- `data/pipelines/`
- `data/runs/`
- `tmp-test-data/`

이 폴더들은 `.gitignore`에 의해 Git 백업 대상에서 제외됩니다. 필요할 때 `npm run setup`과 CLI/API 실행으로 다시 생성합니다.

## 참고 문서

- [작업 보드](docs/TASKS.md)
- [기획/사양/개발 계획서](docs/omnipostai_prd_plan_ko.md)

