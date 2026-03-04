import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TASKS_PATH = path.join(process.cwd(), 'docs', 'TASKS.md');

function parseTaskRows(markdown) {
  const lines = markdown.split('\n');
  const rows = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cols = trimmed.split('|').map((c) => c.trim());
    if (cols.length < 6) continue;
    const id = cols[1];
    const priority = cols[2];
    const task = cols[3];
    const status = cols[4];
    const note = cols[5];
    if (!id || id === 'ID' || id.startsWith('---')) continue;
    if (!['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].includes(status)) continue;
    rows.push({ id, priority, task, status, note });
  }
  return rows;
}

function priorityRank(priority) {
  if (priority === 'P0') return 0;
  if (priority === 'P1') return 1;
  if (priority === 'P2') return 2;
  return 3;
}

export function createTaskProgressService(tasksPath = DEFAULT_TASKS_PATH) {
  function readRows() {
    if (!fs.existsSync(tasksPath)) return [];
    const markdown = fs.readFileSync(tasksPath, 'utf8');
    return parseTaskRows(markdown);
  }

  return {
    getProgress() {
      const rows = readRows();
      const total = rows.length;
      const done = rows.filter((r) => r.status === 'DONE').length;
      const inProgress = rows.filter((r) => r.status === 'IN_PROGRESS').length;
      const todo = rows.filter((r) => r.status === 'TODO').length;
      const blocked = rows.filter((r) => r.status === 'BLOCKED').length;
      const percent = total === 0 ? 0 : Number(((done / total) * 100).toFixed(2));

      return {
        tasksPath,
        total,
        done,
        inProgress,
        todo,
        blocked,
        percent,
      };
    },

    getNextTasks(limit = 5) {
      const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 5;
      const rows = readRows();
      return rows
        .filter((r) => r.status === 'TODO' || r.status === 'IN_PROGRESS')
        .sort((a, b) => {
          const p = priorityRank(a.priority) - priorityRank(b.priority);
          if (p !== 0) return p;
          if (a.status !== b.status) {
            if (a.status === 'IN_PROGRESS') return -1;
            if (b.status === 'IN_PROGRESS') return 1;
          }
          return a.id.localeCompare(b.id);
        })
        .slice(0, safeLimit);
    },
  };
}
