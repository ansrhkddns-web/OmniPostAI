export function buildSimulationMarkdownReport(pipeline, simulationResult) {
  const { pipelineMeta } = pipeline;
  const { summary, nodeResults, logs } = simulationResult;

  const lines = [];
  lines.push(`# Pipeline Simulation Report: ${pipelineMeta.name}`);
  lines.push('');
  lines.push(`- Pipeline ID: ${pipelineMeta.id}`);
  lines.push(`- Updated At: ${pipelineMeta.updatedAt}`);
  lines.push(`- Total Tokens: ${summary.totalTokens}`);
  lines.push(`- Estimated Cost: $${summary.estimatedCost}`);
  lines.push(`- Avg Latency: ${summary.avgLatency}ms`);
  lines.push(`- Success Rate: ${summary.successRate}%`);
  lines.push(`- Total Retries: ${summary.totalRetries ?? 0}`);
  lines.push('');

  lines.push('## Node Results');
  lines.push('| Node ID | Status | Error Code | Retries | Tokens | Cost | Latency(ms) |');
  lines.push('|---|---:|---|---:|---:|---:|---:|');
  for (const item of nodeResults) {
    lines.push(
      `| ${item.nodeId} | ${item.status} | ${item.errorCode ?? '-'} | ${item.retries ?? 0} | ${item.metrics.tokens} | ${item.metrics.cost} | ${item.metrics.latency} |`,
    );
  }

  lines.push('');
  lines.push('## Failure Reasons');
  const reasons = Object.entries(summary.failureReasons || {});
  if (reasons.length === 0) {
    lines.push('- none');
  } else {
    for (const [reason, count] of reasons) {
      lines.push(`- ${reason}: ${count}`);
    }
  }

  lines.push('');
  lines.push('## Recent Logs');
  for (const log of logs.slice(-10)) {
    lines.push(`- [${log.level}] (${log.nodeId}) ${log.message}`);
  }

  return lines.join('\n');
}
