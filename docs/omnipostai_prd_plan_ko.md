# OmniPost AI 기획/사양/개발 계획서 (아이디어 중심 초안)

## 1) 프로젝트 개요
- **프로젝트명(가칭)**: OmniPost AI
- **한 줄 정의**: 인플루언서/크리에이터가 하나의 원본 콘텐츠를 여러 SNS에 동시에 발행하도록 지원하는 멀티 에이전트 기반 자동화 플랫폼
- **핵심 가치**:
  - 채널별 반복 작업 제거
  - 플랫폼별 포맷 자동 최적화
  - 게시 실패 복구 및 운영 가시성 제공

---

## 2) 문제 정의와 해결 전략

### 문제
1. 같은 내용을 YouTube 커뮤니티, Instagram, Facebook, X, Threads 등에 반복 입력해야 함
2. 플랫폼별 글자 수/링크/해시태그/이미지 규격이 달라 수작업 보정 필요
3. 게시 실패(권한 만료, 정책 오류, 레이트리밋) 대응이 번거로움

### 해결 전략
- 사용자는 **원본 콘텐츠 1회 입력**
- Manager Agent가 플랫폼별 작업으로 분해
- 각 Platform Agent가 변환/검증/게시 실행
- 결과를 통합 리포트로 제공

---

## 3) 타깃 사용자 및 유즈케이스

### 타깃
- 1인 인플루언서
- 소규모 브랜드 마케터
- 멀티 채널 운영이 필요한 콘텐츠 팀

### 핵심 유즈케이스
1. 영상 업로드 공지 동시 발행
2. 이벤트/프로모션 문구 플랫폼별 최적화 발행
3. 이미지+링크 포함 카드뉴스 동시 발행
4. 플랫폼별 톤 분기(X 짧게, Threads 길게)
5. 예약 발행 + 실패 재시도 + 결과 리포트

---

## 4) 제품 목표와 KPI

### 목표
- 게시 준비/발행 소요 시간 80% 단축
- 동시 발행 성공률 95% 이상
- 실패 원인/복구 가시성 확보

### KPI
- 연결된 SNS 계정 수
- 작업(Job) 성공률/부분 성공률
- 평균 발행 소요 시간
- 재시도 성공률
- 주간 게시량 증가율

---

## 5) 범위 정의

### MVP
- OAuth 연동/토큰 갱신
- 원본 콘텐츠 입력(텍스트/이미지/링크)
- 플랫폼별 변환 규칙 적용
- 큐 기반 병렬 발행
- 실패 재시도(지수 백오프)
- 성공/실패 리포트

### V1
- 예약 발행
- 템플릿(영상 공지, 이벤트, 판매)
- 톤 프리셋
- 플랫폼별 미리보기
- 이미지 자동 리사이즈/압축

### V2
- A/B 카피 실험
- 성과 대시보드
- 팀 승인 워크플로우
- 통합 인박스(가능 API 범위)

---

## 6) 멀티 에이전트 아키텍처

### 에이전트 구성
- **Manager Agent**: 작업 분배/상태 집계/오케스트레이션
- **Platform Agents**: YouTube, Instagram, Facebook, X, Threads 게시 처리
- **Support Agents**:
  - Formatter Agent: 톤/길이/해시태그 조정
  - Media Agent: 이미지 가공/ALT 생성
  - Compliance Agent: 정책/금칙어 검증

### 책임 분리 원칙
- Manager: 흐름 제어
- Platform Agent: 각 플랫폼 게시의 단일 책임
- Support Agent: 가공/검증 전담

---

## 7) 노드 기반 에이전트 관리 UI (핵심 차별화)

### 목적
- “어떤 봇(에이전트)이 어떤 모델로 어디에 연결돼 실행되는지”를 시각적으로 관리
- 운영자가 코드를 수정하지 않고 파이프라인을 조정

### UI 핵심 구성
1. **그래프 캔버스**: 노드/엣지 기반 파이프라인 편집
2. **속성 패널**: 선택 노드의 모델/파라미터/활성화 상태 수정
3. **실시간 로그 패널**: 실행 상태/오류/지연 모니터링
4. **메트릭 바**: 토큰/비용/지연/성공률 표시

### 노드 타입
- Input, Manager, Formatter, Media, Compliance, Platform, Critic, Output

### 엣지 메타데이터
- condition (분기 조건)
- onFail (실패 시 대체 경로)
- payload type (text/image/link/meta)

### 기대 효과
- 장애 지점 시각화
- 모델 교체 및 비용 최적화
- 디버깅 시간 단축

---

## 8) 기능 요구사항(요약)

### 계정/권한
- OAuth 연동
- 토큰 암호화 저장
- 만료 자동 갱신 및 재로그인 유도

### 콘텐츠 입력 스키마
- title?
- body_text (required)
- links[]?
- images[]?
- hashtags[]?
- tone?
- goal?
- schedule_time?
- selected_platforms (required)

### 실행/복구
- 큐 기반 병렬 처리
- 플랫폼별 독립 성공/실패
- 재시도 정책(기본 3회, 백오프)
- 부분 재실행 지원

### 리포트/로그
- 플랫폼별 게시 URL
- 실패 사유 분류
- 요청/응답/재시도 히스토리

---

## 9) 데이터 모델(초안)
- User
- ConnectedAccount { platform, account_id, token, refresh_token, expires_at, scopes }
- PostDraft { user_id, raw_payload, created_at }
- Job { id, user_id, status, schedule_time, created_at }
- PlatformTask { job_id, platform, status, request_payload, response, post_url, retries, error_code }
- Pipeline { nodes[], edges[], pipelineMeta }

상태값 예: PENDING, RUNNING, SUCCESS, PARTIAL_SUCCESS, FAILED, SCHEDULED, CANCELED

---

## 10) 구현 로드맵 (Vibe Coding용)

### Phase 0
- Job/Task 상태 모델 + 기본 API + 상태 UI

### Phase 1
- X/Threads 우선 연동
- 텍스트 변환 규칙 엔진
- 리포트/재시도

### Phase 2
- Instagram/Facebook + 이미지 파이프라인
- Media Agent 적용

### Phase 3
- YouTube 커뮤니티 연동
- 공지 템플릿 최적화

### Phase 4
- 예약 발행 + 알림 + 운영 지표 강화

---

## 11) Codex 그래프 에디터 구현 프롬프트 (복붙용)

```txt
너는 시니어 프론트엔드/풀스택 엔지니어다.
목표는 "AI 에이전트 파이프라인 그래프 에디터" MVP를 만드는 것이다.

기술 스택:
- Next.js (App Router) + React + TypeScript
- Zustand
- React Flow (@xyflow/react)
- TailwindCSS + shadcn/ui
- 저장: localStorage (+ 선택적으로 /api/pipelines)

핵심 기능:
1) 노드 생성/삭제/이동/연결
2) 노드 타입: Input, ManagerAgent, FormatterAgent, MediaAgent, PlatformAgent, CriticAgent, Output
3) 엣지 메타데이터 편집: condition, onFail
4) 우측 속성 패널: name, role, model, maxTokens, temperature, enabled, tags
5) 상단 Toolbar: 저장/불러오기/초기화/실행 시뮬레이션
6) 시뮬레이션: topological order, Pending→Running→Success/Fail, Fail 분기(onFail), 실시간 로그
7) 하단 메트릭: totalTokens, estimatedCost, latency
8) JSON 스키마:
   - nodes: [{id, type, position, data:{name, role, model, params:{maxTokens, temperature}, enabled, metrics:{tokens, cost, latency}, status}}]
   - edges: [{id, source, target, data:{condition, onFail}}]
   - pipelineMeta: {id, name, updatedAt}
9) 샘플 그래프 제공:
   Input -> Manager -> Formatter -> Critic -> PlatformX/Threads -> Output

완료 조건:
- 속성 패널 수정이 즉시 반영
- localStorage 저장/불러오기 동작
- 실행 시뮬레이션 시 상태/로그/메트릭 변화 확인
- TypeScript 에러 없이 빌드

중요 원칙:
그래프 에디터는 데모용 다이어그램이 아니라 운영자가 에이전트/모델/연결 상태를 즉시 이해하고 수정할 수 있는 운영 도구여야 한다.
```

---

## 12) 운영 리스크와 대응
1. 플랫폼 API 정책 변경 → 어댑터 계층 분리
2. 권한 만료 → 재인증 UX 및 사전 알림
3. 레이트리밋 → 큐 지연/백오프
4. 미디어 실패 → 텍스트 대체 게시 옵션
5. 블랙박스 불신 → 로그/비용/상태 가시화 강화

---

## 13) 수익화 가설
- Free: 2개 플랫폼, 월 발행 제한
- Pro: 다중 플랫폼/예약/템플릿/리포트
- Team: 승인/권한/브랜드 템플릿

핵심 결제 포인트는 “단순 동시 게시”보다 **변환 품질 + 복구 + 운영 가시성**.
