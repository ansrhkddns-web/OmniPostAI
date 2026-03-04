import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE_DIR = path.join(process.cwd(), 'data', 'runs');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runPath(baseDir, runId) {
  return path.join(baseDir, `${runId}.json`);
}

export function createRunRepository(baseDir = DEFAULT_BASE_DIR) {
  ensureDir(baseDir);

  return {
    list() {
      ensureDir(baseDir);
      return fs
        .readdirSync(baseDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
        .sort();
    },

    getById(runId) {
      const filePath = runPath(baseDir, runId);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    },

    save(runRecord) {
      const runId = runRecord?.runId;
      if (!runId) throw new Error('Cannot save run without runId');
      const filePath = runPath(baseDir, runId);
      fs.writeFileSync(filePath, JSON.stringify(runRecord, null, 2), 'utf8');
      return runRecord;
    },
  };
}
