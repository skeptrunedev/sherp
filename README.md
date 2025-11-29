# Sherp

A CLI for building presentations from Markdown/MDX.
Instant dev server, multiple themes, keyboard navigation, and PDF export.

```bash
npm install -g @skeptrunedev/sherp-cli
```

## 🎨 Themes

Sherp comes with four built-in themes to get you started:

<table>
<tr>
<td align="center"><strong>Terminal</strong><br/><em>Green-on-black hacker aesthetic</em><br/><img src="./assets/themes/terminal.png" width="400"/></td>
<td align="center"><strong>Paper</strong><br/><em>Sepia/cream academic style</em><br/><img src="./assets/themes/paper.png" width="400"/></td>
</tr>
<tr>
<td align="center"><strong>Corporate</strong><br/><em>Professional navy/blue tones</em><br/><img src="./assets/themes/corporate.png" width="400"/></td>
<td align="center"><strong>Default</strong><br/><em>Minimal, no custom styles</em><br/><img src="./assets/themes/default.png" width="400"/></td>
</tr>
</table>

Select a theme during project creation:

```bash
sherp init my-presentation --theme terminal
```

Or choose interactively when running `sherp init`.

## 📦 Monorepo Structure

This is a monorepo containing two packages:

- **[@skeptrunedev/sherp-cli](./packages/cli)** - The CLI tool for creating and managing presentations
- **[@skeptrunedev/sherp-astro](./packages/astro)** - The Astro-based presentation engine

## ✨ Features

- 📝 **Write in Markdown/MDX** - Focus on content, not code
- 🎯 **Zero config** - Works out of the box
- ⌨️ **Keyboard navigation** - Arrow keys, spacebar, and shortcuts
- 📱 **Mobile responsive** - 16:9 aspect ratio that scales perfectly
- 🎪 **Overview mode** - Press 'O' to see all slides
- 🔧 **Fully customizable** - Add your own CSS, JS, and React components
- 🚀 **Fast dev experience** - Instant hot reload
- 🎨 **Built-in themes** - Choose from multiple pre-built themes

## 🚀 Quick Start

### Installation

```bash
npm install -g @skeptrunedev/sherp-cli
```

### Create a new presentation

```bash
sherp init my-presentation
cd my-presentation
sherp dev
```

That's it! Your presentation is now running at `http://localhost:4321`

## 📁 Project Structure

```
my-presentation/
├── presentations/           # Your MDX presentation files
│   └── example.mdx
├── styles/                  # Custom CSS (optional)
│   └── custom.css
├── scripts/                 # Custom JavaScript (optional)
│   └── custom.js
├── components/              # Custom React components (optional)
└── sherp.config.json       # Configuration
```

## 📝 Writing Presentations

Create MDX files in the `presentations/` folder:

```mdx
---
title: 'My Awesome Talk'
author: 'Your Name'
paginate: true
---

# Welcome! 👋

This is my first slide

---

## Features

- Easy to write
- Beautiful output
- Keyboard navigation

---

# Questions?

Thanks for watching!
```

Slides are separated by `---` (horizontal rules).

## ⚙️ Configuration

Edit `sherp.config.json` to customize your presentation:

```json
{
  "title": "My Presentation",
  "author": "Your Name",
  "presentations": "./presentations",
  "customStyles": "./styles/custom.css",
  "customScripts": "./scripts/custom.js",
  "components": "./components"
}
```

## 🎯 Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `sherp init <name>` | Create a new presentation project |
| `sherp dev`         | Start development server          |
| `sherp build`       | Build for production              |
| `sherp preview`     | Preview production build          |

## ⌨️ Keyboard Shortcuts

- **Arrow keys / Space** - Navigate slides
- **Home / End** - First / Last slide
- **O** - Overview mode
- **F** - Fullscreen (in browser)

## 🎨 Custom Styling

Add custom CSS in `styles/custom.css`:

```css
/* Custom heading color */
.slide h1 {
  color: #ff6b6b;
}

/* Custom background for slide 1 */
.slide[data-slide='1'] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

## 📜 Custom Scripts

Add custom JavaScript in `scripts/custom.js`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  console.log('Presentation loaded!');
  // Add custom interactions
});
```

## 🧩 Custom Components

Create React/JSX components in `components/` and use them in your MDX:

```jsx
// components/CustomButton.jsx
export default function CustomButton({ children }) {
  return <button className="custom-btn">{children}</button>;
}
```

```mdx
import CustomButton from './components/CustomButton.jsx';

# My Slide

<CustomButton>Click me!</CustomButton>
```

## 🚢 Deployment

Build your presentation:

```bash
sherp build
```

Deploy the `dist/` folder to:

- **Netlify** - Drag and drop
- **Vercel** - `vercel --prod`
- **GitHub Pages** - Push to `gh-pages` branch
- Any static hosting service

## 🛠️ Development

This project uses npm workspaces. To develop locally:

```bash
# Install all dependencies
npm install

# Work on the CLI package
cd packages/cli

# Work on the Astro package
cd packages/astro
```

## 🤝 Contributing

Contributions welcome! Visit [github.com/skeptrunedev/sherp](https://github.com/skeptrunedev/sherp)

## 📄 License

MIT

## 🙏 Acknowledgments

Inspired by [Marp](https://marp.app/) - Made with [Astro](https://astro.build/)
