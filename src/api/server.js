import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { validatePipeline } from '../pipeline/validator.js';

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { error: 'Not found' });
}


const uiDir = path.resolve(process.cwd(), 'src/ui');

function sendFile(res, filePath, contentType = 'text/plain; charset=utf-8') {
  if (!filePath.startsWith(uiDir)) {
    return notFound(res);
  }
  if (!fs.existsSync(filePath)) {
    return notFound(res);
  }
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(fs.readFileSync(filePath));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}

export function createApiServer(service, runService = null, taskProgressService = null) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;



      if (req.method === 'GET' && (pathname === '/ui' || pathname === '/ui/')) {
        return sendFile(res, path.join(uiDir, 'index.html'), 'text/html; charset=utf-8');
      }

      if (req.method === 'GET' && pathname.startsWith('/ui/')) {
        const relPath = pathname.slice('/ui/'.length);
        const filePath = path.resolve(uiDir, relPath);
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.js': 'text/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.html': 'text/html; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
        };
        return sendFile(res, filePath, contentTypes[ext] || 'application/octet-stream');
      }

      if (req.method === 'GET' && pathname === '/health') {
        return json(res, 200, { ok: true });
      }

      if (taskProgressService && req.method === 'GET' && pathname === '/progress') {
        return json(res, 200, { progress: taskProgressService.getProgress() });
      }


      if (taskProgressService && req.method === 'GET' && pathname === '/next-tasks') {
        const limit = Number(url.searchParams.get('limit') || 5);
        return json(res, 200, { nextTasks: taskProgressService.getNextTasks(limit) });
      }

      if (runService && taskProgressService && req.method === 'GET' && pathname === '/dashboard') {
        const limit = Number(url.searchParams.get('limit') || 5);
        return json(res, 200, {
          dashboard: {
            progress: taskProgressService.getProgress(),
            runStats: runService.getStats(),
            recentRuns: runService.getRecentRuns(limit),
            nextTasks: taskProgressService.getNextTasks(limit),
          },
        });
      }

      if (req.method === 'GET' && pathname === '/templates') {
        return json(res, 200, { templates: service.listTemplates() });
      }

      if (req.method === 'GET' && pathname === '/run-profiles') {
        return json(res, 200, { runProfiles: service.listRunProfiles() });
      }

      if (req.method === 'GET' && pathname === '/recommend-objectives') {
        return json(res, 200, { objectives: service.listRecommendObjectives() });
      }

      if (req.method === 'POST' && pathname === '/templates/create') {
        const body = (await readJsonBody(req)) || {};
        const saved = service.createFromTemplate(body.templateId, body.pipelineMeta || {});
        return json(res, 201, { ok: true, pipelineId: saved.pipelineMeta.id });
      }

      if (req.method === 'POST' && pathname === '/pipelines/validate') {
        const body = await readJsonBody(req);
        const result = validatePipeline(body || {});
        return json(res, result.valid ? 200 : 400, { ok: result.valid, errors: result.errors, warnings: result.warnings });
      }

      if (req.method === 'POST' && pathname === '/pipelines/bootstrap') {
        const saved = service.bootstrapSample();
        return json(res, 201, { pipelineId: saved.pipelineMeta.id });
      }

      if (req.method === 'GET' && pathname === '/pipelines') {
        return json(res, 200, { pipelines: service.listPipelines() });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-matrix') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationMatrix = service.getRecommendationMatrix(pipelineId);
        return json(res, 200, { recommendationMatrix });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-snapshot') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationSnapshot = service.getRecommendationSnapshot(pipelineId);
        return json(res, 200, { recommendationSnapshot });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-consensus') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationConsensus = service.getRecommendationConsensus(pipelineId);
        return json(res, 200, { recommendationConsensus });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-decision-log') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationDecisionLog = service.getRecommendationDecisionLog(pipelineId);
        return json(res, 200, { recommendationDecisionLog });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationAudit = service.getRecommendationAudit(pipelineId);
        return json(res, 200, { recommendationAudit });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit-summary') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationAuditSummary = service.getRecommendationAuditSummary(pipelineId);
        return json(res, 200, { recommendationAuditSummary });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit-status') {
        const pipelineId = url.searchParams.get('pipelineId');
        if (!pipelineId) return json(res, 400, { error: 'pipelineId is required' });
        const recommendationAuditStatus = service.getRecommendationAuditStatus(pipelineId);
        return json(res, 200, { recommendationAuditStatus });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit-status-overview') {
        const recommendationAuditStatusOverview = service.getRecommendationAuditStatusOverview();
        return json(res, 200, { recommendationAuditStatusOverview });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit-issues') {
        const recommendationAuditIssues = service.getRecommendationAuditIssueSummary();
        return json(res, 200, { recommendationAuditIssues });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit-hotspots') {
        const recommendationAuditHotspots = service.getRecommendationAuditHotspots();
        return json(res, 200, { recommendationAuditHotspots });
      }

      if (req.method === 'GET' && pathname === '/pipelines/recommendation-audit-top-hotspots') {
        const limit = Number(url.searchParams.get('limit') || 3);
        const minImpactScore = Number(url.searchParams.get('minImpactScore') || 0);
        const includeIssues = url.searchParams.get('includeIssues') || '';
        const recommendationAuditTopHotspots = service.getRecommendationAuditTopHotspots(limit, minImpactScore, includeIssues);
        return json(res, 200, { recommendationAuditTopHotspots });
      }

      if (req.method === 'GET' && pathname === '/pipelines/compare') {
        const leftId = url.searchParams.get('leftId');
        const rightId = url.searchParams.get('rightId');
        if (!leftId || !rightId) {
          return json(res, 400, { error: 'leftId and rightId are required' });
        }
        const comparison = service.comparePipelines(leftId, rightId);
        return json(res, 200, { comparison });
      }

      if (req.method === 'POST' && pathname === '/pipelines') {
        const body = await readJsonBody(req);
        const result = service.savePipeline(body);
        if (!result.ok) {
          return json(res, 400, { ok: false, errors: result.validation.errors, warnings: result.validation.warnings });
        }
        return json(res, 201, { ok: true, pipelineId: result.pipeline.pipelineMeta.id });
      }

      if (runService && req.method === 'GET' && pathname === '/runs') {
        return json(res, 200, { runs: runService.listRuns() });
      }

      if (runService && req.method === 'GET' && pathname === '/runs/records') {
        return json(res, 200, { records: runService.listRunRecords() });
      }

      if (runService && req.method === 'GET' && pathname === '/runs/stats') {
        return json(res, 200, { stats: runService.getStats() });
      }

      if (runService && pathname.startsWith('/runs/')) {
        const runId = pathname.split('/').filter(Boolean)[1];
        if (req.method === 'GET') {
          const run = runService.getRun(runId);
          if (!run) return json(res, 404, { error: `Run not found: ${runId}` });
          return json(res, 200, { run });
        }
      }

      if (pathname.startsWith('/pipelines/')) {
        const parts = pathname.split('/').filter(Boolean);
        const pipelineId = parts[1];

        if (req.method === 'GET' && parts.length === 2) {
          const pipeline = service.getPipeline(pipelineId);
          if (!pipeline) return json(res, 404, { error: `Pipeline not found: ${pipelineId}` });
          return json(res, 200, { pipeline });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'validate') {
          const validation = service.validatePipelineById(pipelineId);
          return json(res, validation.valid ? 200 : 400, { ok: validation.valid, errors: validation.errors, warnings: validation.warnings });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'insights') {
          const insights = service.getPipelineInsights(pipelineId);
          return json(res, 200, { insights });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'estimate') {
          const profile = url.searchParams.get('profile') || 'default';
          const estimate = service.estimateRun(pipelineId, profile);
          return json(res, 200, { estimate });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'profile-matrix') {
          const matrix = service.getProfileMatrix(pipelineId);
          return json(res, 200, { matrix });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-matrix') {
          const recommendationMatrix = service.getRecommendationMatrix(pipelineId);
          return json(res, 200, { recommendationMatrix });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-snapshot') {
          const recommendationSnapshot = service.getRecommendationSnapshot(pipelineId);
          return json(res, 200, { recommendationSnapshot });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-consensus') {
          const recommendationConsensus = service.getRecommendationConsensus(pipelineId);
          return json(res, 200, { recommendationConsensus });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-decision-log') {
          const recommendationDecisionLog = service.getRecommendationDecisionLog(pipelineId);
          return json(res, 200, { recommendationDecisionLog });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-audit') {
          const recommendationAudit = service.getRecommendationAudit(pipelineId);
          return json(res, 200, { recommendationAudit });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-audit-summary') {
          const recommendationAuditSummary = service.getRecommendationAuditSummary(pipelineId);
          return json(res, 200, { recommendationAuditSummary });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommendation-audit-status') {
          const recommendationAuditStatus = service.getRecommendationAuditStatus(pipelineId);
          return json(res, 200, { recommendationAuditStatus });
        }

        if (req.method === 'GET' && parts.length === 3 && parts[2] === 'recommend-profile') {
          const objective = url.searchParams.get('objective') || 'balanced';
          try {
            const recommendation = service.recommendRunProfile(pipelineId, objective);
            return json(res, 200, { recommendation });
          } catch (error) {
            if (error.message.startsWith('Unsupported objective:')) {
              return json(res, 400, { error: error.message, supportedObjectives: service.listRecommendObjectives() });
            }
            throw error;
          }
        }

        if (req.method === 'DELETE' && parts.length === 2) {
          const removed = service.deletePipeline(pipelineId);
          if (!removed) return json(res, 404, { error: `Pipeline not found: ${pipelineId}` });
          return json(res, 200, { ok: true, deleted: pipelineId });
        }

        if (req.method === 'POST' && parts.length === 3 && parts[2] === 'run') {
          const profile = url.searchParams.get('profile') || 'default';
          const result = await service.runPipeline(pipelineId, { shouldDelay: false }, profile);
          if (!result.ok) {
            return json(res, 400, { ok: false, errors: result.validation.errors, warnings: result.validation.warnings });
          }

          return json(res, 200, {
            ok: true,
            order: result.order,
            summary: result.summary,
            reportPath: result.reportPath,
            warnings: result.validation.warnings,
            runId: result.runRecord?.runId ?? null,
            profile: result.profile,
          });
        }
      }

      return notFound(res);
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  });

  return server;
}
