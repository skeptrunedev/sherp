import { spawn } from 'child_process';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { setupWorkspace } from '../utils/workspace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function dev(options) {
  const spinner = ora('Starting development server').start();

  try {
    const cwd = process.cwd();
    const configPath = join(cwd, 'sherp.config.json');

    if (!existsSync(configPath)) {
      spinner.fail(chalk.red('No sherp.config.json found'));
      console.log(chalk.yellow('\nRun'), chalk.cyan('sherp init'), chalk.yellow('to create a new project'));
      process.exit(1);
    }

    // Setup workspace (copy user files to temp Astro project)
    const workspaceDir = await setupWorkspace(cwd);

    spinner.text = 'Starting Astro dev server';

    // Get the sherp package root (where the actual Astro project is)
    const sherpRoot = resolve(__dirname, '../..');

    // Start Astro dev server
    const astroProcess = spawn(
      'npx',
      [
        'astro',
        'dev',
        '--host',
        options.host,
        '--port',
        options.port
      ],
      {
        cwd: workspaceDir,
        stdio: 'inherit',
        shell: true
      }
    );

    spinner.succeed(chalk.green('Development server started'));
    console.log(chalk.cyan(`\n  ➜ Local:   http://localhost:${options.port}/`));
    console.log(chalk.cyan(`  ➜ Network: http://${options.host}:${options.port}/\n`));

    astroProcess.on('error', (error) => {
      console.error(chalk.red('Failed to start dev server:'), error);
      process.exit(1);
    });

    astroProcess.on('exit', (code) => {
      if (code !== 0) {
        process.exit(code);
      }
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      astroProcess.kill('SIGINT');
      process.exit(0);
    });

  } catch (error) {
    spinner.fail(chalk.red('Failed to start development server'));
    console.error(error);
    process.exit(1);
  }
}
