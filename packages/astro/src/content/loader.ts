import { glob } from 'astro/loaders';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates a custom loader that reads presentations from a directory
 * specified by the VITE_PRESENTATIONS_DIR environment variable.
 *
 * Falls back to the default 'src/content/presentations' if not set.
 */
export function presentationsLoader() {
  const presentationsDir = import.meta.env.VITE_PRESENTATIONS_DIR || process.env.VITE_PRESENTATIONS_DIR;

  if (!presentationsDir) {
    console.warn('[presentations-loader] VITE_PRESENTATIONS_DIR not set, using default location');
    // Use default Astro content collection path
    return glob({
      pattern: '**/*.{md,mdx}',
      base: path.resolve(__dirname, './presentations')
    });
  }

  // Resolve the path relative to the astro package root
  const resolvedPath = path.resolve(__dirname, '../..', presentationsDir);

  console.log(`[presentations-loader] Loading presentations from: ${resolvedPath}`);

  return glob({
    pattern: '**/*.{md,mdx}',
    base: resolvedPath
  });
}
