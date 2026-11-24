const { readdirSync, statSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const failures = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry === 'coverage') continue;
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', fullPath], { encoding: 'utf8' });
      if (result.status !== 0) {
        failures.push({ file: fullPath, output: result.stderr || result.stdout });
      }
    }
  }
}

walk(root);
if (failures.length) {
  for (const failure of failures) {
    process.stderr.write(`\n${failure.file}\n${failure.output}`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write('Backend JavaScript syntax check passed.\n');
}
