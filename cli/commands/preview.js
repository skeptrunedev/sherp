import { spawn } from 'child_process';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';

export async function preview(options) {
  const spinner = ora('Starting preview server').start();

  try {
    const cwd = process.cwd();
    const distPath = join(cwd, 'dist');

    if (!existsSync(distPath)) {
      spinner.fail(chalk.red('No dist folder found'));
      console.log(chalk.yellow('\nRun'), chalk.cyan('sherp build'), chalk.yellow('first'));
      process.exit(1);
    }

    spinner.text = 'Starting preview server';

    // Start Astro preview
    const astroProcess = spawn(
      'npx',
      ['astro', 'preview', '--port', options.port],
      {
        cwd,
        stdio: 'inherit',
        shell: true
      }
    );

    spinner.succeed(chalk.green('Preview server started'));
    console.log(chalk.cyan(`\n  ➜ Preview: http://localhost:${options.port}/\n`));

    astroProcess.on('error', (error) => {
      console.error(chalk.red('Failed to start preview server:'), error);
      process.exit(1);
    });

    astroProcess.on('exit', (code) => {
      if (code !== 0) {
        process.exit(code);
      }
    });

    process.on('SIGINT', () => {
      astroProcess.kill('SIGINT');
      process.exit(0);
    });

  } catch (error) {
    spinner.fail(chalk.red('Failed to start preview server'));
    console.error(error);
    process.exit(1);
  }
}
