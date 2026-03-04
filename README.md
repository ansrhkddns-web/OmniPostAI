# OmniPost AI

멀티 SNS 동시 발행을 위한 에이전트 오케스트레이션 프로젝트입니다.

## 현재 개발 진행 체크
- 전체 Task 보드: `docs/TASKS.md`
- 기획/사양 문서: `docs/omnipostai_prd_plan_ko.md`

## 이번 단계까지 구현된 기능
- 파이프라인 노드/엣지 스키마
- DAG(topological sort) 검증 유틸리티
- 파이프라인 정적 검증기(노드/엣지/중복/onFail/사이클)
- 실패율/메트릭/로그를 포함한 시뮬레이션 엔진
- 실패 원인 분류 및 코드(errorCode) 기록
- 실행 결과 Markdown 리포트 생성기
- 파일 기반 파이프라인 저장소(CRUD)
- 파일 기반 실행 이력 저장소(Run History)
- 서비스 계층(bootstrap/list/save/run/delete + run history 기록)
- 템플릿 기반 파이프라인 생성 및 저장
- CLI 기반 실행 관리 (`npm run pipeline -- <command>`)
- HTTP API 서버(`/pipelines`, `/pipelines/:id/run`, `/runs`, `/templates`)
- 브라우저 기반 그래프 UI(`/ui`) 제공(캔버스/속성 패널/로그/비용/localStorage)
- 실행 이력 통계 API/CLI (`/runs/stats`, `run-stats`)
- 실패 원인별 집계 통계(`failureReasons`)
- 재시도/백오프 시뮬레이션 및 총 재시도 통계(`totalRetries`)
- 전체 개발 진행률 계산(`progress` / `/progress`)
- 통합 대시보드 조회(`dashboard` / `/dashboard`)
- 다음 우선 작업 추천(`next-tasks` / `/next-tasks`)
- 파이프라인 구조 인사이트 조회(`insights` / `/pipelines/:id/insights`)
- 파이프라인 버전/구조 비교(`compare` / `/pipelines/compare`)
- 실행 프로파일 기반 시뮬레이션(`run-profiles`, `run <id> [profile]`)
- 실행 전 예상치 조회(`estimate` / `/pipelines/:id/estimate`)
- 프로파일 매트릭스 비교(`profile-matrix` / `/pipelines/:id/profile-matrix`)
- 목표 기반 프로파일 추천 + 근거/트레이드오프(`recommend-profile` / `/pipelines/:id/recommend-profile`)
- 추천 objective 목록 조회(`recommend-objectives` / `/recommend-objectives`)
- objective 전체 추천 매트릭스 조회(`recommendation-matrix` / `/pipelines/:id/recommendation-matrix`)
- 추천 결과 스냅샷 요약(`recommendation-snapshot` / `/pipelines/:id/recommendation-snapshot`)
- objective 공통 합의 프로파일 조회(동률 감지 + tie-breaker 포함) (`recommendation-consensus` / `/pipelines/:id/recommendation-consensus`)
- 합의 결정 로그(투표/우선순위 추적) 조회(`recommendation-decision-log` / `/pipelines/:id/recommendation-decision-log`)
- 추천 결과 감사(audit) 번들 조회(`recommendation-audit` / `/pipelines/:id/recommendation-audit`)
- 추천 감사 요약(핵심 지표) 조회(`recommendation-audit-summary` / `/pipelines/:id/recommendation-audit-summary`)
- 추천 감사 상태(OK/WARN/ERROR) 조회(`recommendation-audit-status` / `/pipelines/:id/recommendation-audit-status`)
- 전체 파이프라인 감사 상태 집계 조회(`recommendation-audit-status-overview` / `/pipelines/recommendation-audit-status-overview`)
- 감사 이슈 유형별 집계 조회(`recommendation-audit-issues` / `/pipelines/recommendation-audit-issues`)
- 감사 이슈 우선순위 hotspot 조회(`recommendation-audit-hotspots` / `/pipelines/recommendation-audit-hotspots`)
- 감사 이슈 상위 N개 hotspot 조회(`recommendation-audit-top-hotspots` / `/pipelines/recommendation-audit-top-hotspots?limit=3&minImpactScore=1&includeIssues=tie-detected`)
  - 응답에 `includeIssues`, `normalizedIncludeIssues`, `requestedIncludeIssuesCount`, `uniqueIncludeIssuesCount`, `duplicateIncludeIssuesCount`, `includeIssuesAppliedRatePercent`, `includeIssuesIgnoredRatePercent`, `includeIssuesKnownCoveragePercent`, `appliedIncludeIssues`, `ignoredIncludeIssues`, `knownIssues`, `totalHotspots`, `impactFilteredCount`, `excludedByImpactFilterCount`, `filteredHotspotCount`, `excludedByIssueFilterCount`, `filteredOutCount`, `impactedPipelines`, `impactedPipelineCount`, `impactedCoveragePercent` 포함


## 테스트 가이드
- 전체 자동 테스트: `npm test`
- 테스트 파일 구성
  - `tests/pipeline.test.js`: topology/validator/simulator/report 단위 테스트
  - `tests/pipeline.service.test.js`: repository/service/recommendation-audit 계층 테스트
  - `tests/pipeline.api.test.js`: API lifecycle + recommendation endpoint 통합 테스트
  - `tests/task.progress.test.js`: `docs/TASKS.md` 진행률/우선순위 파싱 테스트
- 권장 스모크 체크(문서/CLI 동기화 확인)
  - `npm run pipeline -- bootstrap`
  - `npm run pipeline -- recommendation-audit-top-hotspots 5 0 NON-EXISTENT-ISSUE,non-existent-issue`
  - `npm run pipeline -- progress`

## 실행
```bash
npm test
npm run simulate
npm run pipeline -- template-list
npm run pipeline -- template-create mvp-x-threads my_pipeline "My Pipeline"
npm run pipeline -- validate my_pipeline
npm run pipeline -- insights my_pipeline
npm run pipeline -- estimate my_pipeline resilient
npm run pipeline -- profile-matrix my_pipeline
npm run pipeline -- recommend-profile my_pipeline reliability
npm run pipeline -- compare my_pipeline other_pipeline
npm run pipeline -- run-profiles
npm run pipeline -- recommend-objectives
npm run pipeline -- recommendation-matrix my_pipeline
npm run pipeline -- recommendation-snapshot my_pipeline
npm run pipeline -- recommendation-consensus my_pipeline
npm run pipeline -- recommendation-decision-log my_pipeline
npm run pipeline -- recommendation-audit my_pipeline
npm run pipeline -- recommendation-audit-summary my_pipeline
npm run pipeline -- recommendation-audit-status my_pipeline
npm run pipeline -- recommendation-audit-status-overview
npm run pipeline -- recommendation-audit-issues
npm run pipeline -- recommendation-audit-hotspots
npm run pipeline -- recommendation-audit-top-hotspots 3 1 TIE-DETECTED,tie-detected
npm run pipeline -- run my_pipeline fast
npm run pipeline -- run my_pipeline
npm run pipeline -- run-stats
npm run pipeline -- progress
npm run pipeline -- next-tasks 5
npm run pipeline -- dashboard 5
npm run api
```

### API 예시
- `GET /health`
- `GET /ui` (그래프 캔버스 UI)
- `GET /templates`
- `GET /run-profiles`
- `GET /recommend-objectives`
- `POST /templates/create`
- `POST /pipelines/validate`
- `GET /pipelines/:id/validate`
- `GET /pipelines/:id/insights`
- `GET /pipelines/:id/estimate?profile=resilient`
- `GET /pipelines/:id/profile-matrix`
- `GET /pipelines/:id/recommend-profile?objective=speed`
- `GET /pipelines/:id/recommendation-matrix`
- `GET /pipelines/recommendation-matrix?pipelineId=my_pipeline`
- `GET /pipelines/:id/recommendation-snapshot`
- `GET /pipelines/recommendation-snapshot?pipelineId=my_pipeline`
- `GET /pipelines/:id/recommendation-consensus`
- `GET /pipelines/recommendation-consensus?pipelineId=my_pipeline`
- `GET /pipelines/:id/recommendation-decision-log`
- `GET /pipelines/recommendation-decision-log?pipelineId=my_pipeline`
- `GET /pipelines/:id/recommendation-audit`
- `GET /pipelines/recommendation-audit?pipelineId=my_pipeline`
- `GET /pipelines/:id/recommendation-audit-summary`
- `GET /pipelines/recommendation-audit-summary?pipelineId=my_pipeline`
- `GET /pipelines/:id/recommendation-audit-status`
- `GET /pipelines/recommendation-audit-status?pipelineId=my_pipeline`
- `GET /pipelines/recommendation-audit-status-overview`
- `GET /pipelines/recommendation-audit-issues`
- `GET /pipelines/recommendation-audit-hotspots`
- `GET /pipelines/recommendation-audit-top-hotspots?limit=3&minImpactScore=1&includeIssues=TIE-DETECTED,tie-detected`
- `GET /pipelines/compare?leftId=A&rightId=B`
- `POST /pipelines/:id/run?profile=fast`
- `GET /runs`
- `GET /runs/records`
- `GET /runs/stats`
- `GET /progress`
- `GET /next-tasks?limit=5`
- `GET /dashboard?limit=5`

실행 시 `reports/`에 리포트가 생성되고, `data/runs/`에 실행 이력이 저장됩니다.
