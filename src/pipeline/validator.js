import { topologicalSort } from './topology.js';

function isTruthyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validatePipeline(pipeline) {
  const errors = [];
  const warnings = [];

  if (!pipeline?.pipelineMeta?.id || !pipeline?.pipelineMeta?.name) {
    errors.push('pipelineMeta.id and pipelineMeta.name are required.');
  }

  const nodeIds = new Set();
  for (const node of pipeline.nodes ?? []) {
    if (!isTruthyString(node.id)) {
      errors.push('Each node must have a non-empty id.');
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);

    if (!isTruthyString(node.type)) {
      errors.push(`Node ${node.id} must have a type.`);
    }

    if (node.data?.enabled === false) {
      warnings.push(`Node ${node.id} is disabled.`);
    }
  }

  const edgeIds = new Set();
  for (const edge of pipeline.edges ?? []) {
    if (!isTruthyString(edge.id)) {
      errors.push('Each edge must have a non-empty id.');
      continue;
    }
    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge id: ${edge.id}`);
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} source does not exist: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} target does not exist: ${edge.target}`);
    }

    if (edge.data?.onFail && !nodeIds.has(edge.data.onFail)) {
      errors.push(`Edge ${edge.id} onFail target does not exist: ${edge.data.onFail}`);
    }
  }

  if ((pipeline.nodes ?? []).length === 0) {
    errors.push('Pipeline must contain at least one node.');
  }

  const { hasCycle } = topologicalSort(pipeline);
  if (hasCycle) {
    errors.push('Pipeline graph contains a cycle.');
  }

  const hasInput = (pipeline.nodes ?? []).some((n) => n.type === 'Input');
  const hasOutput = (pipeline.nodes ?? []).some((n) => n.type === 'Output');
  if (!hasInput) warnings.push('Pipeline has no Input node.');
  if (!hasOutput) warnings.push('Pipeline has no Output node.');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
