# OmniPostAI 전체 작업 Task 보드

> 목적: 현재 진행상황을 한눈에 확인하고, 수정/추가 요청이 들어올 때마다 이 문서를 업데이트합니다.

## 진행 원칙
- 상태: `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`
- 우선순위: P0(핵심), P1(중요), P2(개선)
- 각 작업은 완료 시 `완료일`과 `결과`를 기록

---

## A. 코어 오케스트레이션 엔진

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| A-01 | P0 | 파이프라인 노드/엣지 스키마 정의 | DONE | 완료 (기존) |
| A-02 | P0 | DAG 위상 정렬 및 사이클 탐지 | DONE | 완료 (기존) |
| A-03 | P0 | 시뮬레이션 상태 전이/로그/메트릭 | DONE | 완료 (기존) |
| A-04 | P0 | 파이프라인 정적 검증기(구조/연결/fallback) | DONE | 2026-03-02 구현 완료 |
| A-05 | P1 | 실행 결과 Markdown 리포트 생성기 | DONE | 2026-03-02 구현 완료 |

## B. 운영/가시성

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| B-01 | P0 | 전체 작업 추적 문서 생성 및 유지 | DONE | 문서 생성 및 첫 업데이트 완료 |
| B-02 | P1 | 샘플 실행 결과를 사람이 읽는 형태로 출력 | DONE | `reports/latest-simulation.md` 생성 |
| B-03 | P1 | 실패 원인 분류(권한/레이트리밋/포맷 등) 확장 | DONE | 2026-03-02 분류 코드/통계 반영 |

## C. 다음 단계(그래프 UI 및 연동)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| C-01 | P0 | React Flow 기반 그래프 캔버스 | DONE | `/ui` 그래프 캔버스 제공 |
| C-02 | P0 | 우측 속성 패널 + onChange 반영 | DONE | 노드 선택/수정 즉시 반영 |
| C-03 | P1 | 실행 로그 패널 + 비용 패널 | DONE | 로그/비용 요약 패널 추가 |
| C-04 | P1 | localStorage 저장/불러오기 | DONE | UI 저장/복원 버튼 제공 |

---


## D. 실행 운영 자동화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| D-01 | P0 | 파일 기반 파이프라인 저장소(CRUD) | DONE | 2026-03-02 구현 완료 |
| D-02 | P0 | 서비스 계층(run/validate/report write) | DONE | 2026-03-02 구현 완료 |
| D-03 | P1 | CLI 명령(bootstrap/list/show/run/delete) | DONE | `src/cli/pipeline-cli.js` |

---


## E. API 계층(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| E-01 | P0 | HTTP API 서버(health/pipelines CRUD) | DONE | 2026-03-02 구현 완료 |
| E-02 | P0 | 파이프라인 실행 API(`/pipelines/:id/run`) | DONE | reportPath/summary 반환 |
| E-03 | P1 | API 통합 테스트 추가 | DONE | `tests/pipeline.api.test.js` |

---


## F. 실행 이력 관리(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| F-01 | P0 | Run History 저장소 추가 | DONE | `src/services/runRepository.js` |
| F-02 | P0 | 파이프라인 실행 시 이력 기록 | DONE | `src/services/pipelineService.js` |
| F-03 | P1 | API/CLI run history 조회 | DONE | `/runs`, `runs`, `run-show` |

---


## G. 템플릿/검증/통계 API 고도화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| G-01 | P0 | 템플릿 목록/생성 기능 | DONE | `listTemplates`, `createFromTemplate` |
| G-02 | P0 | 파이프라인 검증 API/CLI | DONE | `/pipelines/validate`, `validate` |
| G-03 | P1 | 실행 이력 통계 API/CLI | DONE | `/runs/stats`, `run-stats` |

---


## H. 실패 원인 가시화 고도화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| H-01 | P0 | 시뮬레이터 실패 코드 분류 | DONE | `failureReasons`, `errorCode` |
| H-02 | P1 | 리포트에 실패 원인 섹션 추가 | DONE | `## Failure Reasons` |
| H-03 | P1 | 실행 통계에 실패 원인 집계 추가 | DONE | `runService.getStats().failureReasons` |

---


## I. 재시도/백오프 복구 시뮬레이션(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| I-01 | P0 | retry/backoff 시뮬레이션 추가 | DONE | `maxRetries`, `retryBaseDelayMs` |
| I-02 | P1 | 리포트/요약에 retries 가시화 | DONE | `totalRetries`, node retries |
| I-03 | P1 | 통계 API/CLI totalRetries 집계 | DONE | `runService.getStats().totalRetries` |

---


## J. 개발 진행률 자동 집계(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| J-01 | P0 | TASKS.md 기반 진행률 계산기 | DONE | `taskProgressService` |
| J-02 | P1 | API 진행률 엔드포인트 추가 | DONE | `GET /progress` |
| J-03 | P1 | CLI 진행률 명령 추가 | DONE | `progress` |

---


## K. 통합 운영 대시보드 응답(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| K-01 | P0 | dashboard API 응답(진행률+통계+최근실행) | DONE | `GET /dashboard` |
| K-02 | P1 | CLI dashboard 명령 추가 | DONE | `dashboard [limit]` |
| K-03 | P1 | recent runs 조회 기능 추가 | DONE | `runService.getRecentRuns` |

---


## L. 파이프라인 구조 인사이트(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| L-01 | P0 | 노드/엣지/입출력 구조 인사이트 계산 | DONE | `getPipelineInsights` |
| L-02 | P1 | 인사이트 API 추가 | DONE | `GET /pipelines/:id/insights` |
| L-03 | P1 | CLI 인사이트 명령 추가 | DONE | `insights <pipelineId>` |

---


## M. 파이프라인 비교 기능(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| M-01 | P0 | 파이프라인 구조 비교 로직 | DONE | `comparePipelines` |
| M-02 | P1 | 비교 API 추가 | DONE | `GET /pipelines/compare` |
| M-03 | P1 | CLI compare 명령 추가 | DONE | `compare <leftId> <rightId>` |

---


## N. 다음 작업 추천 자동화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| N-01 | P0 | TASKS 기반 next tasks 계산 | DONE | `getNextTasks(limit)` |
| N-02 | P1 | next-tasks API 추가 | DONE | `GET /next-tasks` |
| N-03 | P1 | CLI next-tasks 명령 추가 | DONE | `next-tasks [limit]` |

---


## O. 실행 프로파일 고도화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| O-01 | P0 | run profile 정의/적용 | DONE | default/fast/resilient |
| O-02 | P1 | run-profiles API/CLI 추가 | DONE | `/run-profiles`, `run-profiles` |
| O-03 | P1 | run 호출 시 profile 선택 | DONE | `/pipelines/:id/run?profile=` |

---


## P. 실행 전 예상치(Estimate) 기능(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| P-01 | P0 | profile 기반 실행 예상치 계산 | DONE | `estimateRun` |
| P-02 | P1 | estimate API 추가 | DONE | `GET /pipelines/:id/estimate` |
| P-03 | P1 | CLI estimate 명령 추가 | DONE | `estimate <id> [profile]` |

---


## Q. 프로파일 매트릭스 비교(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| Q-01 | P0 | 전체 프로파일 예상치 매트릭스 계산 | DONE | `getProfileMatrix` |
| Q-02 | P1 | profile-matrix API 추가 | DONE | `GET /pipelines/:id/profile-matrix` |
| Q-03 | P1 | CLI profile-matrix 명령 추가 | DONE | `profile-matrix <id>` |

---


## R. 목표 기반 실행 프로파일 추천(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| R-01 | P0 | objective 기반 추천 로직 추가 | DONE | `recommendRunProfile` |
| R-02 | P1 | recommend-profile API 추가 | DONE | `GET /pipelines/:id/recommend-profile` |
| R-03 | P1 | CLI recommend-profile 명령 추가 | DONE | `recommend-profile <id> [objective]` |

---


## S. 추천 근거/트레이드오프 가시화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| S-01 | P0 | 추천 결과 rationale 생성 | DONE | `rationale` |
| S-02 | P1 | 추천 결과 tradeoff 요약 추가 | DONE | `tradeoffSummary` |
| S-03 | P1 | 테스트/문서에 추천 근거 항목 반영 | DONE | service/api tests, README |

---


## T. 추천 objective 가시성/검증(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| T-01 | P0 | 추천 objective 목록 제공 | DONE | `listRecommendObjectives` |
| T-02 | P1 | recommend-objectives API/CLI 추가 | DONE | `/recommend-objectives`, `recommend-objectives` |
| T-03 | P1 | 잘못된 objective 요청 400 처리 | DONE | `supportedObjectives` 반환 |

---


## U. objective 전체 추천 매트릭스(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| U-01 | P0 | objective별 추천 결과 일괄 계산 | DONE | `getRecommendationMatrix` |
| U-02 | P1 | recommendation-matrix API/CLI 추가 | DONE | `/pipelines/:id/recommendation-matrix`, `recommendation-matrix` |
| U-03 | P1 | API 쿼리형 조회 추가 | DONE | `/pipelines/recommendation-matrix?pipelineId=` |

---


## V. 추천 결과 스냅샷 요약(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| V-01 | P0 | objective별 추천 요약 스냅샷 생성 | DONE | `getRecommendationSnapshot` |
| V-02 | P1 | recommendation-snapshot API/CLI 추가 | DONE | `/pipelines/:id/recommendation-snapshot`, `recommendation-snapshot` |
| V-03 | P1 | API 쿼리형 snapshot 조회 추가 | DONE | `/pipelines/recommendation-snapshot?pipelineId=` |

---


## W. 추천 합의 프로파일(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| W-01 | P0 | objective 투표 기반 consensus 계산 | DONE | `getRecommendationConsensus` |
| W-02 | P1 | recommendation-consensus API/CLI 추가 | DONE | `/pipelines/:id/recommendation-consensus`, `recommendation-consensus` |
| W-03 | P1 | API 쿼리형 consensus 조회 추가 | DONE | `/pipelines/recommendation-consensus?pipelineId=` |

---


## X. 합의 결과 동률(Tie) 가시화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| X-01 | P0 | consensus tie 감지 필드 추가 | DONE | `hasTie`, `tiedProfiles` |
| X-02 | P1 | recommendation-consensus 응답/CLI 설명 업데이트 | DONE | API/CLI/README 반영 |
| X-03 | P1 | API/서비스 테스트 tie 필드 검증 | DONE | `pipeline.api.test`, `pipeline.service.test` |

---


## Y. Consensus Tie-Breaker 명시(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| Y-01 | P0 | tie-breaker 정책 적용 | DONE | `objective-priority` |
| Y-02 | P1 | consensus 응답에 tie-breaker 메타데이터 추가 | DONE | `tieBreaker`, `tieBreakerReason` |
| Y-03 | P1 | 테스트/문서 tie-breaker 반영 | DONE | API/서비스 테스트, README |

---


## Z. Consensus 의사결정 로그(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| Z-01 | P0 | consensus 의사결정 로그 계산 | DONE | `getRecommendationDecisionLog` |
| Z-02 | P1 | recommendation-decision-log API/CLI 추가 | DONE | `/pipelines/:id/recommendation-decision-log`, `recommendation-decision-log` |
| Z-03 | P1 | 투표/우선순위 로그 테스트 반영 | DONE | service/api tests |

---


## AA. 추천 Audit 번들(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AA-01 | P0 | recommendation audit 집계 로직 추가 | DONE | `getRecommendationAudit` |
| AA-02 | P1 | recommendation-audit API/CLI 추가 | DONE | `/pipelines/:id/recommendation-audit`, `recommendation-audit` |
| AA-03 | P1 | audit 일관성 체크 테스트 추가 | DONE | `consistentSelection`, `objectiveCountMatchesVotes` |

---


## AB. 추천 Audit 요약(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AB-01 | P0 | recommendation audit summary 로직 추가 | DONE | `getRecommendationAuditSummary` |
| AB-02 | P1 | recommendation-audit-summary API/CLI 추가 | DONE | `/pipelines/:id/recommendation-audit-summary`, `recommendation-audit-summary` |
| AB-03 | P1 | audit summary 테스트 추가 | DONE | service/api tests |

---


## AC. 추천 Audit 상태 판정(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AC-01 | P0 | recommendation audit status 계산 | DONE | `getRecommendationAuditStatus` |
| AC-02 | P1 | recommendation-audit-status API/CLI 추가 | DONE | `/pipelines/:id/recommendation-audit-status`, `recommendation-audit-status` |
| AC-03 | P1 | 상태 응답 테스트 추가 | DONE | service/api tests |

---


## AD. 추천 Audit 상태 개요(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AD-01 | P0 | 전체 파이프라인 audit status 집계 로직 추가 | DONE | `getRecommendationAuditStatusOverview` |
| AD-02 | P1 | recommendation-audit-status-overview API/CLI 추가 | DONE | `/pipelines/recommendation-audit-status-overview`, `recommendation-audit-status-overview` |
| AD-03 | P1 | 개요 응답 테스트 추가 | DONE | service/api tests |

---


## AE. 추천 Audit 이슈 집계(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AE-01 | P0 | audit issue 유형별 집계 로직 추가 | DONE | `getRecommendationAuditIssueSummary` |
| AE-02 | P1 | recommendation-audit-issues API/CLI 추가 | DONE | `/pipelines/recommendation-audit-issues`, `recommendation-audit-issues` |
| AE-03 | P1 | 이슈 집계 응답 테스트 추가 | DONE | service/api tests |

---


## AF. 추천 Audit Hotspot 우선순위(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AF-01 | P0 | audit issue hotspot 우선순위 계산 로직 추가 | DONE | `getRecommendationAuditHotspots` |
| AF-02 | P1 | recommendation-audit-hotspots API/CLI 추가 | DONE | `/pipelines/recommendation-audit-hotspots`, `recommendation-audit-hotspots` |
| AF-03 | P1 | hotspot 응답 테스트 추가 | DONE | service/api tests |

---


## AG. 추천 Audit Top Hotspot 조회(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AG-01 | P0 | hotspot 상위 N개 제한 응답 로직 추가 | DONE | `getRecommendationAuditTopHotspots(limit)` |
| AG-02 | P1 | recommendation-audit-top-hotspots API/CLI 추가 | DONE | `/pipelines/recommendation-audit-top-hotspots`, `recommendation-audit-top-hotspots` |
| AG-03 | P1 | limit 동작 테스트 추가 | DONE | service/api tests |

---


## AH. Top Hotspot 영향 범위 가시화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AH-01 | P0 | top-hotspots 영향 파이프라인 집계 추가 | DONE | `impactedPipelines`, `impactedPipelineCount` |
| AH-02 | P1 | top-hotspots 영향 커버리지(%) 계산 추가 | DONE | `impactedCoveragePercent` |
| AH-03 | P1 | 영향 범위 필드 테스트/문서 반영 | DONE | service/api tests, README |

---


## AI. Top Hotspot 최소 영향 점수 필터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AI-01 | P0 | top-hotspots에 minImpactScore 필터 추가 | DONE | `getRecommendationAuditTopHotspots(limit, minImpactScore)` |
| AI-02 | P1 | top-hotspots API/CLI 필터 파라미터 추가 | DONE | `?minImpactScore=`, `recommendation-audit-top-hotspots [limit] [minImpactScore]` |
| AI-03 | P1 | 필터 동작 테스트/문서 반영 | DONE | service/api tests, README |

---


## AJ. Top Hotspot 필터 결과 메타데이터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AJ-01 | P0 | top-hotspots 필터 결과 수치 메타데이터 추가 | DONE | `totalHotspots`, `filteredHotspotCount`, `filteredOutCount` |
| AJ-02 | P1 | API/CLI 결과에서 필터 메타데이터 노출 | DONE | `recommendation-audit-top-hotspots` 응답 확장 |
| AJ-03 | P1 | 메타데이터 검증 테스트/문서 반영 | DONE | service/api tests, README |

---


## AK. Top Hotspot 이슈 유형 필터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AK-01 | P0 | top-hotspots includeIssues 필터 추가 | DONE | `getRecommendationAuditTopHotspots(..., includeIssues)` |
| AK-02 | P1 | top-hotspots API/CLI includeIssues 파라미터 추가 | DONE | `?includeIssues=`, `[includeIssuesCsv]` |
| AK-03 | P1 | includeIssues 필터 테스트/문서 반영 | DONE | service/api tests, README |

---


## AL. Top Hotspot 필터 단계별 제외 메타데이터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AL-01 | P0 | impact 필터/issue 필터 단계별 제외 수치 추가 | DONE | `excludedByImpactFilterCount`, `excludedByIssueFilterCount` |
| AL-02 | P1 | top-hotspots 응답에 단계별 필터 수치 노출 | DONE | `impactFilteredCount` 포함 |
| AL-03 | P1 | 단계별 메타데이터 테스트/문서 반영 | DONE | service/api tests, README |

---


## AM. includeIssues 유효/무효 이슈 분리(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AM-01 | P0 | includeIssues 유효/무효 분리 메타데이터 추가 | DONE | `appliedIncludeIssues`, `ignoredIncludeIssues` |
| AM-02 | P1 | top-hotspots 응답에 분리 메타데이터 노출 | DONE | API/CLI 동일 응답 구조 |
| AM-03 | P1 | 유효/무효 분리 테스트/문서 반영 | DONE | service/api tests, README |

---


## AN. Top Hotspot 필터 가능 이슈 목록 노출(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AN-01 | P0 | top-hotspots 응답에 knownIssues 목록 추가 | DONE | `knownIssues` |
| AN-02 | P1 | includeIssues 응답 메타데이터와 knownIssues 연동 | DONE | applied/ignored 해석 보조 |
| AN-03 | P1 | knownIssues 테스트/문서 반영 | DONE | service/api tests, README |

---


## AO. includeIssues 중복 입력 메타데이터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AO-01 | P0 | includeIssues 요청/고유/중복 개수 메타데이터 추가 | DONE | `requestedIncludeIssuesCount`, `uniqueIncludeIssuesCount`, `duplicateIncludeIssuesCount` |
| AO-02 | P1 | top-hotspots 응답에 중복 입력 메타데이터 노출 | DONE | API/CLI 동일 응답 구조 |
| AO-03 | P1 | 중복 입력 테스트/문서 반영 | DONE | service/api tests, README |

---


## AP. includeIssues 대소문자 정규화(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AP-01 | P0 | includeIssues 소문자 정규화 필드 추가 | DONE | `normalizedIncludeIssues` |
| AP-02 | P1 | knownIssues 매칭을 대소문자 비민감 처리 | DONE | 대문자 입력도 매칭 |
| AP-03 | P1 | 정규화 필드 테스트/문서 반영 | DONE | service/api tests, README |

---


## AQ. includeIssues 적용률 메타데이터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AQ-01 | P0 | includeIssues 적용률(%) 계산 필드 추가 | DONE | `includeIssuesAppliedRatePercent` |
| AQ-02 | P1 | top-hotspots 응답에 적용률 메타데이터 노출 | DONE | API/CLI 동일 응답 구조 |
| AQ-03 | P1 | 적용률 테스트/문서 반영 | DONE | service/api tests, README |

---


## AR. includeIssues knownIssues 커버리지(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AR-01 | P0 | includeIssues knownIssues 대비 커버리지(%) 필드 추가 | DONE | `includeIssuesKnownCoveragePercent` |
| AR-02 | P1 | top-hotspots 응답에 known coverage 메타데이터 노출 | DONE | API/CLI 동일 응답 구조 |
| AR-03 | P1 | 커버리지 필드 테스트/문서 반영 | DONE | service/api tests, README |

---



## AS. includeIssues 무시 비율 메타데이터(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AS-01 | P0 | includeIssues 무시 비율(%) 계산 필드 추가 | DONE | `includeIssuesIgnoredRatePercent` |
| AS-02 | P1 | top-hotspots 응답에 무시 비율 메타데이터 노출 | DONE | API/CLI 동일 응답 구조 |
| AS-03 | P1 | 무시 비율 테스트/문서 반영 | DONE | service/api tests, README |

---



## AT. 테스트 문서/체크리스트 정리(현재 단계)

| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| AT-01 | P0 | README 테스트 가이드에 테스트 파일 역할 정리 | DONE | unit/service/api/progress 분류 |
| AT-02 | P1 | 권장 스모크 체크 명령 표준화 | DONE | bootstrap/top-hotspots/progress |
| AT-03 | P1 | 진행률 보고용 남은 TODO 작업 목록 점검 루틴 반영 | DONE | `progress` + TASKS TODO 확인 |

---

## 변경 이력

- 2026-03-02
  - Task 보드 초안 생성.
  - 기존 완료 항목(A-01~A-03) 반영.
  - 현재 요청 기반 신규 개발 항목(A-04, A-05) 추가.

- 2026-03-02
  - A-04 정적 검증기 구현(`src/pipeline/validator.js`).
  - A-05 리포트 생성기 구현(`src/pipeline/report.js`).
  - B-02 샘플 실행 결과 리포트 파일 출력 연동(`src/demo.js`).

- 2026-03-02
  - D-01 파이프라인 파일 저장소 추가(`src/services/pipelineRepository.js`).
  - D-02 서비스 계층 추가(`src/services/pipelineService.js`).
  - D-03 CLI 추가(`src/cli/pipeline-cli.js`), README 실행 가이드 업데이트.

- 2026-03-02
  - E-01 API 서버 추가(`src/api/server.js`, `src/api/run-server.js`).
  - E-02 실행 API 추가(`/pipelines/:id/run`).
  - E-03 API 통합 테스트 추가(`tests/pipeline.api.test.js`).

- 2026-03-02
  - F-01 실행 이력 저장소/서비스 추가(`runRepository`, `runService`).
  - F-02 `runPipeline` 결과에 `runRecord` 포함 및 저장.
  - F-03 API(`/runs`) + CLI(`runs`, `run-show`) 조회 기능 추가.

- 2026-03-02
  - G-01 템플릿 기반 파이프라인 생성 기능 추가(서비스/API/CLI).
  - G-02 검증 전용 API 및 CLI(validate) 추가.
  - G-03 실행 통계 집계(runService.getStats) 및 API/CLI 노출.

- 2026-03-02
  - H-01 시뮬레이터 실패 코드 분류(errorCode/failureReasons) 추가.
  - H-02 Markdown 리포트에 실패 원인 섹션 및 에러 코드 컬럼 추가.
  - H-03 실행 통계에 실패 원인 집계 추가(API/CLI 반영).

- 2026-03-02
  - I-01 retry/backoff 재시도 로직 시뮬레이터 반영.
  - I-02 리포트에 Total Retries/노드 retries 컬럼 추가.
  - I-03 실행 통계에 totalRetries 누적 집계 추가.

- 2026-03-02
  - J-01 TASKS.md 파싱 기반 진행률 집계 서비스 추가.
  - J-02 API `/progress` 추가 및 테스트 반영.
  - J-03 CLI `progress` 명령 추가.

- 2026-03-02
  - K-01 `/dashboard` 통합 응답 추가(progress/runStats/recentRuns).
  - K-02 CLI `dashboard` 명령 추가.
  - K-03 runService `getRecentRuns(limit)` 추가 및 테스트 반영.

- 2026-03-02
  - L-01 파이프라인 구조 인사이트(노드/엣지/entry/terminal/type counts) 추가.
  - L-02 인사이트 API(`/pipelines/:id/insights`) 추가 및 테스트 반영.
  - L-03 CLI `insights` 명령 추가.

- 2026-03-02
  - M-01 파이프라인 비교(노드/엣지/type diff) 로직 추가.
  - M-02 비교 API(`/pipelines/compare`) 및 테스트 반영.
  - M-03 CLI `compare` 명령 추가.

- 2026-03-02
  - N-01 TASKS 우선순위/상태 기반 next tasks 추천 추가.
  - N-02 API `/next-tasks` 및 dashboard 응답에 nextTasks 포함.
  - N-03 CLI `next-tasks` 명령 추가.

- 2026-03-02
  - O-01 실행 프로파일(default/fast/resilient) 서비스에 반영.
  - O-02 API `/run-profiles` 및 CLI `run-profiles` 추가.
  - O-03 run 엔드포인트/CLI에서 profile 선택 실행 지원.

- 2026-03-02
  - P-01 실행 전 예상치(지연/토큰/비용/성공률/재시도) 계산 추가.
  - P-02 API `/pipelines/:id/estimate` 추가 및 테스트 반영.
  - P-03 CLI `estimate` 명령 추가.


- 2026-03-02
  - Q-01 전체 run profile(default/fast/resilient) 예상치 매트릭스 기능 추가.
  - Q-02 API `/pipelines/:id/profile-matrix` 추가 및 통합 테스트 반영.
  - Q-03 CLI `profile-matrix` 명령 추가.


- 2026-03-02
  - R-01 objective(balanced/speed/reliability/cost) 기반 프로파일 추천/랭킹 기능 추가.
  - R-02 API `/pipelines/:id/recommend-profile` 추가 및 통합 테스트 반영.
  - R-03 CLI `recommend-profile` 명령 추가.


- 2026-03-02
  - S-01 추천 프로파일 응답에 objective별 근거 문구(rationale) 추가.
  - S-02 추천 결과의 1위/2위 간 latency/success/cost gap(tradeoffSummary) 추가.
  - S-03 README/테스트에 추천 근거 항목 반영.


- 2026-03-02
  - T-01 추천 objective 목록 조회 기능 추가.
  - T-02 API `/recommend-objectives` 및 CLI `recommend-objectives` 추가.
  - T-03 `/recommend-profile` 잘못된 objective 요청 시 400 + supportedObjectives 반환.


- 2026-03-02
  - U-01 objective별 추천 결과를 한 번에 반환하는 recommendation matrix 기능 추가.
  - U-02 API(`/pipelines/:id/recommendation-matrix`) 및 CLI(`recommendation-matrix`) 추가.
  - U-03 API 쿼리형 조회(`/pipelines/recommendation-matrix?pipelineId=`) 추가.


- 2026-03-02
  - V-01 objective별 추천 프로파일을 압축 요약하는 snapshot 기능 추가.
  - V-02 API(`/pipelines/:id/recommendation-snapshot`) 및 CLI(`recommendation-snapshot`) 추가.
  - V-03 API 쿼리형 snapshot 조회(`/pipelines/recommendation-snapshot?pipelineId=`) 추가.


- 2026-03-02
  - W-01 objective별 추천 결과를 투표 집계하는 consensus 기능 추가.
  - W-02 API(`/pipelines/:id/recommendation-consensus`) 및 CLI(`recommendation-consensus`) 추가.
  - W-03 API 쿼리형 consensus 조회(`/pipelines/recommendation-consensus?pipelineId=`) 추가.


- 2026-03-03
  - X-01 recommendation consensus에 `hasTie`, `tiedProfiles` 필드 추가.
  - X-02 CLI help/README에 동률 감지 설명 반영.
  - X-03 API/서비스 테스트에 tie 관련 필드 검증 추가.


- 2026-03-03
  - Y-01 consensus 동률 시 objective-priority 기반 tie-breaker 적용.
  - Y-02 consensus 응답에 `tieBreaker`, `tieBreakerReason` 필드 추가.
  - Y-03 README/테스트에 tie-breaker 동작 반영.


- 2026-03-03
  - Z-01 consensus 결과의 vote table/objective priority를 담는 decision log 기능 추가.
  - Z-02 API(`/pipelines/:id/recommendation-decision-log`) 및 CLI(`recommendation-decision-log`) 추가.
  - Z-03 서비스/API 테스트에 decision log 응답 검증 추가.


- 2026-03-03
  - AA-01 recommendation snapshot/consensus/decision log를 묶은 audit 응답 추가.
  - AA-02 API(`/pipelines/:id/recommendation-audit`) 및 CLI(`recommendation-audit`) 추가.
  - AA-03 audit checks(선택 일관성/투표수 일치) 테스트 반영.


- 2026-03-03
  - AB-01 recommendation audit 핵심 필드 요약 응답 추가.
  - AB-02 API(`/pipelines/:id/recommendation-audit-summary`) 및 CLI(`recommendation-audit-summary`) 추가.
  - AB-03 서비스/API 테스트에 summary 응답 검증 추가.

- 2026-03-03
  - AC-01 recommendation audit status(`ok/warn/error`) 계산 기능 추가.
  - AC-02 API(`/pipelines/:id/recommendation-audit-status`) 및 CLI(`recommendation-audit-status`) 추가.
  - AC-03 서비스/API 테스트에 status 응답 검증 추가.


- 2026-03-03
  - AD-01 전체 파이프라인의 recommendation audit status 집계 기능 추가.
  - AD-02 API(`/pipelines/recommendation-audit-status-overview`) 및 CLI(`recommendation-audit-status-overview`) 추가.
  - AD-03 서비스/API 테스트에 overview 응답 검증 추가.


- 2026-03-03
  - AE-01 recommendation audit status overview 기반 issue 집계 기능 추가.
  - AE-02 API(`/pipelines/recommendation-audit-issues`) 및 CLI(`recommendation-audit-issues`) 추가.
  - AE-03 서비스/API 테스트에 issue summary 응답 검증 추가.


- 2026-03-03
  - AF-01 issue count와 severity weight를 결합한 audit hotspot 계산 기능 추가.
  - AF-02 API(`/pipelines/recommendation-audit-hotspots`) 및 CLI(`recommendation-audit-hotspots`) 추가.
  - AF-03 서비스/API 테스트에 hotspot 응답 검증 추가.


- 2026-03-03
  - AG-01 recommendation audit hotspot 상위 N개 제한 응답 기능 추가.
  - AG-02 API(`/pipelines/recommendation-audit-top-hotspots`) 및 CLI(`recommendation-audit-top-hotspots`) 추가.
  - AG-03 서비스/API 테스트에 limit 동작 검증 추가.


- 2026-03-03
  - AH-01 top-hotspots 결과에 영향 파이프라인 목록/개수 집계 추가.
  - AH-02 영향 커버리지 백분율(`impactedCoveragePercent`) 계산 추가.
  - AH-03 서비스/API 테스트 및 README에 영향 범위 필드 반영.


- 2026-03-03
  - AI-01 top-hotspots 결과에 `minImpactScore` 기반 필터링 추가.
  - AI-02 API 쿼리(`minImpactScore`)와 CLI 인자(`[minImpactScore]`) 지원 추가.
  - AI-03 서비스/API 테스트 및 README 사용 예시 업데이트.


- 2026-03-03
  - AJ-01 top-hotspots 응답에 필터 전/후 개수 메타데이터(`totalHotspots`, `filteredHotspotCount`, `filteredOutCount`) 추가.
  - AJ-02 API/CLI top-hotspots 출력에 필터 결과 메타데이터 노출.
  - AJ-03 서비스/API 테스트 및 README에 메타데이터 항목 반영.


- 2026-03-03
  - AK-01 top-hotspots 응답에 `includeIssues` 기반 이슈 유형 필터링 추가.
  - AK-02 API 쿼리(`includeIssues`)와 CLI 인자(`[includeIssuesCsv]`) 지원 추가.
  - AK-03 서비스/API 테스트 및 README 사용 예시 업데이트.


- 2026-03-03
  - AL-01 top-hotspots 응답에 impact/issue 필터 단계별 제외 수치 추가.
  - AL-02 `impactFilteredCount`, `excludedByImpactFilterCount`, `excludedByIssueFilterCount` 노출 추가.
  - AL-03 서비스/API 테스트 및 README에 단계별 필터 메타데이터 반영.


- 2026-03-03
  - AM-01 includeIssues 입력을 유효/무효 목록으로 분리(`appliedIncludeIssues`, `ignoredIncludeIssues`) 추가.
  - AM-02 top-hotspots API/CLI 응답에 유효/무효 분리 메타데이터 노출.
  - AM-03 서비스/API 테스트 및 README에 분리 메타데이터 반영.


- 2026-03-04
  - AN-01 top-hotspots 응답에 필터 가능 이슈 목록(`knownIssues`) 노출 추가.
  - AN-02 includeIssues 유효/무효 분리 메타데이터와 knownIssues 연계 보강.
  - AN-03 서비스/API 테스트 및 README에 knownIssues 항목 반영.


- 2026-03-04
  - AO-01 includeIssues 입력의 요청/고유/중복 개수 메타데이터 추가.
  - AO-02 top-hotspots API/CLI 응답에 중복 입력 메타데이터 노출.
  - AO-03 서비스/API 테스트 및 README 예시에 중복 입력 케이스 반영.


- 2026-03-04
  - AP-01 includeIssues 원본 외 정규화 배열(`normalizedIncludeIssues`) 메타데이터 추가.
  - AP-02 includeIssues와 knownIssues 비교를 대소문자 비민감 방식으로 개선.
  - AP-03 서비스/API 테스트 및 README 예시에 정규화 항목 반영.


- 2026-03-04
  - AQ-01 includeIssues 고유 요청 대비 적용 비율(`includeIssuesAppliedRatePercent`) 계산 추가.
  - AQ-02 top-hotspots API/CLI 응답에 includeIssues 적용률 메타데이터 노출.
  - AQ-03 서비스/API 테스트 및 README에 적용률 항목 반영.


- 2026-03-04
  - AR-01 includeIssues의 knownIssues 대비 적용 커버리지(`includeIssuesKnownCoveragePercent`) 계산 추가.
  - AR-02 top-hotspots API/CLI 응답에 known coverage 메타데이터 노출.
  - AR-03 서비스/API 테스트 및 README에 커버리지 항목 반영.

- 2026-03-04
  - AS-01 includeIssues 고유 요청 대비 무시 비율(`includeIssuesIgnoredRatePercent`) 계산 추가.
  - AS-02 top-hotspots API/CLI 응답에 includeIssues 무시 비율 메타데이터 노출.
  - AS-03 서비스/API 테스트 및 README에 무시 비율 항목 반영.

- 2026-03-04
  - AT-01 README에 테스트 가이드 섹션을 추가해 테스트 파일 역할을 문서화.
  - AT-02 반복 사용하는 CLI 스모크 체크 명령을 테스트 가이드에 정리.
  - AT-03 진행도 보고 시 `progress` + TASKS TODO 확인 루틴을 체크리스트로 반영.

- 2026-03-04
  - C-01 `/ui` 경로에 그래프 캔버스 UI 추가.
  - C-02 우측 속성 패널에서 노드 설정 변경 시 캔버스/비용 패널 즉시 반영.
  - C-03 실행 로그 패널과 비용 요약 패널 추가.
  - C-04 localStorage 저장/불러오기 기능 추가.

