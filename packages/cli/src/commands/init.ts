import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import type { InitOptions } from '../types.js';

const DEFAULT_PROJECT_NAME = 'my-presentation';

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

const customCssExample = ``;

export async function init(options: InitOptions): Promise<void> {
  const projectName = await promptForName(options.name);
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

    // Write custom CSS example
    await writeFile(
      join(projectPath, 'styles', 'custom.css'),
      customCssExample
    );

    // README.md is intentionally not created to avoid conflicts with the presentation loader
    // which loads all .md/.mdx files from the project directory

    spinner.succeed(chalk.green('Project initialized successfully!'));

    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  sherp dev'));
    console.log('\n' + chalk.gray('Edit presentation.mdx to get started!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize project'));
    console.error(error);
    process.exit(1);
  }
}
