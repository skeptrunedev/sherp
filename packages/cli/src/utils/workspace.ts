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
  // Get sherp-astro package root (the installed npm package)
  // When published, this will resolve to node_modules/@skeptrune/sherp-astro
  // In development workspace, this resolves to packages/astro
  const sherpAstroRoot = resolve(__dirname, '../../../astro');

  // Create temp directory
  const tempDir = await mkdtemp(join(tmpdir(), 'sherp-'));

  // Copy core Sherp files (src, astro.config.mjs, etc.)
  const coreDirs = ['src', 'public'];
  const coreFiles = [
    'astro.config.mjs',
    'tsconfig.json',
    'package.json',
    'package-lock.json',
  ];

  for (const dir of coreDirs) {
    const srcPath = join(sherpAstroRoot, dir);
    const destPath = join(tempDir, dir);
    if (existsSync(srcPath)) {
      await cp(srcPath, destPath, { recursive: true });
    }
  }

  for (const file of coreFiles) {
    const srcPath = join(sherpAstroRoot, file);
    const destPath = join(tempDir, file);
    if (existsSync(srcPath)) {
      await cp(srcPath, destPath);
    }
  }

  // Copy node_modules from sherp-astro package to temp workspace
  const nodeModulesPath = join(sherpAstroRoot, 'node_modules');
  const destNodeModules = join(tempDir, 'node_modules');

  if (existsSync(nodeModulesPath)) {
    await cp(nodeModulesPath, destNodeModules, { recursive: true });
  } else {
    // If node_modules doesn't exist in astro package, install dependencies
    console.log('Installing dependencies...');
    execSync('npm install --prefer-offline --no-audit', {
      cwd: tempDir,
      stdio: 'inherit',
    });
  }

  // Read user config
  const configPath = join(userProjectDir, 'sherp.config.json');
  const config: SherpConfig = JSON.parse(await readFile(configPath, 'utf-8'));

  // Copy user presentations
  const presentationsDir = resolve(
    userProjectDir,
    config.presentations || './presentations'
  );
  const destPresentationsDir = join(tempDir, 'src', 'content', 'presentations');

  await mkdir(destPresentationsDir, { recursive: true });

  if (existsSync(presentationsDir)) {
    await cp(presentationsDir, destPresentationsDir, { recursive: true });
  }

  // Copy custom styles if they exist
  if (config.customStyles) {
    const customStylesPath = resolve(userProjectDir, config.customStyles);
    if (existsSync(customStylesPath)) {
      const destStylesPath = join(tempDir, 'src', 'styles', 'user-custom.css');
      await cp(customStylesPath, destStylesPath);

      // Inject into layout
      await injectCustomStyles(tempDir);
    }
  }

  // Copy custom scripts if they exist
  if (config.customScripts) {
    const customScriptsPath = resolve(userProjectDir, config.customScripts);
    if (existsSync(customScriptsPath)) {
      const destScriptsPath = join(tempDir, 'public', 'user-custom.js');
      await cp(customScriptsPath, destScriptsPath);

      // Inject into layout
      await injectCustomScript(tempDir);
    }
  }

  // Copy custom components if they exist
  if (config.components) {
    const componentsPath = resolve(userProjectDir, config.components);
    if (existsSync(componentsPath)) {
      const destComponentsPath = join(tempDir, 'src', 'components', 'user');
      await mkdir(destComponentsPath, { recursive: true });
      await cp(componentsPath, destComponentsPath, { recursive: true });
    }
  }

  // Update content config with user's default theme
  if (config.theme) {
    await updateDefaultTheme(tempDir, config);
  }

  return tempDir;
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

async function injectCustomScript(workspaceDir: string): Promise<void> {
  const indexPath = join(workspaceDir, 'src', 'pages', 'index.astro');
  let content = await readFile(indexPath, 'utf-8');

  // Add script tag before </body> with is:inline directive
  if (!content.includes('user-custom.js')) {
    content = content.replace(
      '</body>',
      '  <script is:inline src="/user-custom.js"></script>\n</body>'
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
