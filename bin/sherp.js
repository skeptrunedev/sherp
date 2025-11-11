#!/usr/bin/env node

import { program } from 'commander';
import { init } from '../cli/commands/init.js';
import { dev } from '../cli/commands/dev.js';
import { build } from '../cli/commands/build.js';
import { preview } from '../cli/commands/preview.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('sherp')
  .description('Marp-style presentations made simple')
  .version(packageJson.version);

program
  .command('init [name]')
  .description('Initialize a new sherp presentation project')
  .action((name) => init({ name: name || 'my-presentation' }));

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port to run on', '4321')
  .option('-H, --host <host>', 'Host to bind to', '0.0.0.0')
  .action(dev);

program
  .command('build')
  .description('Build presentation for production')
  .action(build);

program
  .command('preview')
  .description('Preview production build')
  .option('-p, --port <port>', 'Port to run on', '4322')
  .action(preview);

program.parse();
