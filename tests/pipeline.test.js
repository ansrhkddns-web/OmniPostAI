import test from 'node:test';
import assert from 'node:assert/strict';

import { samplePipeline } from '../src/pipeline/samplePipeline.js';
import { topologicalSort } from '../src/pipeline/topology.js';
import { runSimulation } from '../src/pipeline/simulator.js';
import { Statuses } from '../src/pipeline/schema.js';
import { validatePipeline } from '../src/pipeline/validator.js';
import { buildSimulationMarkdownReport } from '../src/pipeline/report.js';

test('topologicalSort returns no cycle for sample pipeline', () => {
  const result = topologicalSort(samplePipeline);
  assert.equal(result.hasCycle, false);
  assert.equal(result.order.length, samplePipeline.nodes.length);
});

test('runSimulation returns metrics and logs', async () => {
  const deterministicRandomValues = [0.9, 0.1, 0.95, 0.2, 0.8, 0.3, 0.7, 0.4, 0.9, 0.5];
  let idx = 0;
  const random = () => {
    const value = deterministicRandomValues[idx % deterministicRandomValues.length];
    idx += 1;
    return value;
  };

  const result = await runSimulation(samplePipeline, { random, shouldDelay: false, minDelayMs: 1, maxDelayMs: 2 });

  assert.equal(result.order.length, samplePipeline.nodes.length);
  assert.ok(result.logs.length > 0);
  assert.ok(result.summary.totalTokens > 0);
  assert.ok(result.summary.estimatedCost > 0);
  assert.ok(result.summary.avgLatency >= 1);
  assert.ok(result.summary.successRate >= 0 && result.summary.successRate <= 100);
  assert.ok(typeof result.summary.failureReasons === 'object');
  assert.ok(typeof result.summary.totalRetries === 'number');

  const statuses = result.nodeResults.map((r) => r.status);
  assert.ok(statuses.some((s) => s === Statuses.SUCCESS || s === Statuses.FAILED));
});

test('topologicalSort detects cycle', () => {
  const cyclic = {
    ...samplePipeline,
    edges: [...samplePipeline.edges, { id: 'cycle_1', source: 'output_1', target: 'manager_1' }],
  };

  const result = topologicalSort(cyclic);
  assert.equal(result.hasCycle, true);
});

test('validatePipeline returns valid for sample pipeline', () => {
  const result = validatePipeline(samplePipeline);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validatePipeline catches onFail target errors', () => {
  const broken = {
    ...samplePipeline,
    edges: [
      ...samplePipeline.edges,
      {
        id: 'broken_onfail',
        source: 'critic_1',
        target: 'platform_threads',
        data: { onFail: 'unknown_node' },
      },
    ],
  };

  const result = validatePipeline(broken);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('onFail target does not exist')));
});

test('buildSimulationMarkdownReport includes summary and node table', async () => {
  const result = await runSimulation(samplePipeline, {
    random: () => 0.99,
    shouldDelay: false,
    minDelayMs: 1,
    maxDelayMs: 1,
  });

  const markdown = buildSimulationMarkdownReport(samplePipeline, result);
  assert.ok(markdown.includes('# Pipeline Simulation Report: OmniPost MVP Pipeline'));
  assert.ok(markdown.includes('## Node Results'));
  assert.ok(markdown.includes('| Node ID | Status | Error Code | Retries | Tokens | Cost | Latency(ms) |'));
  assert.ok(markdown.includes('Total Retries'));
  assert.ok(markdown.includes('## Failure Reasons'));
});
