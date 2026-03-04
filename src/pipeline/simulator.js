import { DefaultFailureRates, FailureReasons, NodeTypes, Statuses } from './schema.js';
import { topologicalSort } from './topology.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max, rand = Math.random) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function nowIso() {
  return new Date().toISOString();
}

function pickFailureReason(nodeType, rand = Math.random) {
  const byType = {
    [NodeTypes.PLATFORM]: [FailureReasons.RATE_LIMIT, FailureReasons.AUTH_EXPIRED, FailureReasons.UPLOAD_FAILED],
    [NodeTypes.MEDIA]: [FailureReasons.MEDIA_INVALID, FailureReasons.UPLOAD_FAILED],
    [NodeTypes.FORMATTER]: [FailureReasons.FORMAT_ERROR, FailureReasons.TOKEN_LIMIT],
    [NodeTypes.CRITIC]: [FailureReasons.COMPLIANCE_BLOCK, FailureReasons.TOKEN_LIMIT],
  };

  const candidates = byType[nodeType] ?? [FailureReasons.UNKNOWN];
  return candidates[Math.floor(rand() * candidates.length)];
}

function isRetryable(reason) {
  return [FailureReasons.RATE_LIMIT, FailureReasons.UPLOAD_FAILED, FailureReasons.UNKNOWN].includes(reason);
}

export async function runSimulation(pipeline, options = {}) {
  const {
    random = Math.random,
    minDelayMs = 10,
    maxDelayMs = 30,
    failureRates = DefaultFailureRates,
    shouldDelay = false,
    maxRetries = 2,
    retryBaseDelayMs = 30,
  } = options;

  const logs = [];
  const nodeStates = new Map();

  const { order, hasCycle } = topologicalSort(pipeline);
  if (hasCycle) {
    throw new Error('Pipeline has a cycle. Please remove cycle before simulation.');
  }

  for (const node of pipeline.nodes) {
    nodeStates.set(node.id, {
      status: Statuses.PENDING,
      metrics: { tokens: 0, cost: 0, latency: 0 },
      errorCode: null,
      retries: 0,
    });
  }

  const nodeById = new Map(pipeline.nodes.map((n) => [n.id, n]));
  const outEdges = new Map();
  for (const node of pipeline.nodes) outEdges.set(node.id, []);
  for (const edge of pipeline.edges) outEdges.get(edge.source).push(edge);

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    const state = nodeStates.get(nodeId);

    const prerequisites = pipeline.edges.filter((e) => e.target === nodeId).map((e) => e.source);
    if (prerequisites.length > 0) {
      const ready = prerequisites.some((sourceId) => nodeStates.get(sourceId).status === Statuses.SUCCESS);
      if (!ready) {
        state.status = Statuses.FAILED;
        state.errorCode = FailureReasons.DEPENDENCY_FAILED;
        logs.push({
          time: nowIso(),
          level: 'warn',
          nodeId,
          errorCode: FailureReasons.DEPENDENCY_FAILED,
          message: 'Skipped due to unmet prerequisites',
        });
        continue;
      }
    }

    let attempt = 0;
    let success = false;

    while (attempt <= maxRetries && !success) {
      state.status = Statuses.RUNNING;
      logs.push({ time: nowIso(), level: 'info', nodeId, message: `${node.type} started (attempt ${attempt + 1})` });

      const latency = randomBetween(minDelayMs, maxDelayMs, random);
      if (shouldDelay) await sleep(latency);

      const tokens = randomBetween(100, 1200, random);
      const cost = Number((tokens * 0.00002).toFixed(5));
      const failureRate = failureRates[node.type] ?? 0.15;
      const failed = random() < failureRate;

      state.metrics.tokens += tokens;
      state.metrics.cost = Number((state.metrics.cost + cost).toFixed(5));
      state.metrics.latency += latency;

      if (!failed) {
        state.status = Statuses.SUCCESS;
        state.errorCode = null;
        logs.push({ time: nowIso(), level: 'info', nodeId, message: `${node.type} succeeded (attempt ${attempt + 1})` });
        success = true;
        break;
      }

      const reason = pickFailureReason(node.type, random);
      state.errorCode = reason;
      logs.push({
        time: nowIso(),
        level: 'error',
        nodeId,
        errorCode: reason,
        message: `${node.type} failed (${reason}) at attempt ${attempt + 1}`,
      });

      if (attempt < maxRetries && isRetryable(reason)) {
        state.retries += 1;
        const backoff = retryBaseDelayMs * 2 ** attempt;
        logs.push({
          time: nowIso(),
          level: 'warn',
          nodeId,
          errorCode: reason,
          message: `Retry scheduled in ${backoff}ms`,
        });
        if (shouldDelay) await sleep(backoff);
      } else {
        break;
      }

      attempt += 1;
    }

    if (!success) {
      state.status = Statuses.FAILED;
      const fallbackEdge = outEdges.get(nodeId).find((e) => e.data?.onFail);
      if (fallbackEdge?.data?.onFail && nodeStates.has(fallbackEdge.data.onFail)) {
        const fallbackState = nodeStates.get(fallbackEdge.data.onFail);
        if (fallbackState.status === Statuses.PENDING) {
          logs.push({
            time: nowIso(),
            level: 'info',
            nodeId: fallbackEdge.data.onFail,
            message: 'Fallback node activated',
          });
        }
      }
    }
  }

  const nodeResults = Array.from(nodeStates.entries()).map(([nodeId, value]) => ({ nodeId, ...value }));
  const totalTokens = nodeResults.reduce((sum, n) => sum + n.metrics.tokens, 0);
  const estimatedCost = Number(nodeResults.reduce((sum, n) => sum + n.metrics.cost, 0).toFixed(5));
  const avgLatency = Math.round(nodeResults.reduce((sum, n) => sum + n.metrics.latency, 0) / nodeResults.length);
  const successCount = nodeResults.filter((n) => n.status === Statuses.SUCCESS).length;
  const successRate = Number(((successCount / nodeResults.length) * 100).toFixed(2));

  const failureReasons = {};
  let totalRetries = 0;
  for (const result of nodeResults) {
    totalRetries += result.retries || 0;
    if (result.errorCode) {
      failureReasons[result.errorCode] = (failureReasons[result.errorCode] ?? 0) + 1;
    }
  }

  return {
    order,
    nodeResults,
    logs,
    summary: {
      totalTokens,
      estimatedCost,
      avgLatency,
      successRate,
      failureReasons,
      totalRetries,
    },
  };
}
