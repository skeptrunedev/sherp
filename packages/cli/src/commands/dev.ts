import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { readFile } from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import chokidar, { FSWatcher } from 'chokidar';
import { setupWorkspace } from '../utils/workspace.js';
import { createStaticServer } from '../utils/server.js';
import type { DevOptions, ServerInstance, SherpConfig } from '../types.js';

export async function dev(options: DevOptions): Promise<void> {
  const spinner = ora('Starting development server').start();

  let serverInstance: ServerInstance | null = null;
  let watcher: FSWatcher | null = null;
  let workspaceDir: string | null = null;
  let isRebuilding = false;

  const cwd = process.cwd();
  const configPath = join(cwd, 'sherp.config.json');

  try {
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

    // Build function to be reused
    async function buildPresentation(): Promise<boolean> {
      spinner.text = 'Building presentation';
      spinner.start();

      try {
        // Setup workspace (copy user files to temp Astro project)
        workspaceDir = await setupWorkspace(cwd);

        // Build the Astro project to static files
        await new Promise<void>((resolve, reject) => {
          const astroProcess = spawn('npx', ['astro', 'build'], {
            cwd: workspaceDir!,
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

        spinner.succeed(chalk.green('Build complete'));
        return true;
      } catch (error) {
        spinner.fail(chalk.red('Build failed'));
        console.error(error);
        return false;
      }
    }

    // Initial build
    await buildPresentation();

    spinner.text = 'Starting static server';

    // Serve the built files with our custom server (with live reload enabled)
    const distPath = join(workspaceDir!, 'dist');
    serverInstance = await createStaticServer(distPath, {
      host: options.host,
      port: parseInt(options.port),
      liveReload: true,
    });

    spinner.succeed(chalk.green('Development server started'));
    console.log(
      chalk.cyan(`\n  ➜ Local:   http://localhost:${serverInstance.port}/`)
    );
    console.log(
      chalk.cyan(`  ➜ Network: http://${options.host}:${serverInstance.port}/`)
    );
    console.log(chalk.gray('  ➜ Watching for changes...\n'));

    // Watch for file changes in presentation file
    watcher = chokidar.watch(presentationFile, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async (path: string) => {
      if (isRebuilding) return;

      isRebuilding = true;
      console.log(chalk.yellow(`\n  File changed: ${path}`));

      const success = await buildPresentation();

      if (success && serverInstance) {
        serverInstance.reload();
        console.log(chalk.green('  Page reloaded\n'));
      }

      isRebuilding = false;
    });

    // Handle Ctrl+C
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\nShutting down...'));
      if (watcher) {
        await watcher.close();
      }
      if (serverInstance) {
        await serverInstance.close();
      }
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});
  } catch (error) {
    spinner.fail(chalk.red('Failed to start development server'));
    console.error(error);
    if (watcher) {
      await watcher.close();
    }
    if (serverInstance) {
      await serverInstance.close();
    }
    process.exit(1);
  }
}
