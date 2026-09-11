import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const sourceRoot = join(projectRoot, 'miniprogram');

function collectTypescriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectTypescriptFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.ts') ? [relative(projectRoot, filePath)] : [];
  });
}

const tsc = process.platform === 'win32' ? join(projectRoot, 'node_modules/.bin/tsc.cmd') : join(projectRoot, 'node_modules/.bin/tsc');
const sourceFiles = collectTypescriptFiles(sourceRoot);
const result = spawnSync(tsc, [
  '--rootDir', 'miniprogram',
  '--outDir', 'miniprogram',
  '--module', 'commonjs',
  '--target', 'ES2018',
  '--skipLibCheck',
  '--noEmit', 'false',
  ...sourceFiles
], { cwd: projectRoot, stdio: 'inherit', shell: process.platform === 'win32' });

process.exit(result.status ?? 1);
