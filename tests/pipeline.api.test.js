import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

import { createPipelineRepository } from '../src/services/pipelineRepository.js';
import { createRunRepository } from '../src/services/runRepository.js';
import { createRunService } from '../src/services/runService.js';
import { createPipelineService } from '../src/services/pipelineService.js';
import { createApiServer } from '../src/api/server.js';
import { createTaskProgressService } from '../src/services/taskProgressService.js';

function makeTempDir(sub = '') {
  const dir = path.join(process.cwd(), 'tmp-test-data', sub, String(Date.now()), String(Math.random()).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('api health/bootstrap/list/run lifecycle with run history', async () => {
  const pipelineDir = makeTempDir('pipelines');
  const runDir = makeTempDir('runs');

  const repo = createPipelineRepository(pipelineDir);
  const runRepo = createRunRepository(runDir);
  const runService = createRunService(runRepo);
  const service = createPipelineService(repo, runService);
  const taskProgressService = createTaskProgressService();
  const server = createApiServer(service, runService, taskProgressService);

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);

    const progress = await fetch(`${baseUrl}/progress`);
    const progressData = await progress.json();
    assert.equal(progress.status, 200);
    assert.ok(typeof progressData.progress.percent === 'number');

    const dashboard = await fetch(`${baseUrl}/dashboard?limit=2`);
    const dashboardData = await dashboard.json();
    assert.equal(dashboard.status, 200);
    assert.ok(typeof dashboardData.dashboard.progress.percent === 'number');
    assert.ok(typeof dashboardData.dashboard.runStats.totalRuns === 'number');
    assert.ok(Array.isArray(dashboardData.dashboard.recentRuns));
    assert.ok(Array.isArray(dashboardData.dashboard.nextTasks));

    const nextTasks = await fetch(`${baseUrl}/next-tasks?limit=3`);
    const nextTasksData = await nextTasks.json();
    assert.equal(nextTasks.status, 200);
    assert.ok(Array.isArray(nextTasksData.nextTasks));

    const templates = await fetch(`${baseUrl}/templates`);
    assert.equal(templates.status, 200);

    const profiles = await fetch(`${baseUrl}/run-profiles`);
    const profilesData = await profiles.json();
    assert.equal(profiles.status, 200);
    assert.ok(Array.isArray(profilesData.runProfiles));

    const objectives = await fetch(`${baseUrl}/recommend-objectives`);
    const objectivesData = await objectives.json();
    assert.equal(objectives.status, 200);
    assert.ok(Array.isArray(objectivesData.objectives));
    assert.ok(objectivesData.objectives.includes('balanced'));

    const bootstrap = await fetch(`${baseUrl}/pipelines/bootstrap`, { method: 'POST' });
    assert.equal(bootstrap.status, 201);

    const validateById = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/validate`);
    assert.equal(validateById.status, 200);

    const insights = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/insights`);
    const insightsData = await insights.json();
    assert.equal(insights.status, 200);
    assert.ok(insightsData.insights.nodeCount > 0);

    const estimate = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/estimate?profile=resilient`);
    const estimateData = await estimate.json();
    assert.equal(estimate.status, 200);
    assert.equal(estimateData.estimate.profile, 'resilient');
    assert.ok(estimateData.estimate.estimate.expectedLatencyMs > 0);

    const matrix = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/profile-matrix`);
    const matrixData = await matrix.json();
    assert.equal(matrix.status, 200);
    assert.equal(matrixData.matrix.pipelineId, 'pipe_social_mvp');
    assert.ok(Array.isArray(matrixData.matrix.profiles));
    assert.ok(matrixData.matrix.profiles.some((p) => p.profile === 'default'));


    const recommendation = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommend-profile?objective=speed`);
    const recommendationData = await recommendation.json();
    assert.equal(recommendation.status, 200);
    assert.equal(recommendationData.recommendation.objective, 'speed');
    assert.equal(recommendationData.recommendation.pipelineId, 'pipe_social_mvp');
    assert.equal(typeof recommendationData.recommendation.recommendedProfile, 'string');
    assert.equal(typeof recommendationData.recommendation.rationale, 'string');
    assert.ok(recommendationData.recommendation.tradeoffSummary);

    const invalidRecommendation = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommend-profile?objective=unknown`);
    const invalidRecommendationData = await invalidRecommendation.json();
    assert.equal(invalidRecommendation.status, 400);
    assert.ok(Array.isArray(invalidRecommendationData.supportedObjectives));

    const recommendationMatrix = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-matrix`);
    const recommendationMatrixData = await recommendationMatrix.json();
    assert.equal(recommendationMatrix.status, 200);
    assert.equal(recommendationMatrixData.recommendationMatrix.pipelineId, 'pipe_social_mvp');
    assert.ok(Array.isArray(recommendationMatrixData.recommendationMatrix.objectives));

    const recommendationSnapshot = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-snapshot`);
    const recommendationSnapshotData = await recommendationSnapshot.json();
    assert.equal(recommendationSnapshot.status, 200);
    assert.equal(recommendationSnapshotData.recommendationSnapshot.pipelineId, 'pipe_social_mvp');
    assert.ok(typeof recommendationSnapshotData.recommendationSnapshot.byObjective === 'object');

    const recommendationConsensus = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-consensus`);
    const recommendationConsensusData = await recommendationConsensus.json();
    assert.equal(recommendationConsensus.status, 200);
    assert.equal(recommendationConsensusData.recommendationConsensus.pipelineId, 'pipe_social_mvp');
    assert.equal(typeof recommendationConsensusData.recommendationConsensus.consensusProfile, 'string');
    assert.equal(typeof recommendationConsensusData.recommendationConsensus.hasTie, 'boolean');
    assert.ok(Array.isArray(recommendationConsensusData.recommendationConsensus.tiedProfiles));
    if (recommendationConsensusData.recommendationConsensus.hasTie) {
      assert.equal(recommendationConsensusData.recommendationConsensus.tieBreaker, 'objective-priority');
      assert.equal(typeof recommendationConsensusData.recommendationConsensus.tieBreakerReason, 'string');
    }

    const recommendationDecisionLog = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-decision-log`);
    const recommendationDecisionLogData = await recommendationDecisionLog.json();
    assert.equal(recommendationDecisionLog.status, 200);
    assert.equal(recommendationDecisionLogData.recommendationDecisionLog.pipelineId, 'pipe_social_mvp');
    assert.ok(Array.isArray(recommendationDecisionLogData.recommendationDecisionLog.voteTable));

    const recommendationAudit = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-audit`);
    const recommendationAuditData = await recommendationAudit.json();
    assert.equal(recommendationAudit.status, 200);
    assert.equal(recommendationAuditData.recommendationAudit.pipelineId, 'pipe_social_mvp');
    assert.equal(recommendationAuditData.recommendationAudit.checks.consistentSelection, true);

    const recommendationAuditSummary = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-audit-summary`);
    const recommendationAuditSummaryData = await recommendationAuditSummary.json();
    assert.equal(recommendationAuditSummary.status, 200);
    assert.equal(recommendationAuditSummaryData.recommendationAuditSummary.pipelineId, 'pipe_social_mvp');
    assert.equal(typeof recommendationAuditSummaryData.recommendationAuditSummary.consensusProfile, 'string');

    const recommendationAuditStatus = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/recommendation-audit-status`);
    const recommendationAuditStatusData = await recommendationAuditStatus.json();
    assert.equal(recommendationAuditStatus.status, 200);
    assert.equal(recommendationAuditStatusData.recommendationAuditStatus.pipelineId, 'pipe_social_mvp');
    assert.ok(['ok', 'warn', 'error'].includes(recommendationAuditStatusData.recommendationAuditStatus.status));

    const createSecond = await fetch(`${baseUrl}/templates/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: 'mvp-x-threads', pipelineMeta: { id: 'compare_p2', name: 'Compare P2' } }),
    });
    assert.equal(createSecond.status, 201);

    const compare = await fetch(`${baseUrl}/pipelines/compare?leftId=pipe_social_mvp&rightId=compare_p2`);
    const compareData = await compare.json();
    assert.equal(compare.status, 200);
    assert.ok(typeof compareData.comparison.summary.nodeCountDiff === 'number');

    const recommendationMatrixQuery = await fetch(`${baseUrl}/pipelines/recommendation-matrix?pipelineId=pipe_social_mvp`);
    const recommendationMatrixQueryData = await recommendationMatrixQuery.json();
    assert.equal(recommendationMatrixQuery.status, 200);
    assert.equal(recommendationMatrixQueryData.recommendationMatrix.pipelineId, 'pipe_social_mvp');

    const recommendationSnapshotQuery = await fetch(`${baseUrl}/pipelines/recommendation-snapshot?pipelineId=pipe_social_mvp`);
    const recommendationSnapshotQueryData = await recommendationSnapshotQuery.json();
    assert.equal(recommendationSnapshotQuery.status, 200);
    assert.equal(recommendationSnapshotQueryData.recommendationSnapshot.pipelineId, 'pipe_social_mvp');

    const recommendationConsensusQuery = await fetch(`${baseUrl}/pipelines/recommendation-consensus?pipelineId=pipe_social_mvp`);
    const recommendationConsensusQueryData = await recommendationConsensusQuery.json();
    assert.equal(recommendationConsensusQuery.status, 200);
    assert.equal(recommendationConsensusQueryData.recommendationConsensus.pipelineId, 'pipe_social_mvp');

    const recommendationDecisionLogQuery = await fetch(`${baseUrl}/pipelines/recommendation-decision-log?pipelineId=pipe_social_mvp`);
    const recommendationDecisionLogQueryData = await recommendationDecisionLogQuery.json();
    assert.equal(recommendationDecisionLogQuery.status, 200);
    assert.equal(recommendationDecisionLogQueryData.recommendationDecisionLog.pipelineId, 'pipe_social_mvp');

    const recommendationAuditQuery = await fetch(`${baseUrl}/pipelines/recommendation-audit?pipelineId=pipe_social_mvp`);
    const recommendationAuditQueryData = await recommendationAuditQuery.json();
    assert.equal(recommendationAuditQuery.status, 200);
    assert.equal(recommendationAuditQueryData.recommendationAudit.pipelineId, 'pipe_social_mvp');

    const recommendationAuditSummaryQuery = await fetch(`${baseUrl}/pipelines/recommendation-audit-summary?pipelineId=pipe_social_mvp`);
    const recommendationAuditSummaryQueryData = await recommendationAuditSummaryQuery.json();
    assert.equal(recommendationAuditSummaryQuery.status, 200);
    assert.equal(recommendationAuditSummaryQueryData.recommendationAuditSummary.pipelineId, 'pipe_social_mvp');


    const uiIndex = await fetch(`${baseUrl}/ui`);
    const uiHtml = await uiIndex.text();
    assert.equal(uiIndex.status, 200);
    assert.ok(uiHtml.includes('OmniPostAI Pipeline Studio'));

    const uiScript = await fetch(`${baseUrl}/ui/app.js`);
    const uiScriptText = await uiScript.text();
    assert.equal(uiScript.status, 200);
    assert.ok(uiScriptText.includes('bootstrapSample'));

    const recommendationAuditStatusQuery = await fetch(`${baseUrl}/pipelines/recommendation-audit-status?pipelineId=pipe_social_mvp`);
    const recommendationAuditStatusQueryData = await recommendationAuditStatusQuery.json();
    assert.equal(recommendationAuditStatusQuery.status, 200);
    assert.equal(recommendationAuditStatusQueryData.recommendationAuditStatus.pipelineId, 'pipe_social_mvp');

    const recommendationAuditStatusOverview = await fetch(`${baseUrl}/pipelines/recommendation-audit-status-overview`);
    const recommendationAuditStatusOverviewData = await recommendationAuditStatusOverview.json();
    assert.equal(recommendationAuditStatusOverview.status, 200);
    assert.ok(['ok', 'warn', 'error'].includes(recommendationAuditStatusOverviewData.recommendationAuditStatusOverview.overallStatus));
    assert.ok(recommendationAuditStatusOverviewData.recommendationAuditStatusOverview.totalPipelines >= 1);

    const recommendationAuditIssues = await fetch(`${baseUrl}/pipelines/recommendation-audit-issues`);
    const recommendationAuditIssuesData = await recommendationAuditIssues.json();
    assert.equal(recommendationAuditIssues.status, 200);
    assert.equal(typeof recommendationAuditIssuesData.recommendationAuditIssues.totalIssues, 'number');
    assert.equal(typeof recommendationAuditIssuesData.recommendationAuditIssues.issueCounts, 'object');

    const recommendationAuditHotspots = await fetch(`${baseUrl}/pipelines/recommendation-audit-hotspots`);
    const recommendationAuditHotspotsData = await recommendationAuditHotspots.json();
    assert.equal(recommendationAuditHotspots.status, 200);
    assert.ok(Array.isArray(recommendationAuditHotspotsData.recommendationAuditHotspots.hotspots));

    const recommendationAuditTopHotspots = await fetch(`${baseUrl}/pipelines/recommendation-audit-top-hotspots?limit=1&minImpactScore=0`);
    const recommendationAuditTopHotspotsData = await recommendationAuditTopHotspots.json();
    assert.equal(recommendationAuditTopHotspots.status, 200);
    assert.equal(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.limit, 1);
    assert.equal(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.minImpactScore, 0);
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssues));
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.normalizedIncludeIssues));
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.requestedIncludeIssuesCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.uniqueIncludeIssuesCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.duplicateIncludeIssuesCount, 'number');
    assert.ok(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssuesAppliedRatePercent === null || typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssuesAppliedRatePercent === 'number');
    assert.ok(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssuesIgnoredRatePercent === null || typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssuesIgnoredRatePercent === 'number');
    assert.ok(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssuesKnownCoveragePercent === null || typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.includeIssuesKnownCoveragePercent === 'number');
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.appliedIncludeIssues));
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.ignoredIncludeIssues));
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.knownIssues));
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.totalHotspots, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.impactFilteredCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.excludedByImpactFilterCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.filteredHotspotCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.excludedByIssueFilterCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.filteredOutCount, 'number');
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.hotspots));
    assert.ok(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.hotspots.length <= 1);
    assert.ok(Array.isArray(recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.impactedPipelines));
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.impactedPipelineCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsData.recommendationAuditTopHotspots.impactedCoveragePercent, 'number');


    const recommendationAuditTopHotspotsByIssue = await fetch(`${baseUrl}/pipelines/recommendation-audit-top-hotspots?limit=5&minImpactScore=0&includeIssues=non-existent-issue,non-existent-issue`);
    const recommendationAuditTopHotspotsByIssueData = await recommendationAuditTopHotspotsByIssue.json();
    assert.equal(recommendationAuditTopHotspotsByIssue.status, 200);
    assert.ok(Array.isArray(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.includeIssues));
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.includeIssues[0], 'non-existent-issue');
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.normalizedIncludeIssues[0], 'non-existent-issue');
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.requestedIncludeIssuesCount, 2);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.uniqueIncludeIssuesCount, 1);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.duplicateIncludeIssuesCount, 1);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.includeIssuesAppliedRatePercent, 0);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.includeIssuesIgnoredRatePercent, 100);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.includeIssuesKnownCoveragePercent, null);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.appliedIncludeIssues.length, 0);
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.ignoredIncludeIssues[0], 'non-existent-issue');
    assert.ok(Array.isArray(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.knownIssues));
    assert.equal(recommendationAuditTopHotspotsByIssueData.recommendationAuditTopHotspots.hotspots.length, 0);

    const recommendationAuditTopHotspotsFiltered = await fetch(`${baseUrl}/pipelines/recommendation-audit-top-hotspots?limit=5&minImpactScore=999`);
    const recommendationAuditTopHotspotsFilteredData = await recommendationAuditTopHotspotsFiltered.json();
    assert.equal(recommendationAuditTopHotspotsFiltered.status, 200);
    assert.equal(recommendationAuditTopHotspotsFilteredData.recommendationAuditTopHotspots.minImpactScore, 999);
    assert.equal(typeof recommendationAuditTopHotspotsFilteredData.recommendationAuditTopHotspots.excludedByImpactFilterCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsFilteredData.recommendationAuditTopHotspots.excludedByIssueFilterCount, 'number');
    assert.equal(typeof recommendationAuditTopHotspotsFilteredData.recommendationAuditTopHotspots.filteredOutCount, 'number');
    assert.equal(recommendationAuditTopHotspotsFilteredData.recommendationAuditTopHotspots.hotspots.length, 0);

    const list = await fetch(`${baseUrl}/pipelines`);
    const listData = await list.json();
    assert.ok(listData.pipelines.includes('pipe_social_mvp'));

    const run = await fetch(`${baseUrl}/pipelines/pipe_social_mvp/run?profile=fast`, { method: 'POST' });
    const runData = await run.json();
    assert.equal(run.status, 200);
    assert.equal(runData.ok, true);
    assert.ok(runData.runId);
    assert.equal(runData.profile, 'fast');

    const runs = await fetch(`${baseUrl}/runs`);
    const runsData = await runs.json();
    assert.ok(runsData.runs.includes(runData.runId));

    const records = await fetch(`${baseUrl}/runs/records`);
    const recordsData = await records.json();
    assert.ok(recordsData.records.length >= 1);

    const stats = await fetch(`${baseUrl}/runs/stats`);
    const statsData = await stats.json();
    assert.ok(statsData.stats.totalRuns >= 1);
    assert.ok(typeof statsData.stats.failureReasons === 'object');
    assert.ok(typeof statsData.stats.totalRetries === 'number');

    const runDetail = await fetch(`${baseUrl}/runs/${runData.runId}`);
    const runDetailData = await runDetail.json();
    assert.equal(runDetail.status, 200);
    assert.equal(runDetailData.run.runId, runData.runId);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
