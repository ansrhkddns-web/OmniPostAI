import { createPipelineRepository } from '../services/pipelineRepository.js';
import { createRunRepository } from '../services/runRepository.js';
import { createRunService } from '../services/runService.js';
import { createTaskProgressService } from '../services/taskProgressService.js';
import { createPipelineService } from '../services/pipelineService.js';
import { createApiServer } from './server.js';

const pipelineRepository = createPipelineRepository();
const runRepository = createRunRepository();
const runService = createRunService(runRepository);
const taskProgressService = createTaskProgressService();
const pipelineService = createPipelineService(pipelineRepository, runService);

const server = createApiServer(pipelineService, runService, taskProgressService);
const port = Number(process.env.PORT || 8787);

server.listen(port, () => {
  console.log(`OmniPostAI API running on http://localhost:${port}`);
});
