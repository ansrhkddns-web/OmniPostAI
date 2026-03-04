export const NodeTypes = {
  INPUT: 'Input',
  MANAGER: 'ManagerAgent',
  FORMATTER: 'FormatterAgent',
  MEDIA: 'MediaAgent',
  COMPLIANCE: 'ComplianceAgent',
  PLATFORM: 'PlatformAgent',
  CRITIC: 'CriticAgent',
  OUTPUT: 'Output',
};

export const Statuses = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

export const FailureReasons = {
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  RATE_LIMIT: 'RATE_LIMIT',
  TOKEN_LIMIT: 'TOKEN_LIMIT',
  FORMAT_ERROR: 'FORMAT_ERROR',
  MEDIA_INVALID: 'MEDIA_INVALID',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  COMPLIANCE_BLOCK: 'COMPLIANCE_BLOCK',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
  UNKNOWN: 'UNKNOWN',
};

export const DefaultFailureRates = {
  [NodeTypes.INPUT]: 0.01,
  [NodeTypes.MANAGER]: 0.08,
  [NodeTypes.FORMATTER]: 0.12,
  [NodeTypes.MEDIA]: 0.18,
  [NodeTypes.COMPLIANCE]: 0.08,
  [NodeTypes.PLATFORM]: 0.25,
  [NodeTypes.CRITIC]: 0.1,
  [NodeTypes.OUTPUT]: 0.03,
};

/**
 * @typedef {{
 *   id: string,
 *   type: string,
 *   position: {x:number,y:number},
 *   data: {
 *     name: string,
 *     model?: string,
 *     enabled?: boolean,
 *     params?: {maxTokens?: number, temperature?: number},
 *     status?: string,
 *     metrics?: {tokens?: number, cost?: number, latency?: number}
 *   }
 * }} PipelineNode
 */

/**
 * @typedef {{
 *   id: string,
 *   source: string,
 *   target: string,
 *   data?: {condition?: string, onFail?: string, payloadType?: string}
 * }} PipelineEdge
 */

/**
 * @typedef {{
 *   pipelineMeta: {id:string,name:string,updatedAt:string},
 *   nodes: PipelineNode[],
 *   edges: PipelineEdge[]
 * }} Pipeline
 */
