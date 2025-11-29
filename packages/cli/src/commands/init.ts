import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import type { InitOptions, ThemeName } from '../types.js';

const DEFAULT_PROJECT_NAME = 'my-presentation';
const DEFAULT_THEME: ThemeName = 'default';

const THEME_CSS: Record<ThemeName, string> = {
  default: ``,

  corporate: `/* Corporate Theme - Professional navy/slate tones */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html, body {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.slide {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
}

.slide h1 {
  color: #ffffff;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.slide h2 {
  color: #60a5fa;
  font-weight: 600;
}

.slide h3 {
  color: #93c5fd;
  font-weight: 500;
}

.slide strong {
  color: #60a5fa;
}

.slide em {
  color: #94a3b8;
}

.slide a {
  color: #60a5fa;
  text-decoration: underline;
}

.slide ul, .slide ol {
  color: #e2e8f0;
}

.slide li::marker {
  color: #60a5fa;
}

.slide blockquote {
  border-left-color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  padding: 1em;
  border-radius: 0 8px 8px 0;
  color: #cbd5e1;
}

.slide code {
  background: rgba(255, 255, 255, 0.1);
  color: #93c5fd;
}

.slide pre {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
}

.slide pre code {
  color: #e2e8f0;
}

.slide table {
  border-color: rgba(96, 165, 250, 0.3);
}

.slide th {
  background: rgba(96, 165, 250, 0.2);
  color: #ffffff;
}

.slide th, .slide td {
  border-color: rgba(96, 165, 250, 0.3);
}

.slide-page-number {
  color: #64748b;
}
`,

  terminal: `/* Terminal Theme - Green on black, retro hacker aesthetic */

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

html, body {
  background: #0a0a0a;
  color: #00ff00;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.slide {
  background: #0a0a0a;
}

.slide h1 {
  color: #00ff00;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.slide h1::before {
  content: '> ';
  opacity: 0.7;
}

.slide h2 {
  color: #00dd00;
  font-weight: 500;
}

.slide h2::before {
  content: '## ';
  opacity: 0.5;
}

.slide h3 {
  color: #00bb00;
}

.slide strong {
  color: #00ffaa;
}

.slide em {
  color: #88ff88;
  font-style: normal;
  text-decoration: underline;
}

.slide a {
  color: #00ffff;
}

.slide ul, .slide ol {
  color: #00ee00;
}

.slide li::marker {
  color: #00ff00;
}

.slide blockquote {
  border-left-color: #00ff00;
  background: rgba(0, 255, 0, 0.05);
  color: #00dd00;
}

.slide code {
  background: rgba(0, 255, 0, 0.1);
  color: #00ffaa;
  border: 1px solid rgba(0, 255, 0, 0.3);
}

.slide pre {
  background: rgba(0, 20, 0, 0.8);
  border: 1px solid #00ff00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
}

.slide pre code {
  color: #00ff00;
  border: none;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

.slide table {
  border-color: #00ff00;
}

.slide th {
  background: rgba(0, 255, 0, 0.2);
  color: #00ff00;
}

.slide th, .slide td {
  border-color: rgba(0, 255, 0, 0.5);
}

.slide-page-number {
  color: #006600;
  font-family: 'JetBrains Mono', monospace;
}

.slide-page-number::before {
  content: '[';
}

.slide-page-number::after {
  content: ']';
}
`,

  paper: `/* Paper Theme - Sepia/cream tones, serif typography, academic feel */

@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Sans+3:wght@400;600&display=swap');

html, body {
  background: #f4f1ea;
  color: #2c2416;
  font-family: 'Crimson Pro', 'Georgia', 'Times New Roman', serif;
}

.slide {
  background: #f4f1ea;
}

.slide h1 {
  color: #1a1408;
  font-weight: 700;
  font-style: italic;
  border-bottom: 2px solid #8b7355;
  padding-bottom: 0.3em;
}

.slide h2 {
  color: #3d2e1a;
  font-weight: 600;
}

.slide h3 {
  color: #5c4a32;
  font-weight: 600;
}

.slide strong {
  color: #1a1408;
  font-weight: 700;
}

.slide em {
  color: #5c4a32;
  font-style: italic;
}

.slide a {
  color: #6b4423;
  text-decoration: underline;
}

.slide ul, .slide ol {
  color: #2c2416;
}

.slide li::marker {
  color: #8b7355;
}

.slide blockquote {
  border-left-color: #8b7355;
  background: rgba(139, 115, 85, 0.1);
  color: #5c4a32;
  font-style: italic;
  padding: 1em 1.5em;
}

.slide blockquote p {
  margin: 0;
}

.slide code {
  background: rgba(139, 115, 85, 0.15);
  color: #3d2e1a;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 0.85em;
}

.slide pre {
  background: #ebe6dc;
  border: 1px solid #d4cbb8;
  border-radius: 0;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.slide pre code {
  color: #2c2416;
  font-family: 'Source Sans 3', sans-serif;
}

.slide table {
  border-color: #8b7355;
}

.slide th {
  background: rgba(139, 115, 85, 0.2);
  color: #1a1408;
  font-weight: 600;
}

.slide th, .slide td {
  border-color: #c4b8a4;
}

.slide-page-number {
  color: #8b7355;
  font-style: italic;
}
`,
};

async function promptForName(providedName?: string): Promise<string> {
  // If name was provided as CLI arg, use it
  if (providedName) {
    return providedName;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.cyan(`Project directory name (${DEFAULT_PROJECT_NAME}): `),
      (answer) => {
        rl.close();
        resolve(answer.trim() || DEFAULT_PROJECT_NAME);
      }
    );
  });
}

async function promptForTheme(providedTheme?: ThemeName): Promise<ThemeName> {
  if (providedTheme && providedTheme in THEME_CSS) {
    return providedTheme;
  }

  const themes: { name: ThemeName; description: string }[] = [
    { name: 'default', description: 'Minimal, no custom styles' },
    { name: 'corporate', description: 'Professional navy/blue tones' },
    { name: 'terminal', description: 'Green-on-black hacker aesthetic' },
    { name: 'paper', description: 'Sepia/cream academic style' },
  ];

  console.log(chalk.cyan('\nAvailable themes:'));
  themes.forEach((t, i) => {
    console.log(chalk.white(`  ${i + 1}. ${t.name}`) + chalk.gray(` - ${t.description}`));
  });

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.cyan(`\nSelect theme (1-${themes.length}) [1]: `),
      (answer) => {
        rl.close();
        const num = parseInt(answer.trim(), 10);
        if (num >= 1 && num <= themes.length) {
          resolve(themes[num - 1].name);
        } else {
          resolve(DEFAULT_THEME);
        }
      }
    );
  });
}

const defaultConfig = {
  title: 'My Presentation',
  author: 'Your Name',
  presentationFile: './presentation.mdx',
  customStyles: './styles/custom.css',
};

const examplePresentation = `---
title: "Welcome to Sherp"
description: "Create beautiful presentations with Markdown"
author: "Your Name"
paginate: true
---

# Welcome to Sherp 🎉

**Making presentations simple**

Create slides with markdown, customize with ease

---

## Features

- 📝 Write in Markdown/MDX
- ⌨️ Keyboard navigation
- 📱 Mobile responsive
- 🔧 Easy to extend

---

## Getting Started

1. Edit \`presentation.mdx\`
2. Run \`sherp dev\` to see changes
3. Navigate with arrow keys or click
4. Press \`O\` for overview mode

---

## Customization

Edit \`sherp.config.json\` to:

- Add custom CSS

---

# Start Creating! 🚀

Edit this file and see your changes live
`;

export async function init(options: InitOptions): Promise<void> {
  const projectName = await promptForName(options.name);
  const theme = await promptForTheme(options.theme);
  const spinner = ora('Initializing sherp project').start();

  try {
    const projectPath = join(process.cwd(), projectName);

    // Create directory structure
    await mkdir(projectPath, { recursive: true });
    await mkdir(join(projectPath, 'styles'), { recursive: true });

    // Write config file
    await writeFile(
      join(projectPath, 'sherp.config.json'),
      JSON.stringify(defaultConfig, null, 2)
    );

    // Write presentation file
    await writeFile(join(projectPath, 'presentation.mdx'), examplePresentation);

    // Write custom CSS based on selected theme
    await writeFile(
      join(projectPath, 'styles', 'custom.css'),
      THEME_CSS[theme]
    );

    // README.md is intentionally not created to avoid conflicts with the presentation loader
    // which loads all .md/.mdx files from the project directory

    spinner.succeed(chalk.green('Project initialized successfully!'));

    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  sherp dev'));
    console.log('\n' + chalk.gray(`Edit presentation.mdx to get started! (theme: ${theme})`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize project'));
    console.error(error);
    process.exit(1);
  }
}
