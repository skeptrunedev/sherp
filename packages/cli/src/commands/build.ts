import { spawn } from 'child_process';
import { join, dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { setupWorkspace } from '../utils/workspace.js';
import { mkdir, cp, readFile } from 'fs/promises';
import type { BuildOptions, SherpConfig } from '../types.js';

export async function build(options: BuildOptions): Promise<void> {
  const spinner = ora('Building presentation').start();

  try {
    const cwd = process.cwd();
    const configPath = join(cwd, 'sherp.config.json');

    if (!existsSync(configPath)) {
      spinner.fail(chalk.red('No sherp.config.json found'));
      console.log(
        chalk.yellow('\nRun'),
        chalk.cyan('sherp init'),
        chalk.yellow('to create a new project')
      );
      process.exit(1);
    }

    // Read config to get presentation file
    const config: SherpConfig = JSON.parse(await readFile(configPath, 'utf-8'));
    const presentationFile = join(
      cwd,
      config.presentationFile || './presentation.mdx'
    );

    // Get the directory containing the presentation file for Astro loader
    const presentationDir = dirname(presentationFile);

    // Setup workspace
    const workspaceDir = await setupWorkspace(cwd);

    spinner.text = 'Building with Astro';

    // Run Astro build
    await new Promise<void>((resolve, reject) => {
      const astroProcess = spawn('npx', ['astro', 'build'], {
        cwd: workspaceDir,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          VITE_PRESENTATIONS_DIR: presentationDir,
        },
      });

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

    // Copy images directory if it exists (for markdown image references)
    const imagesSource = join(presentationDir, 'images');
    if (existsSync(imagesSource)) {
      const imagesDest = join(distDest, 'images');
      await cp(imagesSource, imagesDest, { recursive: true });
    }

    spinner.succeed(chalk.green('Build complete!'));
    console.log(chalk.cyan(`\n  Output: ${distDest}\n`));
  } catch (error) {
    spinner.fail(chalk.red('Build failed'));
    console.error(error);
    process.exit(1);
  }
}
