import { createPipelineRepository } from './services/pipelineRepository.js';
import { createRunRepository } from './services/runRepository.js';
import { createRunService } from './services/runService.js';
import { createPipelineService } from './services/pipelineService.js';

const repository = createPipelineRepository();
const runRepository = createRunRepository();
const runService = createRunService(runRepository);
const service = createPipelineService(repository, runService);

service.bootstrapSample();
const pipelineId = 'pipe_social_mvp';

const result = await service.runPipeline(pipelineId, { shouldDelay: false });

if (!result.ok) {
  console.error('Pipeline validation failed:', result.validation.errors);
  process.exit(1);
}

if (result.validation.warnings.length > 0) {
  console.warn('Pipeline warnings:', result.validation.warnings);
}

console.log('Execution order:', result.order.join(' -> '));
console.log('Summary:', result.summary);
console.log(`Report written: ${result.reportPath}`);
console.log(`Run ID: ${result.runRecord?.runId ?? 'n/a'}`);
