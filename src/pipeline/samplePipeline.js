import { NodeTypes, Statuses } from './schema.js';

export const samplePipeline = {
  pipelineMeta: {
    id: 'pipe_social_mvp',
    name: 'OmniPost MVP Pipeline',
    updatedAt: new Date().toISOString(),
  },
  nodes: [
    {
      id: 'input_1',
      type: NodeTypes.INPUT,
      position: { x: 0, y: 0 },
      data: { name: 'User Input', status: Statuses.PENDING, enabled: true },
    },
    {
      id: 'manager_1',
      type: NodeTypes.MANAGER,
      position: { x: 250, y: 0 },
      data: { name: 'Manager', model: 'gpt-4.1', status: Statuses.PENDING, enabled: true },
    },
    {
      id: 'formatter_1',
      type: NodeTypes.FORMATTER,
      position: { x: 500, y: -120 },
      data: { name: 'Formatter', model: 'gpt-4.1-mini', status: Statuses.PENDING, enabled: true },
    },
    {
      id: 'critic_1',
      type: NodeTypes.CRITIC,
      position: { x: 760, y: -120 },
      data: { name: 'Critic', model: 'claude-3.5-haiku', status: Statuses.PENDING, enabled: true },
    },
    {
      id: 'platform_x',
      type: NodeTypes.PLATFORM,
      position: { x: 1020, y: -220 },
      data: { name: 'X Publisher', status: Statuses.PENDING, enabled: true },
    },
    {
      id: 'platform_threads',
      type: NodeTypes.PLATFORM,
      position: { x: 1020, y: -20 },
      data: { name: 'Threads Publisher', status: Statuses.PENDING, enabled: true },
    },
    {
      id: 'output_1',
      type: NodeTypes.OUTPUT,
      position: { x: 1280, y: -120 },
      data: { name: 'Result Aggregator', status: Statuses.PENDING, enabled: true },
    },
  ],
  edges: [
    { id: 'e1', source: 'input_1', target: 'manager_1', data: { payloadType: 'text' } },
    { id: 'e2', source: 'manager_1', target: 'formatter_1', data: { payloadType: 'text' } },
    { id: 'e3', source: 'formatter_1', target: 'critic_1', data: { condition: 'quality-check' } },
    { id: 'e4', source: 'critic_1', target: 'platform_x', data: { condition: 'channel=x', onFail: 'formatter_1' } },
    { id: 'e5', source: 'critic_1', target: 'platform_threads', data: { condition: 'channel=threads' } },
    { id: 'e6', source: 'platform_x', target: 'output_1' },
    { id: 'e7', source: 'platform_threads', target: 'output_1' },
  ],
};
