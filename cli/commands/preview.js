import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { createStaticServer } from '../utils/server.js';

export async function preview(options) {
  const spinner = ora('Starting preview server').start();

  let serverInstance = null;

  try {
    const cwd = process.cwd();
    const distPath = join(cwd, 'dist');

    if (!existsSync(distPath)) {
      spinner.fail(chalk.red('No dist folder found'));
      console.log(chalk.yellow('\nRun'), chalk.cyan('sherp build'), chalk.yellow('first'));
      process.exit(1);
    }

    spinner.text = 'Starting preview server';

    // Start custom static server
    serverInstance = await createStaticServer(distPath, {
      host: '0.0.0.0',
      port: parseInt(options.port),
      liveReload: false
    });

    spinner.succeed(chalk.green('Preview server started'));
    console.log(chalk.cyan(`\n  ➜ Preview: http://localhost:${serverInstance.port}/\n`));

    // Handle Ctrl+C
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\nShutting down...'));
      if (serverInstance) {
        await serverInstance.close();
      }
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});

  } catch (error) {
    spinner.fail(chalk.red('Failed to start preview server'));
    console.error(error);
    if (serverInstance) {
      await serverInstance.close();
    }
    process.exit(1);
  }
}
