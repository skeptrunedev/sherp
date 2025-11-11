# Marp on Astro

Marp-style presentations using Astro + MDX + Content Collections. Write all slides in one file, split with `---`.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:4321`

## Create a Presentation

Add `src/content/presentations/my-talk.mdx`:

```mdx
---
title: "My Talk"
theme: "default"
paginate: true
---

# Slide 1

---

# Slide 2
```

## Features

- Single file presentations (MDX)
- Slide splitting with `---`
- Themes: default, gaia, uncover, dark, light
- Keyboard navigation (arrows, space, O for overview)
- Directive support via frontmatter

## Navigation

- `→` `↓` `Space` - Next
- `←` `↑` - Previous
- `O` - Overview mode
- `Home`/`End` - First/Last slide
