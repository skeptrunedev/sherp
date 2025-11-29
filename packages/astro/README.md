# @skeptrune/sherp-astro

The Astro-based presentation engine for Sherp.

This package contains the core Astro application that powers Sherp presentations. It includes:

- Astro configuration and build setup
- Presentation viewer and slide components
- Markdown/MDX processing and slide parsing
- Keyboard navigation and overview mode
- Responsive design with 16:9 aspect ratio
- Built-in theme support

## Themes

The presentation engine supports customizable themes via CSS:

<table>
<tr>
<td align="center"><strong>Terminal</strong><br/><em>Green-on-black hacker aesthetic</em><br/><img src="../../assets/themes/terminal.png" width="400"/></td>
<td align="center"><strong>Paper</strong><br/><em>Sepia/cream academic style</em><br/><img src="../../assets/themes/paper.png" width="400"/></td>
</tr>
<tr>
<td align="center"><strong>Corporate</strong><br/><em>Professional navy/blue tones</em><br/><img src="../../assets/themes/corporate.png" width="400"/></td>
<td align="center"><strong>Default</strong><br/><em>Minimal, no custom styles</em><br/><img src="../../assets/themes/default.png" width="400"/></td>
</tr>
</table>

## Usage

This package is typically used by `@skeptrune/sherp-cli` and not installed directly by users.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Documentation

See the [main README](../../README.md) for full documentation.

## License

MIT
