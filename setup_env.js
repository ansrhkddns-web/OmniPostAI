import fs from 'node:fs';
import path from 'node:path';

const dirs = [
  path.join(process.cwd(), 'data', 'pipelines'),
  path.join(process.cwd(), 'data', 'runs'),
  path.join(process.cwd(), 'reports')
];

console.log('--- OmniPostAI Environment Setup ---');

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log('Setup completed successfully.');
