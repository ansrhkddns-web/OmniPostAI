import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createPipelineRepository } from '../src/services/pipelineRepository.js';
import { createRunRepository } from '../src/services/runRepository.js';
import { createRunService } from '../src/services/runService.js';
import { createPipelineService } from '../src/services/pipelineService.js';

function makeTempDir(sub = '') {
  const dir = path.join(process.cwd(), 'tmp-test-data', sub, String(Date.now()), String(Math.random()).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('pipeline repository save/list/get/delete flow', () => {
  const baseDir = makeTempDir('repo');
  const repo = createPipelineRepository(baseDir);

  const pipeline = {
    pipelineMeta: { id: 'p1', name: 'P1', updatedAt: new Date().toISOString() },
    nodes: [{ id: 'n1', type: 'Input', position: { x: 0, y: 0 }, data: { name: 'Input' } }],
    edges: [],
  };

  repo.save(pipeline);
  assert.deepEqual(repo.list(), ['p1']);
  assert.equal(repo.getById('p1').pipelineMeta.id, 'p1');
  assert.equal(repo.remove('p1'), true);
  assert.equal(repo.getById('p1'), null);
});

test('pipeline service bootstrap and run records run history', async () => {
  const pipelineDir = makeTempDir('pipelines');
  const runDir = makeTempDir('runs');

  const repo = createPipelineRepository(pipelineDir);
  const runRepo = createRunRepository(runDir);
  const runService = createRunService(runRepo);
  const service = createPipelineService(repo, runService);

  service.bootstrapSample();
  const ids = service.listPipelines();
  assert.ok(ids.includes('pipe_social_mvp'));

  const result = await service.runPipeline('pipe_social_mvp', {
    random: () => 0.99,
    shouldDelay: false,
    minDelayMs: 1,
    maxDelayMs: 1,
  });

  assert.equal(result.ok, true);
  assert.ok(result.summary.totalTokens > 0);
  assert.ok(result.reportPath.includes('pipe_social_mvp-'));
  assert.ok(result.runRecord?.runId);

  const runIds = runService.listRuns();
  assert.ok(runIds.includes(result.runRecord.runId));
});

test('pipeline template creation and validation by id', () => {
  const pipelineDir = makeTempDir('pipelines-template');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  const templates = service.listTemplates();
  assert.ok(templates.some((t) => t.templateId === 'mvp-x-threads'));

  const created = service.createFromTemplate('mvp-x-threads', { id: 'tpl_1', name: 'Template 1' });
  assert.equal(created.pipelineMeta.id, 'tpl_1');

  const validation = service.validatePipelineById('tpl_1');
  assert.equal(validation.valid, true);
});

test('runService getStats aggregates records', async () => {
  const pipelineDir = makeTempDir('pipelines-stats');
  const runDir = makeTempDir('runs-stats');

  const repo = createPipelineRepository(pipelineDir);
  const runRepo = createRunRepository(runDir);
  const runService = createRunService(runRepo);
  const service = createPipelineService(repo, runService);

  service.bootstrapSample();
  await service.runPipeline('pipe_social_mvp', { random: () => 0.99, shouldDelay: false, minDelayMs: 1, maxDelayMs: 1 });
  await service.runPipeline('pipe_social_mvp', { random: () => 0.99, shouldDelay: false, minDelayMs: 1, maxDelayMs: 1 });

  const stats = runService.getStats();
  assert.equal(stats.totalRuns, 2);
  assert.ok(stats.totalTokens > 0);
  assert.ok(stats.byPipeline.pipe_social_mvp >= 2);
  assert.ok(typeof stats.failureReasons === 'object');
  assert.ok(typeof stats.totalRetries === 'number');
});


test('runService getRecentRuns returns latest records by createdAt desc', async () => {
  const pipelineDir = makeTempDir('pipelines-recent');
  const runDir = makeTempDir('runs-recent');

  const repo = createPipelineRepository(pipelineDir);
  const runRepo = createRunRepository(runDir);
  const runService = createRunService(runRepo);
  const service = createPipelineService(repo, runService);

  service.bootstrapSample();
  await service.runPipeline('pipe_social_mvp', { random: () => 0.99, shouldDelay: false, minDelayMs: 1, maxDelayMs: 1 });
  await service.runPipeline('pipe_social_mvp', { random: () => 0.99, shouldDelay: false, minDelayMs: 1, maxDelayMs: 1 });

  const recent = runService.getRecentRuns(1);
  assert.equal(recent.length, 1);
  assert.ok(recent[0].runId);
});


test('pipeline insights returns structural summary', () => {
  const pipelineDir = makeTempDir('pipelines-insights');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const insights = service.getPipelineInsights('pipe_social_mvp');

  assert.equal(insights.pipelineId, 'pipe_social_mvp');
  assert.ok(insights.nodeCount > 0);
  assert.ok(insights.edgeCount > 0);
  assert.ok(Array.isArray(insights.entryNodes));
  assert.ok(Array.isArray(insights.terminalNodes));
  assert.ok(typeof insights.nodeTypeCounts === 'object');
});


test('pipeline compare returns structural diffs', () => {
  const pipelineDir = makeTempDir('pipelines-compare');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  service.createFromTemplate('mvp-x-threads', { id: 'p2', name: 'P2' });

  const p2 = repo.getById('p2');
  p2.nodes.push({
    id: 'extra_1',
    type: 'FormatterAgent',
    position: { x: 1, y: 1 },
    data: { name: 'Extra Formatter' },
  });
  repo.save(p2);

  const cmp = service.comparePipelines('pipe_social_mvp', 'p2');
  assert.equal(cmp.summary.nodeCountDiff, 1);
  assert.ok(typeof cmp.nodeTypeDiff.FormatterAgent === 'number');
});


test('run profiles are listed and executable', async () => {
  const pipelineDir = makeTempDir('pipelines-profiles');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const profiles = service.listRunProfiles();
  assert.ok(profiles.some((p) => p.profileId === 'default'));
  assert.ok(profiles.some((p) => p.profileId === 'fast'));

  const result = await service.runPipeline('pipe_social_mvp', { random: () => 0.99 }, 'fast');
  assert.equal(result.ok, true);
  assert.equal(result.profile, 'fast');
});


test('estimate run returns profile aware prediction', () => {
  const pipelineDir = makeTempDir('pipelines-estimate');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const estimate = service.estimateRun('pipe_social_mvp', 'resilient');

  assert.equal(estimate.pipelineId, 'pipe_social_mvp');
  assert.equal(estimate.profile, 'resilient');
  assert.ok(estimate.estimate.expectedLatencyMs > 0);
  assert.ok(estimate.estimate.expectedSuccessRate >= 0);
});


test('profile matrix returns all profiles with estimates', () => {
  const pipelineDir = makeTempDir('pipelines-profile-matrix');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const matrix = service.getProfileMatrix('pipe_social_mvp');

  assert.equal(matrix.pipelineId, 'pipe_social_mvp');
  assert.equal(Array.isArray(matrix.profiles), true);
  assert.ok(matrix.profiles.length >= 3);
  assert.ok(matrix.profiles.some((p) => p.profile === 'default'));
  assert.ok(matrix.profiles.some((p) => p.profile === 'fast'));
  assert.ok(matrix.profiles.some((p) => p.profile === 'resilient'));
  assert.ok(matrix.profiles.every((p) => p.estimate.expectedLatencyMs > 0));
});


test('recommend run profile returns ranked profiles', () => {
  const pipelineDir = makeTempDir('pipelines-recommend-profile');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const recommendation = service.recommendRunProfile('pipe_social_mvp', 'reliability');

  assert.equal(recommendation.pipelineId, 'pipe_social_mvp');
  assert.equal(recommendation.objective, 'reliability');
  assert.ok(Array.isArray(recommendation.rankedProfiles));
  assert.ok(recommendation.rankedProfiles.length >= 3);
  assert.equal(typeof recommendation.recommendedProfile, 'string');
  assert.ok(recommendation.rankedProfiles[0].score <= recommendation.rankedProfiles[1].score);
  assert.equal(typeof recommendation.rationale, 'string');
  assert.ok(recommendation.rationale.length > 0);
  assert.ok(recommendation.tradeoffSummary);
  assert.equal(typeof recommendation.tradeoffSummary.winner, 'string');
});


test('list recommendation objectives returns supported objective ids', () => {
  const pipelineDir = makeTempDir('pipelines-objectives');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  const objectives = service.listRecommendObjectives();
  assert.ok(objectives.includes('balanced'));
  assert.ok(objectives.includes('speed'));
  assert.ok(objectives.includes('reliability'));
  assert.ok(objectives.includes('cost'));
});


test('recommendation matrix returns recommendation for each objective', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-matrix');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const matrix = service.getRecommendationMatrix('pipe_social_mvp');

  assert.equal(matrix.pipelineId, 'pipe_social_mvp');
  assert.ok(Array.isArray(matrix.objectives));
  assert.ok(matrix.objectives.length >= 4);
  assert.ok(matrix.objectives.some((entry) => entry.objective === 'balanced'));
  assert.ok(matrix.objectives.every((entry) => typeof entry.recommendedProfile === 'string'));
});


test('recommendation snapshot returns compact objective map', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-snapshot');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const snapshot = service.getRecommendationSnapshot('pipe_social_mvp');

  assert.equal(snapshot.pipelineId, 'pipe_social_mvp');
  assert.equal(typeof snapshot.byObjective, 'object');
  assert.ok(typeof snapshot.byObjective.balanced === 'string');
  assert.ok(Array.isArray(snapshot.uniqueRecommendedProfiles));
  assert.ok(snapshot.objectivesCount >= 4);
});


test('recommendation consensus returns vote aggregation', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-consensus');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const consensus = service.getRecommendationConsensus('pipe_social_mvp');

  assert.equal(consensus.pipelineId, 'pipe_social_mvp');
  assert.equal(typeof consensus.consensusProfile, 'string');
  assert.equal(typeof consensus.votes, 'object');
  assert.ok(consensus.objectivesCount >= 4);
  assert.ok(consensus.consensusRate > 0);
  assert.equal(typeof consensus.hasTie, 'boolean');
  assert.ok(Array.isArray(consensus.tiedProfiles));
  assert.ok(consensus.tiedProfiles.length >= 1);
  if (consensus.hasTie) {
    assert.equal(consensus.tieBreaker, 'objective-priority');
    assert.equal(typeof consensus.tieBreakerReason, 'string');
  } else {
    assert.equal(consensus.tieBreaker, null);
  }
});


test('consensus uses objective-priority tie-breaker when votes are tied', () => {
  const byObjective = {
    balanced: 'fast',
    reliability: 'resilient',
    speed: 'resilient',
    cost: 'fast',
  };

  const votes = Object.entries(byObjective).reduce((acc, [, profile]) => {
    acc[profile] = (acc[profile] ?? 0) + 1;
    return acc;
  }, {});
  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const top = sortedVotes[0][1];
  const tiedProfiles = sortedVotes.filter(([, count]) => count === top).map(([profile]) => profile);

  const objectivePriority = ['balanced', 'reliability', 'speed', 'cost'];
  const matchedObjective = objectivePriority.find((objective) => tiedProfiles.includes(byObjective[objective]));
  const tieResolvedProfile = matchedObjective ? byObjective[matchedObjective] : tiedProfiles[0];

  assert.equal(tiedProfiles.length > 1, true);
  assert.equal(matchedObjective, 'balanced');
  assert.equal(tieResolvedProfile, 'fast');
});


test('recommendation decision log returns vote table and selected profile', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-decision-log');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const log = service.getRecommendationDecisionLog('pipe_social_mvp');

  assert.equal(log.pipelineId, 'pipe_social_mvp');
  assert.ok(Array.isArray(log.voteTable));
  assert.ok(log.voteTable.length >= 1);
  assert.ok(Array.isArray(log.objectivePriority));
  assert.equal(typeof log.selectedProfile, 'string');
});


test('recommendation audit returns bundled payload with consistency checks', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const audit = service.getRecommendationAudit('pipe_social_mvp');

  assert.equal(audit.pipelineId, 'pipe_social_mvp');
  assert.equal(typeof audit.checks, 'object');
  assert.equal(audit.checks.consistentSelection, true);
  assert.equal(audit.checks.objectiveCountMatchesVotes, true);
  assert.equal(typeof audit.consensus.consensusProfile, 'string');
});


test('recommendation audit summary returns compact consistent payload', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-summary');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const summary = service.getRecommendationAuditSummary('pipe_social_mvp');

  assert.equal(summary.pipelineId, 'pipe_social_mvp');
  assert.equal(typeof summary.consensusProfile, 'string');
  assert.equal(typeof summary.consensusRate, 'number');
  assert.equal(typeof summary.checks.consistentSelection, 'boolean');
  assert.ok(summary.recommendedProfileCount >= 1);
});


test('recommendation audit status returns ok/warn/error envelope', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-status');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const status = service.getRecommendationAuditStatus('pipe_social_mvp');

  assert.equal(status.pipelineId, 'pipe_social_mvp');
  assert.ok(['ok', 'warn', 'error'].includes(status.status));
  assert.ok(Array.isArray(status.issues));
  assert.equal(typeof status.summary.consensusProfile, 'string');
});


test('recommendation audit status overview aggregates statuses across pipelines', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-status-overview');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const overview = service.getRecommendationAuditStatusOverview();

  assert.equal(typeof overview.generatedAt, 'string');
  assert.ok(overview.totalPipelines >= 1);
  assert.ok(['ok', 'warn', 'error'].includes(overview.overallStatus));
  assert.equal(typeof overview.statusCounts.ok, 'number');
  assert.equal(typeof overview.statusCounts.warn, 'number');
  assert.equal(typeof overview.statusCounts.error, 'number');
  assert.ok(Array.isArray(overview.pipelines));
  assert.ok(overview.pipelines.some((entry) => entry.pipelineId === 'pipe_social_mvp'));
});


test('recommendation audit issue summary aggregates issue counts', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-issues');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const issues = service.getRecommendationAuditIssueSummary();

  assert.equal(typeof issues.generatedAt, 'string');
  assert.ok(issues.totalPipelines >= 1);
  assert.ok(['ok', 'warn', 'error'].includes(issues.overallStatus));
  assert.equal(typeof issues.totalIssues, 'number');
  assert.equal(typeof issues.issueCounts, 'object');
  assert.equal(typeof issues.pipelinesByIssue, 'object');
});


test('recommendation audit hotspots returns prioritized issue list', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-hotspots');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const hotspots = service.getRecommendationAuditHotspots();

  assert.equal(typeof hotspots.generatedAt, 'string');
  assert.ok(hotspots.totalPipelines >= 1);
  assert.equal(typeof hotspots.totalIssues, 'number');
  assert.ok(Array.isArray(hotspots.hotspots));
  if (hotspots.hotspots.length > 0) {
    const first = hotspots.hotspots[0];
    assert.equal(typeof first.issue, 'string');
    assert.equal(typeof first.count, 'number');
    assert.equal(typeof first.severityWeight, 'number');
    assert.equal(typeof first.impactScore, 'number');
    assert.ok(Array.isArray(first.pipelines));
  }
});


test('recommendation audit top hotspots limits result size', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-top-hotspots');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const topHotspots = service.getRecommendationAuditTopHotspots(1, 0);

  assert.equal(typeof topHotspots.generatedAt, 'string');
  assert.equal(topHotspots.limit, 1);
  assert.equal(topHotspots.minImpactScore, 0);
  assert.ok(Array.isArray(topHotspots.includeIssues));
  assert.equal(topHotspots.includeIssues.length, 0);
  assert.ok(Array.isArray(topHotspots.normalizedIncludeIssues));
  assert.equal(topHotspots.normalizedIncludeIssues.length, 0);
  assert.equal(topHotspots.requestedIncludeIssuesCount, 0);
  assert.equal(topHotspots.uniqueIncludeIssuesCount, 0);
  assert.equal(topHotspots.duplicateIncludeIssuesCount, 0);
  assert.equal(topHotspots.includeIssuesAppliedRatePercent, null);
  assert.equal(topHotspots.includeIssuesIgnoredRatePercent, null);
  assert.equal(topHotspots.includeIssuesKnownCoveragePercent, null);
  assert.ok(Array.isArray(topHotspots.appliedIncludeIssues));
  assert.ok(Array.isArray(topHotspots.ignoredIncludeIssues));
  assert.ok(Array.isArray(topHotspots.knownIssues));
  assert.equal(typeof topHotspots.totalHotspots, 'number');
  assert.equal(typeof topHotspots.impactFilteredCount, 'number');
  assert.equal(typeof topHotspots.excludedByImpactFilterCount, 'number');
  assert.equal(typeof topHotspots.filteredHotspotCount, 'number');
  assert.equal(typeof topHotspots.excludedByIssueFilterCount, 'number');
  assert.equal(typeof topHotspots.filteredOutCount, 'number');
  assert.ok(topHotspots.filteredOutCount >= 0);
  assert.ok(Array.isArray(topHotspots.hotspots));
  assert.ok(topHotspots.hotspots.length <= 1);
  assert.ok(Array.isArray(topHotspots.impactedPipelines));
  assert.equal(typeof topHotspots.impactedPipelineCount, 'number');
  assert.equal(typeof topHotspots.impactedCoveragePercent, 'number');
  assert.ok(topHotspots.impactedCoveragePercent >= 0 && topHotspots.impactedCoveragePercent <= 100);
});


test('recommendation audit top hotspots applies minImpactScore filter', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-top-hotspots-min-impact');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const topHotspots = service.getRecommendationAuditTopHotspots(5, 999);

  assert.equal(topHotspots.minImpactScore, 999);
  assert.equal(typeof topHotspots.excludedByImpactFilterCount, 'number');
  assert.equal(typeof topHotspots.excludedByIssueFilterCount, 'number');
  assert.equal(typeof topHotspots.filteredOutCount, 'number');
  assert.ok(Array.isArray(topHotspots.hotspots));
  assert.equal(topHotspots.hotspots.length, 0);
});


test('recommendation audit top hotspots applies includeIssues filter', () => {
  const pipelineDir = makeTempDir('pipelines-recommendation-audit-top-hotspots-include-issues');
  const repo = createPipelineRepository(pipelineDir);
  const service = createPipelineService(repo);

  service.bootstrapSample();
  const topHotspots = service.getRecommendationAuditTopHotspots(5, 0, 'non-existent-issue');

  assert.ok(Array.isArray(topHotspots.includeIssues));
  assert.equal(topHotspots.includeIssues.length, 1);
  assert.equal(topHotspots.includeIssues[0], 'non-existent-issue');
  assert.equal(topHotspots.appliedIncludeIssues.length, 0);
  assert.equal(topHotspots.includeIssuesAppliedRatePercent, 0);
  assert.equal(topHotspots.includeIssuesIgnoredRatePercent, 100);
  assert.equal(topHotspots.ignoredIncludeIssues[0], 'non-existent-issue');
  assert.ok(Array.isArray(topHotspots.knownIssues));
  assert.equal(typeof topHotspots.excludedByIssueFilterCount, 'number');
  assert.ok(topHotspots.excludedByIssueFilterCount >= 0);
  assert.equal(topHotspots.hotspots.length, 0);
});
