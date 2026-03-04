import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE_DIR = path.join(process.cwd(), 'data', 'pipelines');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function pipelinePath(baseDir, pipelineId) {
  return path.join(baseDir, `${pipelineId}.json`);
}

export function createPipelineRepository(baseDir = DEFAULT_BASE_DIR) {
  ensureDir(baseDir);

  return {
    baseDir,

    list() {
      ensureDir(baseDir);
      return fs
        .readdirSync(baseDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
        .sort();
    },

    getById(pipelineId) {
      const filePath = pipelinePath(baseDir, pipelineId);
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    },

    save(pipeline) {
      const pipelineId = pipeline?.pipelineMeta?.id;
      if (!pipelineId) {
        throw new Error('Cannot save pipeline without pipelineMeta.id');
      }
      const now = new Date().toISOString();
      const normalized = {
        ...pipeline,
        pipelineMeta: {
          ...pipeline.pipelineMeta,
          updatedAt: now,
        },
      };
      const filePath = pipelinePath(baseDir, pipelineId);
      fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf8');
      return normalized;
    },

    remove(pipelineId) {
      const filePath = pipelinePath(baseDir, pipelineId);
      if (!fs.existsSync(filePath)) return false;
      fs.unlinkSync(filePath);
      return true;
    },
  };
}
