import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createTaskProgressService } from '../src/services/taskProgressService.js';

function makeTempFile(content) {
  const dir = path.join(process.cwd(), 'tmp-test-data', 'tasks', String(Date.now()), String(Math.random()).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'TASKS.md');
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

test('task progress service parses markdown table statuses', () => {
  const md = `
| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| A-01 | P0 | one | DONE | x |
| A-02 | P0 | two | TODO | x |
| A-03 | P1 | three | IN_PROGRESS | x |
| A-04 | P1 | four | BLOCKED | x |
`;

  const pathToTasks = makeTempFile(md);
  const service = createTaskProgressService(pathToTasks);
  const progress = service.getProgress();

  assert.equal(progress.total, 4);
  assert.equal(progress.done, 1);
  assert.equal(progress.todo, 1);
  assert.equal(progress.inProgress, 1);
  assert.equal(progress.blocked, 1);
  assert.equal(progress.percent, 25);
});


test('task progress service returns prioritized next tasks', () => {
  const md = `
| ID | 우선순위 | 작업 | 상태 | 비고 |
|---|---|---|---|---|
| A-01 | P1 | one | TODO | x |
| A-02 | P0 | two | TODO | x |
| A-03 | P0 | three | IN_PROGRESS | x |
| A-04 | P2 | four | DONE | x |
`;

  const pathToTasks = makeTempFile(md);
  const service = createTaskProgressService(pathToTasks);
  const next = service.getNextTasks(2);

  assert.equal(next.length, 2);
  assert.equal(next[0].id, 'A-03');
  assert.equal(next[1].id, 'A-02');
});
