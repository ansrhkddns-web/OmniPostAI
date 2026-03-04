import fs from 'node:fs';
import path from 'node:path';

import { samplePipeline } from '../pipeline/samplePipeline.js';
import { DefaultFailureRates } from '../pipeline/schema.js';
import { validatePipeline } from '../pipeline/validator.js';
import { runSimulation } from '../pipeline/simulator.js';
import { topologicalSort } from '../pipeline/topology.js';
import { buildSimulationMarkdownReport } from '../pipeline/report.js';

const RECOMMEND_OBJECTIVES = ['balanced', 'speed', 'reliability', 'cost'];
const OBJECTIVE_PRIORITY = ['balanced', 'reliability', 'speed', 'cost'];

const RUN_PROFILES = {
  default: {
    shouldDelay: false,
    maxRetries: 2,
    retryBaseDelayMs: 30,
  },
  fast: {
    shouldDelay: false,
    maxRetries: 1,
    retryBaseDelayMs: 10,
    minDelayMs: 5,
    maxDelayMs: 15,
  },
  resilient: {
    shouldDelay: false,
    maxRetries: 4,
    retryBaseDelayMs: 50,
    minDelayMs: 10,
    maxDelayMs: 25,
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveRunOptions(profile = 'default', overrides = {}) {
  const base = RUN_PROFILES[profile];
  if (!base) throw new Error(`Unknown run profile: ${profile}`);
  return { ...base, ...overrides };
}



function buildProfileRationale(objective, rankedProfiles) {
  const best = rankedProfiles[0];
  if (!best) return 'No profiles available to recommend.';

  if (objective === 'speed') {
    return `Selected ${best.profile} because it has the lowest expected latency (${best.estimate.expectedLatencyMs}ms).`;
  }
  if (objective === 'reliability') {
    return `Selected ${best.profile} because it has the highest expected success rate (${best.estimate.expectedSuccessRate}%).`;
  }
  if (objective === 'cost') {
    return `Selected ${best.profile} because it has the lowest expected cost (USD ${best.estimate.expectedCostUsd}).`;
  }

  return `Selected ${best.profile} as the best balanced score across latency, retries, cost, and success rate.`;
}

function buildTradeoffSummary(rankedProfiles) {
  if (rankedProfiles.length < 2) {
    return null;
  }

  const best = rankedProfiles[0];
  const second = rankedProfiles[1];

  return {
    winner: best.profile,
    runnerUp: second.profile,
    latencyGapMs: Number((second.estimate.expectedLatencyMs - best.estimate.expectedLatencyMs).toFixed(2)),
    successRateGap: Number((best.estimate.expectedSuccessRate - second.estimate.expectedSuccessRate).toFixed(2)),
    costGapUsd: Number((second.estimate.expectedCostUsd - best.estimate.expectedCostUsd).toFixed(5)),
  };
}

function scoreProfile(profileEntry, objective = 'balanced') {
  const { estimate } = profileEntry;
  if (objective === 'speed') {
    return estimate.expectedLatencyMs;
  }
  if (objective === 'reliability') {
    return -estimate.expectedSuccessRate;
  }
  if (objective === 'cost') {
    return estimate.expectedCostUsd;
  }

  return (
    estimate.expectedLatencyMs * 0.5 +
    estimate.expectedCostUsd * 1000 * 0.2 +
    (100 - estimate.expectedSuccessRate) * 3 +
    estimate.expectedRetries * 10
  );
}

export function createPipelineService(repository, runService = null) {
  function run(pipelineId, options = {}, profile = 'default') {
    const pipeline = repository.getById(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const validation = validatePipeline(pipeline);
    if (!validation.valid) {
      return {
        ok: false,
        validation,
        summary: null,
        reportPath: null,
      };
    }

    const runOptions = resolveRunOptions(profile, options);

    return runSimulation(pipeline, runOptions).then((result) => {
      const report = buildSimulationMarkdownReport(pipeline, result);
      const reportDir = path.join(process.cwd(), 'reports');
      fs.mkdirSync(reportDir, { recursive: true });
      const reportPath = path.join(reportDir, `${pipelineId}-${Date.now()}.md`);
      fs.writeFileSync(reportPath, report, 'utf8');

      let runRecord = null;
      if (runService) {
        runRecord = runService.recordRun({
          pipelineId,
          summary: result.summary,
          order: result.order,
          reportPath,
          warnings: validation.warnings,
        });
      }

      return {
        ok: true,
        validation,
        summary: result.summary,
        order: result.order,
        reportPath,
        runRecord,
        profile,
      };
    });
  }

  function getPipelineInsights(pipelineId) {
    const pipeline = repository.getById(pipelineId);
    if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);

    const validation = validatePipeline(pipeline);
    const { order, hasCycle } = topologicalSort(pipeline);

    const nodeTypeCounts = {};
    for (const node of pipeline.nodes) {
      nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] ?? 0) + 1;
    }

    const incoming = new Map(pipeline.nodes.map((n) => [n.id, 0]));
    const outgoing = new Map(pipeline.nodes.map((n) => [n.id, 0]));
    for (const edge of pipeline.edges) {
      incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
      outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
    }

    const entryNodes = Array.from(incoming.entries()).filter(([, c]) => c === 0).map(([id]) => id);
    const terminalNodes = Array.from(outgoing.entries()).filter(([, c]) => c === 0).map(([id]) => id);

    return {
      pipelineId,
      nodeCount: pipeline.nodes.length,
      edgeCount: pipeline.edges.length,
      nodeTypeCounts,
      entryNodes,
      terminalNodes,
      hasCycle,
      topologicalOrderLength: order.length,
      validation,
    };
  }

  function comparePipelines(leftId, rightId) {
    const left = repository.getById(leftId);
    const right = repository.getById(rightId);
    if (!left) throw new Error(`Pipeline not found: ${leftId}`);
    if (!right) throw new Error(`Pipeline not found: ${rightId}`);

    const leftInsights = getPipelineInsights(leftId);
    const rightInsights = getPipelineInsights(rightId);

    const allTypes = new Set([
      ...Object.keys(leftInsights.nodeTypeCounts),
      ...Object.keys(rightInsights.nodeTypeCounts),
    ]);

    const nodeTypeDiff = {};
    for (const t of allTypes) {
      nodeTypeDiff[t] = (rightInsights.nodeTypeCounts[t] ?? 0) - (leftInsights.nodeTypeCounts[t] ?? 0);
    }

    return {
      leftId,
      rightId,
      summary: {
        nodeCountDiff: rightInsights.nodeCount - leftInsights.nodeCount,
        edgeCountDiff: rightInsights.edgeCount - leftInsights.edgeCount,
        hasCycleChanged: leftInsights.hasCycle !== rightInsights.hasCycle,
        validationChanged:
          leftInsights.validation.valid !== rightInsights.validation.valid ||
          leftInsights.validation.errors.length !== rightInsights.validation.errors.length,
      },
      nodeTypeDiff,
      entryNodes: {
        left: leftInsights.entryNodes,
        right: rightInsights.entryNodes,
      },
      terminalNodes: {
        left: leftInsights.terminalNodes,
        right: rightInsights.terminalNodes,
      },
    };
  }


  function estimateRun(pipelineId, profile = 'default') {
    const pipeline = repository.getById(pipelineId);
    if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);

    const validation = validatePipeline(pipeline);
    const runOptions = resolveRunOptions(profile, {});

    const nodeCount = pipeline.nodes.length;
    const avgDelay = Math.round(((runOptions.minDelayMs ?? 10) + (runOptions.maxDelayMs ?? 30)) / 2);
    const baseLatency = nodeCount * avgDelay;

    const avgTokensPerNode = 650;
    const estimatedTokens = nodeCount * avgTokensPerNode;
    const estimatedCost = Number((estimatedTokens * 0.00002).toFixed(5));

    const expectedRetries = pipeline.nodes.reduce((sum, node) => {
      const rate = DefaultFailureRates[node.type] ?? 0.15;
      return sum + rate * (runOptions.maxRetries ?? 0) * 0.5;
    }, 0);

    const expectedSuccessRate = Number(
      (
        (pipeline.nodes.reduce((acc, node) => {
          const rate = DefaultFailureRates[node.type] ?? 0.15;
          const retries = runOptions.maxRetries ?? 0;
          const successProb = 1 - rate ** (retries + 1);
          return acc + successProb;
        }, 0) /
          nodeCount) *
        100
      ).toFixed(2),
    );

    return {
      pipelineId,
      profile,
      nodeCount,
      validation,
      estimate: {
        expectedLatencyMs: baseLatency,
        expectedTokens: estimatedTokens,
        expectedCostUsd: estimatedCost,
        expectedRetries: Number(expectedRetries.toFixed(2)),
        expectedSuccessRate,
      },
      options: runOptions,
    };
  }

  function getProfileMatrix(pipelineId) {
    const profiles = listRunProfiles();
    const matrix = profiles.map(({ profileId, options }) => {
      const estimated = estimateRun(pipelineId, profileId);
      const estimate = estimated.estimate;
      return {
        profile: profileId,
        estimate,
        options,
      };
    });

    return {
      pipelineId,
      generatedAt: new Date().toISOString(),
      profiles: matrix,
    };
  }


  function recommendRunProfile(pipelineId, objective = 'balanced') {
    if (!RECOMMEND_OBJECTIVES.includes(objective)) {
      throw new Error(`Unsupported objective: ${objective}`);
    }

    const matrix = getProfileMatrix(pipelineId);
    const scored = matrix.profiles
      .map((entry) => ({
        ...entry,
        score: Number(scoreProfile(entry, objective).toFixed(4)),
      }))
      .sort((a, b) => a.score - b.score);

    return {
      pipelineId,
      objective,
      recommendedProfile: scored[0]?.profile ?? null,
      rankedProfiles: scored,
      rationale: buildProfileRationale(objective, scored),
      tradeoffSummary: buildTradeoffSummary(scored),
      generatedAt: new Date().toISOString(),
    };
  }

  function listRecommendObjectives() {
    return [...RECOMMEND_OBJECTIVES];
  }

  function getRecommendationMatrix(pipelineId) {
    const objectives = listRecommendObjectives();
    const recommendations = objectives.map((objective) => recommendRunProfile(pipelineId, objective));

    return {
      pipelineId,
      generatedAt: new Date().toISOString(),
      objectives: recommendations,
    };
  }

  function getRecommendationSnapshot(pipelineId) {
    const matrix = getRecommendationMatrix(pipelineId);
    const byObjective = Object.fromEntries(
      matrix.objectives.map((entry) => [entry.objective, entry.recommendedProfile]),
    );

    const uniqueRecommendedProfiles = Array.from(new Set(Object.values(byObjective)));

    return {
      pipelineId,
      generatedAt: matrix.generatedAt,
      byObjective,
      uniqueRecommendedProfiles,
      objectivesCount: matrix.objectives.length,
    };
  }

  function getRecommendationDecisionLog(pipelineId) {
    const snapshot = getRecommendationSnapshot(pipelineId);
    const entries = Object.entries(snapshot.byObjective);

    const votes = entries.reduce((acc, [objective, profile]) => {
      acc[profile] = acc[profile] || { profile, count: 0, objectives: [] };
      acc[profile].count += 1;
      acc[profile].objectives.push(objective);
      return acc;
    }, {});

    const sortedVotes = Object.values(votes).sort((a, b) => b.count - a.count || a.profile.localeCompare(b.profile));
    const topCount = sortedVotes[0]?.count ?? 0;
    const tiedProfiles = sortedVotes.filter((v) => v.count === topCount).map((v) => v.profile);

    const matchedObjective = OBJECTIVE_PRIORITY.find((objective) => tiedProfiles.includes(snapshot.byObjective[objective]));

    return {
      pipelineId,
      generatedAt: snapshot.generatedAt,
      objectivePriority: [...OBJECTIVE_PRIORITY],
      voteTable: sortedVotes,
      tiedProfiles,
      selectedByPriorityObjective: matchedObjective ?? null,
      selectedProfile: matchedObjective ? snapshot.byObjective[matchedObjective] : sortedVotes[0]?.profile ?? null,
    };
  }

  function getRecommendationAudit(pipelineId) {
    const snapshot = getRecommendationSnapshot(pipelineId);
    const consensus = getRecommendationConsensus(pipelineId);
    const decisionLog = getRecommendationDecisionLog(pipelineId);

    const consistentSelection = consensus.consensusProfile === decisionLog.selectedProfile;
    const voteSum = Object.values(consensus.votes).reduce((sum, n) => sum + n, 0);

    return {
      pipelineId,
      generatedAt: snapshot.generatedAt,
      snapshot,
      consensus,
      decisionLog,
      checks: {
        consistentSelection,
        objectiveCountMatchesVotes: snapshot.objectivesCount === voteSum,
      },
    };
  }

  function getRecommendationAuditSummary(pipelineId) {
    const audit = getRecommendationAudit(pipelineId);

    return {
      pipelineId,
      generatedAt: audit.generatedAt,
      consensusProfile: audit.consensus.consensusProfile,
      consensusRate: audit.consensus.consensusRate,
      hasTie: audit.consensus.hasTie,
      tiedProfiles: audit.consensus.tiedProfiles,
      checks: audit.checks,
      selectedByPriorityObjective: audit.decisionLog.selectedByPriorityObjective,
      recommendedProfileCount: audit.snapshot.uniqueRecommendedProfiles.length,
    };
  }

  function getRecommendationAuditStatus(pipelineId) {
    const summary = getRecommendationAuditSummary(pipelineId);

    const issues = [];
    if (!summary.checks.consistentSelection) issues.push('consensus-selection-mismatch');
    if (!summary.checks.objectiveCountMatchesVotes) issues.push('objective-vote-mismatch');
    if (summary.hasTie) issues.push('tie-detected');

    let status = 'ok';
    if (issues.includes('consensus-selection-mismatch') || issues.includes('objective-vote-mismatch')) {
      status = 'error';
    } else if (issues.length > 0) {
      status = 'warn';
    }

    return {
      pipelineId,
      generatedAt: summary.generatedAt,
      status,
      issues,
      summary,
    };
  }


  function getRecommendationAuditStatusOverview() {
    const pipelines = repository.list();
    const statuses = pipelines.map((pipelineId) => getRecommendationAuditStatus(pipelineId));

    const counts = statuses.reduce((acc, entry) => {
      acc[entry.status] += 1;
      return acc;
    }, { ok: 0, warn: 0, error: 0 });

    const overallStatus = counts.error > 0 ? 'error' : counts.warn > 0 ? 'warn' : 'ok';

    return {
      generatedAt: new Date().toISOString(),
      totalPipelines: pipelines.length,
      overallStatus,
      statusCounts: counts,
      pipelines: statuses,
    };
  }

  function getRecommendationAuditIssueSummary() {
    const overview = getRecommendationAuditStatusOverview();

    const issueCounts = {};
    const pipelinesByIssue = {};

    for (const entry of overview.pipelines) {
      for (const issue of entry.issues) {
        issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
        pipelinesByIssue[issue] = pipelinesByIssue[issue] || [];
        if (!pipelinesByIssue[issue].includes(entry.pipelineId)) {
          pipelinesByIssue[issue].push(entry.pipelineId);
        }
      }
    }

    const totalIssues = Object.values(issueCounts).reduce((sum, count) => sum + count, 0);

    return {
      generatedAt: overview.generatedAt,
      totalPipelines: overview.totalPipelines,
      overallStatus: overview.overallStatus,
      statusCounts: overview.statusCounts,
      totalIssues,
      issueCounts,
      pipelinesByIssue,
    };
  }

  function getRecommendationAuditHotspots() {
    const summary = getRecommendationAuditIssueSummary();
    const severityWeights = {
      'consensus-selection-mismatch': 3,
      'objective-vote-mismatch': 3,
      'tie-detected': 1,
    };

    const hotspots = Object.entries(summary.issueCounts)
      .map(([issue, count]) => {
        const pipelines = summary.pipelinesByIssue[issue] || [];
        const weight = severityWeights[issue] ?? 2;
        return {
          issue,
          count,
          severityWeight: weight,
          impactScore: count * weight,
          pipelines,
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore || b.count - a.count || a.issue.localeCompare(b.issue));

    return {
      generatedAt: summary.generatedAt,
      totalPipelines: summary.totalPipelines,
      totalIssues: summary.totalIssues,
      overallStatus: summary.overallStatus,
      hotspots,
    };
  }

  function getRecommendationAuditTopHotspots(limit = 3, minImpactScore = 0, includeIssues = null) {
    const normalizedLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 3;
    const normalizedMinImpactScore = Number.isFinite(Number(minImpactScore)) ? Math.max(0, Number(minImpactScore)) : 0;
    const requestedIncludeIssues = Array.isArray(includeIssues)
      ? includeIssues.map((issue) => String(issue).trim()).filter(Boolean)
      : typeof includeIssues === 'string'
        ? includeIssues.split(',').map((issue) => issue.trim()).filter(Boolean)
        : [];
    const requestedIncludeIssuesCount = requestedIncludeIssues.length;
    const normalizedIncludeIssues = requestedIncludeIssues.map((issue) => issue.toLowerCase());
    const uniqueIncludeIssues = Array.from(new Set(normalizedIncludeIssues));
    const uniqueIncludeIssuesCount = uniqueIncludeIssues.length;
    const duplicateIncludeIssuesCount = requestedIncludeIssuesCount - uniqueIncludeIssuesCount;

    const hotspots = getRecommendationAuditHotspots();
    const knownIssues = Array.from(new Set(hotspots.hotspots.map((entry) => entry.issue))).sort((a, b) => a.localeCompare(b));
    const knownIssueLookup = knownIssues.reduce((acc, issue) => {
      acc[issue.toLowerCase()] = issue;
      return acc;
    }, {});
    const appliedIncludeIssues = uniqueIncludeIssues
      .filter((issue) => knownIssueLookup[issue])
      .map((issue) => knownIssueLookup[issue]);
    const ignoredIncludeIssues = uniqueIncludeIssues.filter((issue) => !knownIssueLookup[issue]);
    const includeIssuesAppliedRatePercent = uniqueIncludeIssuesCount === 0
      ? null
      : Number(((appliedIncludeIssues.length / uniqueIncludeIssuesCount) * 100).toFixed(2));
    const includeIssuesIgnoredRatePercent = uniqueIncludeIssuesCount === 0
      ? null
      : Number(((ignoredIncludeIssues.length / uniqueIncludeIssuesCount) * 100).toFixed(2));
    const includeIssuesKnownCoveragePercent = knownIssues.length === 0
      ? null
      : Number(((appliedIncludeIssues.length / knownIssues.length) * 100).toFixed(2));

    const impactFilteredHotspots = hotspots.hotspots.filter((entry) => entry.impactScore >= normalizedMinImpactScore);
    const filteredHotspots = impactFilteredHotspots.filter((entry) => {
      const issuePass = normalizedIncludeIssues.length === 0 || appliedIncludeIssues.includes(entry.issue);
      return issuePass;
    });
    const selectedHotspots = filteredHotspots.slice(0, normalizedLimit);
    const totalHotspots = hotspots.hotspots.length;
    const impactFilteredCount = impactFilteredHotspots.length;
    const excludedByImpactFilterCount = totalHotspots - impactFilteredCount;
    const filteredHotspotCount = filteredHotspots.length;
    const excludedByIssueFilterCount = impactFilteredCount - filteredHotspotCount;
    const filteredOutCount = totalHotspots - filteredHotspotCount;
    const impactedPipelines = Array.from(
      new Set(selectedHotspots.flatMap((entry) => entry.pipelines)),
    ).sort((a, b) => a.localeCompare(b));
    const impactedPipelineCount = impactedPipelines.length;
    const impactedCoveragePercent = hotspots.totalPipelines === 0
      ? 0
      : Number(((impactedPipelineCount / hotspots.totalPipelines) * 100).toFixed(2));

    return {
      generatedAt: hotspots.generatedAt,
      totalPipelines: hotspots.totalPipelines,
      totalIssues: hotspots.totalIssues,
      overallStatus: hotspots.overallStatus,
      limit: normalizedLimit,
      minImpactScore: normalizedMinImpactScore,
      includeIssues: requestedIncludeIssues,
      normalizedIncludeIssues,
      requestedIncludeIssuesCount,
      uniqueIncludeIssuesCount,
      duplicateIncludeIssuesCount,
      includeIssuesAppliedRatePercent,
      includeIssuesIgnoredRatePercent,
      includeIssuesKnownCoveragePercent,
      appliedIncludeIssues,
      ignoredIncludeIssues,
      knownIssues,
      totalHotspots,
      impactFilteredCount,
      excludedByImpactFilterCount,
      filteredHotspotCount,
      excludedByIssueFilterCount,
      filteredOutCount,
      impactedPipelines,
      impactedPipelineCount,
      impactedCoveragePercent,
      hotspots: selectedHotspots,
    };
  }

  function getRecommendationConsensus(pipelineId) {
    const snapshot = getRecommendationSnapshot(pipelineId);
    const decisionLog = getRecommendationDecisionLog(pipelineId);
    const entries = Object.entries(snapshot.byObjective);

    const votes = decisionLog.voteTable.reduce((acc, row) => {
      acc[row.profile] = row.count;
      return acc;
    }, {});

    const topCount = decisionLog.voteTable[0]?.count ?? 0;

    return {
      pipelineId,
      generatedAt: snapshot.generatedAt,
      consensusProfile: decisionLog.selectedProfile,
      votes,
      consensusRate: entries.length === 0 ? 0 : Number(((topCount / entries.length) * 100).toFixed(2)),
      objectivesCount: entries.length,
      hasTie: decisionLog.tiedProfiles.length > 1,
      tiedProfiles: decisionLog.tiedProfiles,
      tieBreaker: decisionLog.tiedProfiles.length > 1 ? 'objective-priority' : null,
      tieBreakerReason:
        decisionLog.tiedProfiles.length > 1
          ? `Tie resolved by objective priority using ${decisionLog.selectedByPriorityObjective}.`
          : null,
    };
  }

  function listTemplates() {
    return [
      {
        templateId: 'mvp-x-threads',
        name: 'MVP X + Threads',
        description: '기본 멀티 포스트 파이프라인 (Input -> Manager -> Formatter -> Critic -> X/Threads -> Output)',
      },
    ];
  }

  function listRunProfiles() {
    return Object.entries(RUN_PROFILES).map(([profileId, options]) => ({
      profileId,
      options,
    }));
  }

  function createFromTemplate(templateId, pipelineMeta = {}) {
    if (templateId !== 'mvp-x-threads') {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const pipeline = clone(samplePipeline);
    const id = pipelineMeta.id || `${templateId}-${Date.now()}`;
    pipeline.pipelineMeta = {
      ...pipeline.pipelineMeta,
      id,
      name: pipelineMeta.name || `Template ${templateId}`,
      updatedAt: new Date().toISOString(),
    };

    return repository.save(pipeline);
  }

  return {
    bootstrapSample() {
      return repository.save(samplePipeline);
    },

    listTemplates,

    listRunProfiles,

    listRecommendObjectives,

    getRecommendationMatrix,

    getRecommendationSnapshot,

    getRecommendationConsensus,

    getRecommendationDecisionLog,

    getRecommendationAudit,

    getRecommendationAuditSummary,

    getRecommendationAuditStatus,

    getRecommendationAuditStatusOverview,

    getRecommendationAuditIssueSummary,

    getRecommendationAuditHotspots,

    getRecommendationAuditTopHotspots,

    createFromTemplate,

    estimateRun,

    getProfileMatrix,

    recommendRunProfile,

    getPipelineInsights,

    comparePipelines,

    listPipelines() {
      return repository.list();
    },

    getPipeline(pipelineId) {
      return repository.getById(pipelineId);
    },

    validatePipelineById(pipelineId) {
      const pipeline = repository.getById(pipelineId);
      if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);
      return validatePipeline(pipeline);
    },

    savePipeline(pipeline) {
      const validation = validatePipeline(pipeline);
      if (!validation.valid) {
        return { ok: false, validation, pipeline: null };
      }
      const saved = repository.save(pipeline);
      return { ok: true, validation, pipeline: saved };
    },

    runPipeline: run,

    deletePipeline(pipelineId) {
      return repository.remove(pipelineId);
    },
  };
}
