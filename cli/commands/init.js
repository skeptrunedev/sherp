import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const defaultConfig = {
  theme: 'default',
  title: 'My Presentation',
  author: 'Your Name',
  presentations: './presentations',
  customStyles: './styles/custom.css',
  customScripts: './scripts/custom.js',
  components: './components'
};

const examplePresentation = `---
title: "Welcome to Sherp"
description: "Create beautiful presentations with Markdown"
author: "Your Name"
theme: "default"
paginate: true
---

# Welcome to Sherp 🎉

**Making presentations simple**

Create slides with markdown, customize with ease

---

## Features

- 📝 Write in Markdown/MDX
- 🎨 Custom themes and styles
- ⌨️ Keyboard navigation
- 📱 Mobile responsive
- 🔧 Easy to extend

---

## Getting Started

1. Edit \`presentations/example.mdx\`
2. Run \`sherp dev\` to see changes
3. Navigate with arrow keys or click
4. Press \`O\` for overview mode

---

## Customization

Edit \`sherp.config.json\` to:

- Change themes
- Add custom CSS
- Include custom scripts
- Configure components

---

# Start Creating! 🚀

Edit this file and see your changes live
`;

const customCssExample = `/* Custom styles for your presentation */

/* Example: Custom heading colors */
.slide h1 {
  color: #ff6b6b;
}

/* Example: Custom background for specific slides */
.slide[data-slide="1"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
`;

const customJsExample = `// Custom JavaScript for your presentation

// Example: Log slide changes
document.addEventListener('DOMContentLoaded', () => {
  console.log('Presentation loaded!');

  // You can add custom interactions here
  // Access slides, add event listeners, etc.
});
`;

export async function init(options) {
  const spinner = ora('Initializing sherp project').start();

  try {
    const projectName = options.name;
    const projectPath = join(process.cwd(), projectName);

    // Create directory structure
    await mkdir(projectPath, { recursive: true });
    await mkdir(join(projectPath, 'presentations'), { recursive: true });
    await mkdir(join(projectPath, 'styles'), { recursive: true });
    await mkdir(join(projectPath, 'scripts'), { recursive: true });
    await mkdir(join(projectPath, 'components'), { recursive: true });

    // Write config file
    await writeFile(
      join(projectPath, 'sherp.config.json'),
      JSON.stringify(defaultConfig, null, 2)
    );

    // Write example presentation
    await writeFile(
      join(projectPath, 'presentations', 'example.mdx'),
      examplePresentation
    );

    // Write custom CSS example
    await writeFile(
      join(projectPath, 'styles', 'custom.css'),
      customCssExample
    );

    // Write custom JS example
    await writeFile(
      join(projectPath, 'scripts', 'custom.js'),
      customJsExample
    );

    // Write README
    const readme = `# ${projectName}

A sherp presentation project.

## Getting Started

\`\`\`bash
cd ${projectName}
sherp dev
\`\`\`

## Commands

- \`sherp dev\` - Start development server
- \`sherp build\` - Build for production
- \`sherp preview\` - Preview production build

## Project Structure

- \`presentations/\` - Your MDX presentation files
- \`sherp.config.json\` - Configuration
- \`styles/\` - Custom CSS files
- \`scripts/\` - Custom JavaScript files
- \`components/\` - Custom React/JSX components

## Documentation

Visit https://github.com/skeptrunedev/sherp for full documentation.
`;

    await writeFile(join(projectPath, 'README.md'), readme);

    spinner.succeed(chalk.green('Project initialized successfully!'));

    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  sherp dev'));
    console.log('\n' + chalk.gray('Edit presentations/example.mdx to get started!'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize project'));
    console.error(error);
    process.exit(1);
  }
}
