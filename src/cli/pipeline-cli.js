#!/usr/bin/env node
import { createPipelineRepository } from '../services/pipelineRepository.js';
import { createRunRepository } from '../services/runRepository.js';
import { createRunService } from '../services/runService.js';
import { createTaskProgressService } from '../services/taskProgressService.js';
import { createPipelineService } from '../services/pipelineService.js';

function printHelp() {
  console.log(`OmniPostAI Pipeline CLI

Commands:
  bootstrap                               Save sample pipeline into local repository
  list                                    List saved pipeline ids
  show <pipelineId>                       Print pipeline JSON
  validate <pipelineId>                   Validate saved pipeline
  insights <pipelineId>                   Show pipeline graph insights
  estimate <pipelineId> [profile]         Show run estimate before execution
  profile-matrix <pipelineId>             Compare all run profile estimates
  recommend-profile <pipelineId> [objective]  Recommend best profile with rationale (balanced/speed/reliability/cost)
  compare <leftId> <rightId>              Compare two pipelines
  run <pipelineId> [profile]              Validate and run simulation, write report
  run-profiles                            List available run profiles
  recommend-objectives                    List supported recommendation objectives
  recommendation-matrix <pipelineId>      Show recommendations for all objectives
  recommendation-snapshot <pipelineId>    Show compact recommendation summary
  recommendation-consensus <pipelineId>   Show consensus profile (+ tie-breaker details) across objectives
  recommendation-decision-log <pipelineId> Show consensus decision trace (votes/priority)
  recommendation-audit <pipelineId>        Show bundled recommendation audit payload
  recommendation-audit-summary <pipelineId> Show compact audit summary payload
  recommendation-audit-status <pipelineId> Show audit status (ok/warn/error) with issues
  recommendation-audit-status-overview    Show status overview across all pipelines
  recommendation-audit-issues            Show aggregated issue counts across pipelines
  recommendation-audit-hotspots          Show prioritized audit issue hotspots
  recommendation-audit-top-hotspots [limit] [minImpactScore] [includeIssuesCsv] Show top-N hotspots with impact/issue filters
  delete <pipelineId>                     Delete pipeline
  template-list                           List available templates
  template-create <templateId> <id> [name]  Create pipeline from template
  runs                                    List run ids
  run-show <runId>                        Show run record JSON
  run-stats                               Show aggregate run stats
  progress                                Show overall development progress from TASKS.md
  next-tasks [limit]                      Show recommended next tasks from TASKS.md
  dashboard [limit]                       Show progress + run stats + recent runs + next tasks
`);
}

async function main() {
  const [, , command, ...args] = process.argv;
  const repository = createPipelineRepository();
  const runRepository = createRunRepository();
  const runService = createRunService(runRepository);
  const taskProgressService = createTaskProgressService();
  const service = createPipelineService(repository, runService);

  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  switch (command) {
    case 'bootstrap': {
      const saved = service.bootstrapSample();
      console.log(`Bootstrapped: ${saved.pipelineMeta.id}`);
      return;
    }
    case 'list': {
      const ids = service.listPipelines();
      if (ids.length === 0) return console.log('No pipelines saved.');
      for (const id of ids) console.log(id);
      return;
    }
    case 'show': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('show requires <pipelineId>');
      const pipeline = service.getPipeline(pipelineId);
      if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);
      console.log(JSON.stringify(pipeline, null, 2));
      return;
    }
    case 'validate': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('validate requires <pipelineId>');
      const result = service.validatePipelineById(pipelineId);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.valid ? 0 : 1;
      return;
    }
    case 'insights': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('insights requires <pipelineId>');
      const insights = service.getPipelineInsights(pipelineId);
      console.log(JSON.stringify(insights, null, 2));
      return;
    }
    case 'estimate': {
      const [pipelineId, profile] = args;
      if (!pipelineId) throw new Error('estimate requires <pipelineId> [profile]');
      const estimate = service.estimateRun(pipelineId, profile || 'default');
      console.log(JSON.stringify(estimate, null, 2));
      return;
    }
    case 'profile-matrix': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('profile-matrix requires <pipelineId>');
      const matrix = service.getProfileMatrix(pipelineId);
      console.log(JSON.stringify(matrix, null, 2));
      return;
    }
    case 'recommend-profile': {
      const [pipelineId, objective] = args;
      if (!pipelineId) throw new Error('recommend-profile requires <pipelineId> [objective]');
      const recommendation = service.recommendRunProfile(pipelineId, objective || 'balanced');
      console.log(JSON.stringify(recommendation, null, 2));
      return;
    }
    case 'compare': {
      const [leftId, rightId] = args;
      if (!leftId || !rightId) throw new Error('compare requires <leftId> <rightId>');
      const comparison = service.comparePipelines(leftId, rightId);
      console.log(JSON.stringify(comparison, null, 2));
      return;
    }
    case 'run': {
      const [pipelineId, profile] = args;
      if (!pipelineId) throw new Error('run requires <pipelineId> [profile]');
      const result = await service.runPipeline(pipelineId, { shouldDelay: false }, profile || 'default');
      if (!result.ok) {
        console.error('Validation failed:', result.validation.errors);
        process.exitCode = 1;
        return;
      }
      if (result.validation.warnings.length > 0) {
        console.warn('Warnings:', result.validation.warnings);
      }
      console.log('Order:', result.order.join(' -> '));
      console.log('Summary:', result.summary);
      console.log('Report:', result.reportPath);
      if (result.runRecord?.runId) console.log('Run ID:', result.runRecord.runId);
      console.log('Profile:', result.profile);
      return;
    }
    case 'delete': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('delete requires <pipelineId>');
      const removed = service.deletePipeline(pipelineId);
      console.log(removed ? `Deleted: ${pipelineId}` : `Not found: ${pipelineId}`);
      return;
    }
    case 'template-list': {
      console.log(JSON.stringify(service.listTemplates(), null, 2));
      return;
    }
    case 'run-profiles': {
      console.log(JSON.stringify(service.listRunProfiles(), null, 2));
      return;
    }
    case 'recommend-objectives': {
      console.log(JSON.stringify(service.listRecommendObjectives(), null, 2));
      return;
    }
    case 'recommendation-matrix': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-matrix requires <pipelineId>');
      const recommendationMatrix = service.getRecommendationMatrix(pipelineId);
      console.log(JSON.stringify(recommendationMatrix, null, 2));
      return;
    }
    case 'recommendation-snapshot': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-snapshot requires <pipelineId>');
      const recommendationSnapshot = service.getRecommendationSnapshot(pipelineId);
      console.log(JSON.stringify(recommendationSnapshot, null, 2));
      return;
    }
    case 'recommendation-consensus': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-consensus requires <pipelineId>');
      const recommendationConsensus = service.getRecommendationConsensus(pipelineId);
      console.log(JSON.stringify(recommendationConsensus, null, 2));
      return;
    }
    case 'recommendation-decision-log': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-decision-log requires <pipelineId>');
      const recommendationDecisionLog = service.getRecommendationDecisionLog(pipelineId);
      console.log(JSON.stringify(recommendationDecisionLog, null, 2));
      return;
    }
    case 'recommendation-audit': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-audit requires <pipelineId>');
      const recommendationAudit = service.getRecommendationAudit(pipelineId);
      console.log(JSON.stringify(recommendationAudit, null, 2));
      return;
    }
    case 'recommendation-audit-summary': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-audit-summary requires <pipelineId>');
      const recommendationAuditSummary = service.getRecommendationAuditSummary(pipelineId);
      console.log(JSON.stringify(recommendationAuditSummary, null, 2));
      return;
    }
    case 'recommendation-audit-status': {
      const [pipelineId] = args;
      if (!pipelineId) throw new Error('recommendation-audit-status requires <pipelineId>');
      const recommendationAuditStatus = service.getRecommendationAuditStatus(pipelineId);
      console.log(JSON.stringify(recommendationAuditStatus, null, 2));
      return;
    }
    case 'recommendation-audit-status-overview': {
      const recommendationAuditStatusOverview = service.getRecommendationAuditStatusOverview();
      console.log(JSON.stringify(recommendationAuditStatusOverview, null, 2));
      return;
    }
    case 'recommendation-audit-issues': {
      const recommendationAuditIssues = service.getRecommendationAuditIssueSummary();
      console.log(JSON.stringify(recommendationAuditIssues, null, 2));
      return;
    }
    case 'recommendation-audit-hotspots': {
      const recommendationAuditHotspots = service.getRecommendationAuditHotspots();
      console.log(JSON.stringify(recommendationAuditHotspots, null, 2));
      return;
    }
    case 'recommendation-audit-top-hotspots': {
      const [limitArg, minImpactScoreArg, includeIssuesArg] = args;
      const limit = limitArg ? Number(limitArg) : 3;
      const minImpactScore = minImpactScoreArg ? Number(minImpactScoreArg) : 0;
      const recommendationAuditTopHotspots = service.getRecommendationAuditTopHotspots(limit, minImpactScore, includeIssuesArg || '');
      console.log(JSON.stringify(recommendationAuditTopHotspots, null, 2));
      return;
    }
    case 'template-create': {
      const [templateId, id, ...nameParts] = args;
      if (!templateId || !id) throw new Error('template-create requires <templateId> <id> [name]');
      const created = service.createFromTemplate(templateId, { id, name: nameParts.join(' ') || id });
      console.log(`Created from template: ${created.pipelineMeta.id}`);
      return;
    }
    case 'runs': {
      const ids = runService.listRuns();
      if (ids.length === 0) return console.log('No runs found.');
      for (const id of ids) console.log(id);
      return;
    }
    case 'run-show': {
      const [runId] = args;
      if (!runId) throw new Error('run-show requires <runId>');
      const run = runService.getRun(runId);
      if (!run) throw new Error(`Run not found: ${runId}`);
      console.log(JSON.stringify(run, null, 2));
      return;
    }
    case 'run-stats': {
      console.log(JSON.stringify(runService.getStats(), null, 2));
      return;
    }
    case 'progress': {
      console.log(JSON.stringify(taskProgressService.getProgress(), null, 2));
      return;
    }
    case 'next-tasks': {
      const [limitArg] = args;
      const limit = limitArg ? Number(limitArg) : 5;
      console.log(JSON.stringify(taskProgressService.getNextTasks(limit), null, 2));
      return;
    }
    case 'dashboard': {
      const [limitArg] = args;
      const limit = limitArg ? Number(limitArg) : 5;
      const payload = {
        progress: taskProgressService.getProgress(),
        runStats: runService.getStats(),
        recentRuns: runService.getRecentRuns(limit),
        nextTasks: taskProgressService.getNextTasks(limit),
      };
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
