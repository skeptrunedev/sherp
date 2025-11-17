import { marked } from 'marked';
import type { SlideDirectives } from './remarkSplitSlides';

export function parseSlides(
  content: string
): Array<{ content: string; directives: SlideDirectives }> {
  const slides: Array<{ content: string; directives: SlideDirectives }> = [];

  const parts = content.split(/\n---\n/);

  let inheritedDirectives: SlideDirectives = {};

  for (const part of parts) {
    const slideDirectives: SlideDirectives = { ...inheritedDirectives };
    let slideContent = part;

    const commentRegex = /<!--\s*([\s\S]*?)\s*-->/g;
    let match;

    while ((match = commentRegex.exec(part)) !== null) {
      const commentContent = match[1].trim();
      const directives = parseDirectiveComment(commentContent);

      Object.assign(slideDirectives, directives);

      slideContent = slideContent.replace(match[0], '');
    }

    inheritedDirectives = { ...slideDirectives };
    for (const key of Object.keys(inheritedDirectives)) {
      if (key.startsWith('_')) {
        delete inheritedDirectives[key as keyof SlideDirectives];
      }
    }

    const htmlContent = marked.parse(slideContent.trim(), {
      async: false,
    }) as string;

    slides.push({
      content: htmlContent,
      directives: slideDirectives,
    });
  }

  return slides;
}

function parseDirectiveComment(content: string): SlideDirectives {
  const directives: SlideDirectives = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*(_?[a-zA-Z]+)\s*:\s*(.+?)\s*$/);
    if (match) {
      const [, key, value] = match;
      let parsedValue: string | boolean = value.trim();

      if (
        (parsedValue.startsWith('"') && parsedValue.endsWith('"')) ||
        (parsedValue.startsWith("'") && parsedValue.endsWith("'"))
      ) {
        parsedValue = parsedValue.slice(1, -1);
      }

      if (parsedValue === 'true') parsedValue = true;
      else if (parsedValue === 'false') parsedValue = false;

      directives[key as keyof SlideDirectives] = parsedValue as never;
    }
  }

  return directives;
}

export function getSlideStyles(directives: SlideDirectives): string {
  const styles: string[] = [];

  const effectiveDirectives = { ...directives };

  for (const [key, value] of Object.entries(directives)) {
    if (key.startsWith('_')) {
      const baseKey = key.slice(1) as keyof SlideDirectives;
      effectiveDirectives[baseKey] = value as never;
    }
  }

  if (effectiveDirectives.backgroundColor) {
    styles.push(`background-color: ${effectiveDirectives.backgroundColor}`);
  }

  if (effectiveDirectives.backgroundImage) {
    styles.push(`background-image: ${effectiveDirectives.backgroundImage}`);
  }

  if (effectiveDirectives.backgroundPosition) {
    styles.push(
      `background-position: ${effectiveDirectives.backgroundPosition}`
    );
  }

  if (effectiveDirectives.backgroundRepeat) {
    styles.push(`background-repeat: ${effectiveDirectives.backgroundRepeat}`);
  }

  if (effectiveDirectives.backgroundSize) {
    styles.push(`background-size: ${effectiveDirectives.backgroundSize}`);
  }

  if (effectiveDirectives.color) {
    styles.push(`color: ${effectiveDirectives.color}`);
  }

  return styles.join('; ');
}

export function getEffectiveDirective<K extends keyof SlideDirectives>(
  directives: SlideDirectives,
  key: K
): SlideDirectives[K] | undefined {
  const scopedKey = `_${key}` as keyof SlideDirectives;

  if (scopedKey in directives && directives[scopedKey] !== undefined) {
    return directives[scopedKey] as SlideDirectives[K];
  }

  return directives[key];
}
