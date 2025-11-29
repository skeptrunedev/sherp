import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { createInterface } from 'readline';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { readFile, mkdir, writeFile } from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { setupWorkspace } from '../utils/workspace.js';
import { createStaticServer } from '../utils/server.js';
import type { ExportOptions, SherpConfig, ServerInstance } from '../types.js';

// Create require function that resolves from CLI's location, not user's cwd
const __filename = fileURLToPath(import.meta.url);
const require = createRequire(__filename);

async function promptForFormat(
  providedFormat: string | undefined
): Promise<'pdf' | 'pptx' | 'images'> {
  if (providedFormat === 'pdf' || providedFormat === 'pptx' || providedFormat === 'images') {
    return providedFormat;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.cyan(`Export format - pdf, pptx, or images (pdf): `),
      (answer) => {
        rl.close();
        const trimmed = answer.trim().toLowerCase();
        if (trimmed === 'pptx') {
          resolve('pptx');
        } else if (trimmed === 'images') {
          resolve('images');
        } else {
          resolve('pdf');
        }
      }
    );
  });
}

async function promptForOutput(
  providedOutput: string | undefined,
  defaultName: string,
  format: string
): Promise<string> {
  // If output was provided as CLI arg, use it
  if (providedOutput) {
    return providedOutput;
  }

  const isImages = format === 'images';
  const defaultOutput = isImages ? `${defaultName}-slides` : `${defaultName}.${format}`;
  const promptText = isImages ? 'Output directory' : 'Output filename';

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.cyan(`${promptText} (${defaultOutput}): `),
      (answer) => {
        rl.close();
        resolve(answer.trim() || defaultOutput);
      }
    );
  });
}


export async function exportPresentation(options: ExportOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, 'sherp.config.json');

  if (!existsSync(configPath)) {
    console.log(chalk.red('No sherp.config.json found'));
    console.log(
      chalk.yellow('\nRun'),
      chalk.cyan('sherp init'),
      chalk.yellow('to create a new project')
    );
    process.exit(1);
  }

  // Prompt for format if not provided
  const format = await promptForFormat(options.format);

  // Read config to get presentation file and default name
  const config: SherpConfig = JSON.parse(await readFile(configPath, 'utf-8'));
  const defaultName = config.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'presentation';

  // Prompt for output filename
  const outputFile = await promptForOutput(options.output, defaultName, format);
  const outputPath = join(cwd, outputFile);

  const spinner = ora('Preparing export').start();
  let serverInstance: ServerInstance | null = null;

  try {
    const presentationFile = join(
      cwd,
      config.presentationFile || './presentation.mdx'
    );
    const presentationDir = dirname(presentationFile);

    spinner.text = 'Building presentation';

    // Setup workspace and build
    const workspaceDir = await setupWorkspace(cwd);

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

    spinner.text = 'Starting local server';

    // Start a local server to serve the built files
    const distPath = join(workspaceDir, 'dist');
    serverInstance = await createStaticServer(distPath, {
      port: 4323,
      liveReload: false,
    });

    const baseUrl = `http://localhost:${serverInstance.port}`;

    if (format === 'pdf') {
      await exportToPdf(spinner, baseUrl, outputPath);
    } else if (format === 'pptx') {
      await exportToPptx(spinner, baseUrl, outputPath, presentationFile);
    } else if (format === 'images') {
      await exportToImages(spinner, baseUrl, outputPath);
    }

    spinner.succeed(chalk.green(`Exported to ${outputFile}`));
  } catch (error) {
    spinner.fail(chalk.red('Export failed'));
    console.error(error);
    process.exit(1);
  } finally {
    if (serverInstance) {
      await serverInstance.close();
    }
  }
}

async function exportToPdf(
  spinner: ReturnType<typeof ora>,
  baseUrl: string,
  outputPath: string
): Promise<void> {
  spinner.text = 'Loading puppeteer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;
  try {
    puppeteer = require('puppeteer');
  } catch {
    spinner.fail(chalk.red('puppeteer is required for PDF export'));
    console.log(chalk.yellow('\nInstall it with:'));
    console.log(chalk.cyan('  npm install -g puppeteer'));
    process.exit(1);
  }

  spinner.text = 'Launching browser';

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Set viewport to standard slide dimensions (16:9)
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    spinner.text = 'Loading presentation';
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });

    // Wait for slides to be rendered
    await page.waitForSelector('.slide', { timeout: 10000 });

    // Get total slide count
    const slideCount: number = await page.evaluate(`
      document.querySelectorAll('.slide').length
    `);

    spinner.text = `Generating PDF (${slideCount} slides)`;

    // Capture each slide as a screenshot, then combine into PDF
    const screenshots: Buffer[] = [];

    for (let i = 0; i < slideCount; i++) {
      spinner.text = `Capturing slide ${i + 1}/${slideCount}`;

      // Show only the current slide by manipulating opacity/visibility and active class
      await page.evaluate(`
        (function() {
          var slides = document.querySelectorAll('.slide');
          slides.forEach(function(slide, idx) {
            // Disable transitions for instant switching
            slide.style.transition = 'none';
            if (idx === ${i}) {
              slide.classList.add('active');
              slide.style.opacity = '1';
              slide.style.visibility = 'visible';
              slide.style.zIndex = '1';
            } else {
              slide.classList.remove('active');
              slide.style.opacity = '0';
              slide.style.visibility = 'hidden';
              slide.style.zIndex = '0';
            }
          });
          var nav = document.querySelector('.slide-navigation');
          if (nav) nav.style.display = 'none';
          var controls = document.querySelector('.presentation-controls');
          if (controls) controls.style.display = 'none';
        })()
      `);

      // Delay to ensure rendering completes
      await new Promise((resolve) => setTimeout(resolve, 200));

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
      });
      screenshots.push(screenshot as Buffer);
    }

    spinner.text = 'Generating PDF';

    // Create PDF from screenshots using a new page for each
    const pdfPage = await browser.newPage();
    await pdfPage.setViewport({ width: 1920, height: 1080 });

    // Create HTML with all screenshots as full-page images
    const imagesHtml = screenshots
      .map(
        (buf) =>
          `<div class="slide-page"><img src="data:image/png;base64,${buf.toString('base64')}" /></div>`
      )
      .join('');

    await pdfPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 1920px 1080px; margin: 0; }
            body { margin: 0; padding: 0; }
            .slide-page {
              width: 1920px;
              height: 1080px;
              page-break-after: always;
              overflow: hidden;
            }
            .slide-page:last-child { page-break-after: avoid; }
            .slide-page img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>${imagesHtml}</body>
      </html>
    `);

    await pdfPage.pdf({
      path: outputPath,
      width: '1920px',
      height: '1080px',
      printBackground: true,
      preferCSSPageSize: false,
    });
  } finally {
    await browser.close();
  }
}

async function exportToImages(
  spinner: ReturnType<typeof ora>,
  baseUrl: string,
  outputDir: string
): Promise<void> {
  spinner.text = 'Loading puppeteer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;
  try {
    puppeteer = require('puppeteer');
  } catch {
    spinner.fail(chalk.red('puppeteer is required for images export'));
    console.log(chalk.yellow('\nInstall it with:'));
    console.log(chalk.cyan('  npm install -g puppeteer'));
    process.exit(1);
  }

  spinner.text = 'Launching browser';

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    spinner.text = 'Loading presentation';
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });

    await page.waitForSelector('.slide', { timeout: 10000 });

    const slideCount: number = await page.evaluate(`
      document.querySelectorAll('.slide').length
    `);

    spinner.text = `Exporting ${slideCount} slides as images`;

    // Create output directory
    await mkdir(outputDir, { recursive: true });

    for (let i = 0; i < slideCount; i++) {
      spinner.text = `Capturing slide ${i + 1}/${slideCount}`;

      // Show only the current slide
      await page.evaluate(`
        (function() {
          var slides = document.querySelectorAll('.slide');
          slides.forEach(function(slide, idx) {
            slide.style.transition = 'none';
            if (idx === ${i}) {
              slide.classList.add('active');
              slide.style.opacity = '1';
              slide.style.visibility = 'visible';
              slide.style.zIndex = '1';
            } else {
              slide.classList.remove('active');
              slide.style.opacity = '0';
              slide.style.visibility = 'hidden';
              slide.style.zIndex = '0';
            }
          });
          var nav = document.querySelector('.slide-navigation');
          if (nav) nav.style.display = 'none';
          var controls = document.querySelector('.presentation-controls');
          if (controls) controls.style.display = 'none';
        })()
      `);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
      });

      const paddedNum = String(i + 1).padStart(3, '0');
      const imagePath = join(outputDir, `slide-${paddedNum}.png`);
      await writeFile(imagePath, screenshot as Buffer);
    }
  } finally {
    await browser.close();
  }
}

async function exportToPptx(
  spinner: ReturnType<typeof ora>,
  baseUrl: string,
  outputPath: string,
  _presentationFile: string
): Promise<void> {
  spinner.text = 'Loading pptxgenjs';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let PptxGenJS: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;

  try {
    PptxGenJS = require('pptxgenjs');
  } catch {
    spinner.fail(chalk.red('pptxgenjs is required for PPTX export'));
    console.log(chalk.yellow('\nInstall it with:'));
    console.log(chalk.cyan('  npm install -g pptxgenjs'));
    process.exit(1);
  }

  try {
    puppeteer = require('puppeteer');
  } catch {
    spinner.fail(chalk.red('puppeteer is required for PPTX export'));
    console.log(chalk.yellow('\nInstall it with:'));
    console.log(chalk.cyan('  npm install -g puppeteer'));
    process.exit(1);
  }

  spinner.text = 'Launching browser';

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    spinner.text = 'Loading presentation';
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });

    await page.waitForSelector('.slide', { timeout: 10000 });

    // Get slide count
    const slideCount: number = await page.evaluate(`
      document.querySelectorAll('.slide').length
    `);

    spinner.text = `Creating PPTX (${slideCount} slides)`;

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 16:9 aspect ratio

    // Capture each slide as an image and add to PPTX
    for (let i = 0; i < slideCount; i++) {
      spinner.text = `Capturing slide ${i + 1}/${slideCount}`;

      // Navigate to specific slide by manipulating opacity/visibility and active class
      await page.evaluate(`
        (function() {
          var slides = document.querySelectorAll('.slide');
          slides.forEach(function(slide, idx) {
            // Disable transitions for instant switching
            slide.style.transition = 'none';
            if (idx === ${i}) {
              slide.classList.add('active');
              slide.style.opacity = '1';
              slide.style.visibility = 'visible';
              slide.style.zIndex = '1';
            } else {
              slide.classList.remove('active');
              slide.style.opacity = '0';
              slide.style.visibility = 'hidden';
              slide.style.zIndex = '0';
            }
          });
          var nav = document.querySelector('.slide-navigation');
          if (nav) nav.style.display = 'none';
          var controls = document.querySelector('.presentation-controls');
          if (controls) controls.style.display = 'none';
        })()
      `);

      // Delay to ensure rendering completes
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Capture screenshot
      const slideElement = await page.$('.slide:not([style*="display: none"])');
      if (slideElement) {
        const screenshot = await slideElement.screenshot({
          encoding: 'base64',
          type: 'png',
        });

        const slide = pptx.addSlide();
        slide.addImage({
          data: `data:image/png;base64,${screenshot}`,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        });
      }
    }

    spinner.text = 'Writing PPTX file';
    await pptx.writeFile({ fileName: outputPath });
  } finally {
    await browser.close();
  }
}
