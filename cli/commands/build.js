import { spawn } from 'child_process';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { setupWorkspace } from '../utils/workspace.js';
import { copyFile, mkdir, cp } from 'fs/promises';

export async function build(options) {
  const spinner = ora('Building presentation').start();

  try {
    const cwd = process.cwd();
    const configPath = join(cwd, 'sherp.config.json');

    if (!existsSync(configPath)) {
      spinner.fail(chalk.red('No sherp.config.json found'));
      console.log(chalk.yellow('\nRun'), chalk.cyan('sherp init'), chalk.yellow('to create a new project'));
      process.exit(1);
    }

    // Setup workspace
    const workspaceDir = await setupWorkspace(cwd);

    spinner.text = 'Building with Astro';

    // Run Astro build
    await new Promise((resolve, reject) => {
      const astroProcess = spawn(
        'npx',
        ['astro', 'build'],
        {
          cwd: workspaceDir,
          stdio: 'inherit',
          shell: true
        }
      );

      astroProcess.on('error', reject);
      astroProcess.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
    });

    // Copy dist back to user's project
    const distSource = join(workspaceDir, 'dist');
    const distDest = join(cwd, 'dist');

    await mkdir(distDest, { recursive: true });
    await cp(distSource, distDest, { recursive: true });

    spinner.succeed(chalk.green('Build complete!'));
    console.log(chalk.cyan(`\n  Output: ${distDest}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Build failed'));
    console.error(error);
    process.exit(1);
  }
}
