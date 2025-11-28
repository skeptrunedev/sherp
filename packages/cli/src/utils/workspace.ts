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
  const tempDir = await mkdtemp(join(tmpdir(), 'sherp-'));

  // Check for local astro package (development mode)
  const localAstroPath = resolve(__dirname, '../../../astro');

  if (existsSync(localAstroPath)) {
    console.log('\nUsing local Sherp packages...');
    await cp(localAstroPath, tempDir, { recursive: true });
  } else {
    console.log('\nDownloading Sherp template...');
    try {
      execSync(
        'git clone -n --depth=1 --filter=tree:0 https://github.com/skeptrunedev/sherp.git .',
        {
          cwd: tempDir,
          stdio: 'ignore',
        }
      );
      execSync('git sparse-checkout set --no-cone packages/astro', {
        cwd: tempDir,
        stdio: 'ignore',
      });
      execSync('git checkout', {
        cwd: tempDir,
        stdio: 'ignore',
      });
    } catch (error) {
      throw new Error(
        'Failed to download Sherp template. Please ensure git is installed and accessible.'
      );
    }
  }

  const workspaceDir = existsSync(localAstroPath)
    ? tempDir
    : join(tempDir, 'packages/astro');

  console.log('Installing dependencies...');
  execSync('npm install --prefer-offline --no-audit', {
    cwd: workspaceDir,
    stdio: 'inherit',
  });

  const configPath = join(userProjectDir, 'sherp.config.json');
  const config: SherpConfig = JSON.parse(await readFile(configPath, 'utf-8'));

  if (config.customStyles) {
    const customStylesPath = resolve(userProjectDir, config.customStyles);
    if (existsSync(customStylesPath)) {
      const destStylesPath = join(
        workspaceDir,
        'src',
        'styles',
        'user-custom.css'
      );
      await cp(customStylesPath, destStylesPath);

      await injectCustomStyles(workspaceDir);
    }
  }

  return workspaceDir;
}

async function injectCustomStyles(workspaceDir: string): Promise<void> {
  const indexPath = join(workspaceDir, 'src', 'pages', 'index.astro');
  let content = await readFile(indexPath, 'utf-8');

  if (!content.includes('user-custom.css')) {
    const importStatement = "import '../styles/user-custom.css';";
    const frontmatterEnd = content.lastIndexOf('---');
    if (frontmatterEnd > 0) {
      content =
        content.slice(0, frontmatterEnd) +
        importStatement +
        '\n' +
        content.slice(frontmatterEnd);
    }
    await writeFile(indexPath, content);
  }
}
