import { visit } from 'unist-util-visit';
import type { Root, RootContent, HTML } from 'mdast';

export interface SlideDirectives {
  // Local directives
  paginate?: boolean;
  header?: string;
  footer?: string;
  class?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  color?: string;
  // Scoped directives (prefixed with _)
  _paginate?: boolean;
  _header?: string;
  _footer?: string;
  _class?: string;
  _backgroundColor?: string;
  _backgroundImage?: string;
  _backgroundPosition?: string;
  _backgroundRepeat?: string;
  _backgroundSize?: string;
  _color?: string;
}

export interface Slide {
  content: RootContent[];
  directives: SlideDirectives;
}

function parseHTMLCommentDirectives(htmlContent: string): SlideDirectives {
  const directives: SlideDirectives = {};

  // Match HTML comments that contain directives
  const commentMatch = htmlContent.match(/<!--\s*([\s\S]*?)\s*-->/);
  if (!commentMatch) return directives;

  const content = commentMatch[1].trim();

  // Parse YAML-like key: value pairs
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(_?[a-zA-Z]+)\s*:\s*(.+?)\s*$/);
    if (match) {
      const [, key, value] = match;
      let parsedValue: string | boolean = value.trim();

      // Remove quotes if present
      if ((parsedValue.startsWith('"') && parsedValue.endsWith('"')) ||
          (parsedValue.startsWith("'") && parsedValue.endsWith("'"))) {
        parsedValue = parsedValue.slice(1, -1);
      }

      // Parse boolean values
      if (parsedValue === 'true') parsedValue = true;
      else if (parsedValue === 'false') parsedValue = false;

      directives[key as keyof SlideDirectives] = parsedValue as never;
    }
  }

  return directives;
}

function mergeDirectives(
  inherited: SlideDirectives,
  current: SlideDirectives
): SlideDirectives {
  const merged: SlideDirectives = { ...inherited };

  // Apply scoped directives (prefixed with _) without inheritance
  // Apply regular directives with inheritance
  for (const [key, value] of Object.entries(current)) {
    if (key.startsWith('_')) {
      // Scoped directive - only applies to current slide
      merged[key as keyof SlideDirectives] = value as never;
    } else {
      // Regular directive - applies to current and future slides
      merged[key as keyof SlideDirectives] = value as never;
    }
  }

  return merged;
}

export function remarkSplitSlides() {
  return (tree: Root, file: any) => {
    const slides: Slide[] = [];
    let currentSlide: RootContent[] = [];
    let currentDirectives: SlideDirectives = {};
    let inheritedDirectives: SlideDirectives = {};

    visit(tree, (node, index, parent) => {
      // Check for thematic breaks (---) which split slides
      if (node.type === 'thematicBreak') {
        // Save the current slide
        if (currentSlide.length > 0) {
          slides.push({
            content: currentSlide,
            directives: currentDirectives,
          });

          // Update inherited directives (remove scoped ones)
          inheritedDirectives = { ...currentDirectives };
          for (const key of Object.keys(inheritedDirectives)) {
            if (key.startsWith('_')) {
              delete inheritedDirectives[key as keyof SlideDirectives];
            }
          }
        }

        // Start a new slide
        currentSlide = [];
        currentDirectives = { ...inheritedDirectives };
        return;
      }

      // Check for HTML comments with directives
      if (node.type === 'html') {
        const htmlNode = node as HTML;
        if (htmlNode.value.includes('<!--')) {
          const directives = parseHTMLCommentDirectives(htmlNode.value);
          currentDirectives = mergeDirectives(currentDirectives, directives);
          // Don't include the directive comment in slide content
          return;
        }
      }

      // Add node to current slide
      currentSlide.push(node);
    });

    // Add the last slide
    if (currentSlide.length > 0) {
      slides.push({
        content: currentSlide,
        directives: currentDirectives,
      });
    }

    // Store slides in file data for later use
    file.data.slides = slides;
  };
}
