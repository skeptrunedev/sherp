import { mkdtemp, cp, readFile, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import type { SherpConfig } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Sets up a temporary workspace by copying the Sherp core files
 * and merging in user's presentations, config, and customizations
 */
export async function setupWorkspace(userProjectDir: string): Promise<string> {
  // Get sherp-astro package root (downloaded from GitHub)
  const tempDir = await mkdtemp(join(tmpdir(), 'sherp-'));

  console.log('Downloading Sherp template...');
  try {
    execSync('git clone -n --depth=1 --filter=tree:0 https://github.com/skeptrunedev/sherp.git .', {
      cwd: tempDir,
      stdio: 'ignore',
    });
    execSync('git sparse-checkout set --no-cone packages/astro', {
      cwd: tempDir,
      stdio: 'ignore',
    });
    execSync('git checkout', {
      cwd: tempDir,
      stdio: 'ignore',
    });
  } catch (error) {
    throw new Error('Failed to download Sherp template. Please ensure git is installed and accessible.');
  }

  const workspaceDir = join(tempDir, 'packages/astro');

  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install --prefer-offline --no-audit', {
    cwd: workspaceDir,
    stdio: 'inherit',
  });

  // Read user config
  const configPath = join(userProjectDir, 'sherp.config.json');
  const config: SherpConfig = JSON.parse(await readFile(configPath, 'utf-8'));

  // Copy custom styles if they exist
  if (config.customStyles) {
    const customStylesPath = resolve(userProjectDir, config.customStyles);
    if (existsSync(customStylesPath)) {
      const destStylesPath = join(workspaceDir, 'src', 'styles', 'user-custom.css');
      await cp(customStylesPath, destStylesPath);

      // Inject into layout
      await injectCustomStyles(workspaceDir);
    }
  }

  // Update content config with user's default theme
  if (config.theme) {
    await updateDefaultTheme(workspaceDir, config);
  }

  return workspaceDir;
}

async function injectCustomStyles(workspaceDir: string): Promise<void> {
  const indexPath = join(workspaceDir, 'src', 'pages', 'index.astro');
  let content = await readFile(indexPath, 'utf-8');

  // Add import for custom styles
  if (!content.includes('user-custom.css')) {
    content = content.replace(
      "import '../styles/marp-themes.css';",
      "import '../styles/marp-themes.css';\nimport '../styles/user-custom.css';"
    );
    await writeFile(indexPath, content);
  }
}

async function updateDefaultTheme(
  workspaceDir: string,
  config: SherpConfig
): Promise<void> {
  const configPath = join(workspaceDir, 'src', 'content', 'config.ts');
  let content = await readFile(configPath, 'utf-8');

  // Update default theme
  content = content.replace(
    /theme: z\.string\(\)\.default\(['"]default['"]\)/,
    `theme: z.string().default('${config.theme}')`
  );

  await writeFile(configPath, content);
}
