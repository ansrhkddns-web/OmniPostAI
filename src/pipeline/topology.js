export function buildAdjacency(pipeline) {
  const adjacency = new Map();
  const indegree = new Map();

  for (const node of pipeline.nodes) {
    adjacency.set(node.id, []);
    indegree.set(node.id, 0);
  }

  for (const edge of pipeline.edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) {
      throw new Error(`Invalid edge ${edge.id}: unknown source/target.`);
    }
    adjacency.get(edge.source).push(edge.target);
    indegree.set(edge.target, indegree.get(edge.target) + 1);
  }

  return { adjacency, indegree };
}

export function topologicalSort(pipeline) {
  const { adjacency, indegree } = buildAdjacency(pipeline);
  const queue = [];
  const order = [];

  for (const [nodeId, deg] of indegree.entries()) {
    if (deg === 0) queue.push(nodeId);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift();
    order.push(nodeId);
    for (const next of adjacency.get(nodeId)) {
      const nextDeg = indegree.get(next) - 1;
      indegree.set(next, nextDeg);
      if (nextDeg === 0) queue.push(next);
    }
  }

  if (order.length !== pipeline.nodes.length) {
    return { order, hasCycle: true };
  }

  return { order, hasCycle: false };
}
