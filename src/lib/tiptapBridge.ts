import { sanitizeText, sanitizeUrl } from './validationSchemas';

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  marks?: TiptapMark[];
  text?: string;
  content?: TiptapNode[];
}

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

export function createEmptyTiptapDoc(): TiptapDoc {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}

/**
 * Checks whether a URL is a Base64 data URI (blocked from Tiptap document JSON/Markdown storage).
 */
export function isBase64DataUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^\s*data:/i.test(url);
}

/**
 * Deeply sanitizes a Tiptap JSON document:
 * - Strips inline Base64 image data URIs and unsafe javascript:/vbscript: links
 * - Ensures node structure stays valid
 */
export function sanitizeTiptapDoc(doc: Record<string, any> | undefined | null): TiptapDoc {
  if (!doc || typeof doc !== 'object' || doc.type !== 'doc' || !Array.isArray(doc.content)) {
    return createEmptyTiptapDoc();
  }

  const walkMarks = (marks?: any[]): TiptapMark[] | undefined => {
    if (!Array.isArray(marks)) return undefined;
    const cleaned: TiptapMark[] = [];
    for (const mark of marks) {
      if (!mark || typeof mark !== 'object' || typeof mark.type !== 'string') continue;
      if (mark.type === 'link') {
        const href = sanitizeUrl(String(mark.attrs?.href || ''));
        if (!href || isBase64DataUrl(href)) continue;
        cleaned.push({
          type: 'link',
          attrs: {
            href,
            target: mark.attrs?.target || '_blank',
            rel: mark.attrs?.rel || 'noopener noreferrer',
          },
        });
      } else {
        cleaned.push({
          type: mark.type,
          ...(mark.attrs ? { attrs: mark.attrs } : {}),
        });
      }
    }
    return cleaned.length > 0 ? cleaned : undefined;
  };

  const walkNode = (node: any): TiptapNode | null => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') return null;

    if (node.type === 'text') {
      const text = typeof node.text === 'string' ? node.text : '';
      if (!text) return null;
      const marks = walkMarks(node.marks);
      return {
        type: 'text',
        text,
        ...(marks ? { marks } : {}),
      };
    }

    if (node.type === 'image') {
      const src = sanitizeUrl(String(node.attrs?.src || ''));
      if (!src || isBase64DataUrl(src)) return null;
      return {
        type: 'image',
        attrs: {
          src,
          alt: sanitizeText(String(node.attrs?.alt || ''), 300),
          title: node.attrs?.title ? sanitizeText(String(node.attrs.title), 300) : null,
        },
      };
    }

    const out: TiptapNode = { type: node.type };
    if (node.attrs && typeof node.attrs === 'object') {
      out.attrs = { ...node.attrs };
    }
    if (Array.isArray(node.content)) {
      const children = node.content.map(walkNode).filter(Boolean) as TiptapNode[];
      if (children.length > 0) {
        out.content = children;
      }
    }
    return out;
  };

  const normalizedContent = doc.content.map(walkNode).filter(Boolean) as TiptapNode[];
  return {
    type: 'doc',
    content: normalizedContent.length > 0 ? normalizedContent : [{ type: 'paragraph' }],
  };
}

/**
 * Parses inline markdown syntax (**bold**, *italic*, `code`, ~~strike~~, [label](url))
 * into Tiptap text nodes with marks.
 */
function parseInlineMarkdown(text: string): TiptapNode[] {
  if (!text) return [];
  const tokenRegex =
    /(\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);
  const nodes: TiptapNode[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push({
        type: 'text',
        text: part.slice(2, -2),
        marks: [{ type: 'bold' }],
      });
      continue;
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      nodes.push({
        type: 'text',
        text: part.slice(2, -2),
        marks: [{ type: 'strike' }],
      });
      continue;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push({
        type: 'text',
        text: part.slice(1, -1),
        marks: [{ type: 'italic' }],
      });
      continue;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      nodes.push({
        type: 'text',
        text: part.slice(1, -1),
        marks: [{ type: 'code' }],
      });
      continue;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const safeHref = sanitizeUrl(linkMatch[2]);
      if (safeHref && !isBase64DataUrl(safeHref)) {
        nodes.push({
          type: 'text',
          text: linkMatch[1],
          marks: [
            {
              type: 'link',
              attrs: {
                href: safeHref,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            },
          ],
        });
      } else {
        nodes.push({ type: 'text', text: linkMatch[1] });
      }
      continue;
    }
    nodes.push({ type: 'text', text: part });
  }

  return nodes;
}

/**
 * Converts legacy Markdown article strings into structured Tiptap JSON
 * so older articles open smoothly in RichTextEditor with full formatting preserved.
 */
export function parseMarkdownToTiptapJson(rawMarkdown?: string): TiptapDoc {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') {
    return createEmptyTiptapDoc();
  }

  const trimmed = rawMarkdown.trim();
  if (!trimmed) return createEmptyTiptapDoc();

  // If raw content happens to be stringified Tiptap JSON, sanitize and return directly
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type === 'doc' && Array.isArray(parsed.content)) {
        return sanitizeTiptapDoc(parsed);
      }
    } catch {
      // treat as regular markdown/text
    }
  }

  const lines = trimmed.replace(/\r\n/g, '\n').split('\n');
  const content: TiptapNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const lineTrim = line.trim();

    if (!lineTrim) {
      i += 1;
      continue;
    }

    // 1. Fenced code block ```lang ... ```
    if (lineTrim.startsWith('```')) {
      const language = lineTrim.slice(3).trim() || null;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing ```
      const codeText = codeLines.join('\n');
      content.push({
        type: 'codeBlock',
        ...(language ? { attrs: { language } } : {}),
        ...(codeText ? { content: [{ type: 'text', text: codeText }] } : {}),
      });
      continue;
    }

    // 2. Horizontal Rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(lineTrim)) {
      content.push({ type: 'horizontalRule' });
      i += 1;
      continue;
    }

    // 3. Standalone image line ![alt](src)
    const imageMatch = lineTrim.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (imageMatch) {
      const safeSrc = sanitizeUrl(imageMatch[2]);
      if (safeSrc && !isBase64DataUrl(safeSrc)) {
        content.push({
          type: 'image',
          attrs: {
            src: safeSrc,
            alt: sanitizeText(imageMatch[1] || '', 300),
            title: imageMatch[3] ? sanitizeText(imageMatch[3], 300) : null,
          },
        });
      }
      i += 1;
      continue;
    }

    // 4. Headings (#, ##, ###)
    const headingMatch = lineTrim.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(3, headingMatch[1].length);
      const inline = parseInlineMarkdown(headingMatch[2].trim());
      content.push({
        type: 'heading',
        attrs: { level },
        ...(inline.length > 0 ? { content: inline } : {}),
      });
      i += 1;
      continue;
    }

    // 5. Blockquote lines (> ...)
    if (lineTrim.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const quoteText = quoteLines.join(' ').trim();
      const inline = parseInlineMarkdown(quoteText);
      content.push({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            ...(inline.length > 0 ? { content: inline } : {}),
          },
        ],
      });
      continue;
    }

    // 6. Bullet List (- item or * item)
    if (/^[-*]\s+/.test(lineTrim)) {
      const items: TiptapNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, '');
        const inline = parseInlineMarkdown(itemText);
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              ...(inline.length > 0 ? { content: inline } : {}),
            },
          ],
        });
        i += 1;
      }
      content.push({
        type: 'bulletList',
        content: items,
      });
      continue;
    }

    // 7. Ordered List (1. item)
    if (/^\d+\.\s+/.test(lineTrim)) {
      const items: TiptapNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        const inline = parseInlineMarkdown(itemText);
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              ...(inline.length > 0 ? { content: inline } : {}),
            },
          ],
        });
        i += 1;
      }
      content.push({
        type: 'orderedList',
        content: items,
      });
      continue;
    }

    // 8. Standard Paragraph (collect consecutive non-empty plain lines)
    const paraLines: string[] = [lineTrim];
    i += 1;
    while (i < lines.length) {
      const nextTrim = lines[i].trim();
      if (
        !nextTrim ||
        nextTrim.startsWith('```') ||
        /^#{1,3}\s+/.test(nextTrim) ||
        nextTrim.startsWith('>') ||
        /^[-*]\s+/.test(nextTrim) ||
        /^\d+\.\s+/.test(nextTrim) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(nextTrim) ||
        /^!\[([^\]]*)\]\(([^)]+)\)$/.test(nextTrim)
      ) {
        break;
      }
      paraLines.push(nextTrim);
      i += 1;
    }
    const inline = parseInlineMarkdown(paraLines.join(' '));
    content.push({
      type: 'paragraph',
      ...(inline.length > 0 ? { content: inline } : {}),
    });
  }

  return content.length > 0 ? { type: 'doc', content } : createEmptyTiptapDoc();
}

function serializeInlineNodes(nodes?: TiptapNode[]): string {
  if (!Array.isArray(nodes) || nodes.length === 0) return '';
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '\n';
      if (node.type !== 'text') return serializeInlineNodes(node.content);
      let text = node.text || '';
      const marks = node.marks || [];
      for (const mark of marks) {
        if (mark.type === 'code') {
          text = `\`${text}\``;
        } else if (mark.type === 'bold') {
          text = `**${text}**`;
        } else if (mark.type === 'italic') {
          text = `*${text}*`;
        } else if (mark.type === 'strike') {
          text = `~~${text}~~`;
        } else if (mark.type === 'link' && mark.attrs?.href) {
          text = `[${text}](${mark.attrs.href})`;
        }
      }
      return text;
    })
    .join('');
}

/**
 * Serializes a Tiptap JSON document back into clean Markdown compatible with
 * the existing public article reader, search indexing, and word-count helpers.
 */
export function serializeTiptapJsonToMarkdown(doc: Record<string, any> | undefined | null): string {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.content)) {
    return '';
  }

  const blocks: string[] = [];

  for (const node of doc.content as TiptapNode[]) {
    if (!node || typeof node !== 'object') continue;

    if (node.type === 'heading') {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.level || 2)));
      const text = serializeInlineNodes(node.content).trim();
      if (text) blocks.push(`${'#'.repeat(level)} ${text}`);
      continue;
    }

    if (node.type === 'paragraph') {
      const text = serializeInlineNodes(node.content).trim();
      if (text) blocks.push(text);
      continue;
    }

    if (node.type === 'blockquote') {
      const inner = (node.content || [])
        .map((child) => serializeInlineNodes(child.content).trim())
        .filter(Boolean)
        .join(' ');
      if (inner) blocks.push(`> ${inner}`);
      continue;
    }

    if (node.type === 'bulletList') {
      const lines = (node.content || [])
        .map((item) => {
          const text = (item.content || [])
            .map((child) => serializeInlineNodes(child.content).trim())
            .filter(Boolean)
            .join(' ');
          return text ? `- ${text}` : '';
        })
        .filter(Boolean);
      if (lines.length > 0) blocks.push(lines.join('\n'));
      continue;
    }

    if (node.type === 'orderedList') {
      const lines = (node.content || [])
        .map((item, idx) => {
          const text = (item.content || [])
            .map((child) => serializeInlineNodes(child.content).trim())
            .filter(Boolean)
            .join(' ');
          return text ? `${idx + 1}. ${text}` : '';
        })
        .filter(Boolean);
      if (lines.length > 0) blocks.push(lines.join('\n'));
      continue;
    }

    if (node.type === 'codeBlock') {
      const lang = node.attrs?.language || '';
      const code = (node.content || []).map((c) => c.text || '').join('');
      blocks.push(`\`\`\`${lang}\n${code}\n\`\`\``);
      continue;
    }

    if (node.type === 'horizontalRule') {
      blocks.push('---');
      continue;
    }

    if (node.type === 'image' && node.attrs?.src && !isBase64DataUrl(node.attrs.src)) {
      const alt = String(node.attrs.alt || 'Article Image').replace(/[\[\]]/g, '');
      blocks.push(`![${alt}](${node.attrs.src})`);
      continue;
    }
  }

  return blocks.join('\n\n').trim();
}

/**
 * Resolves the active Tiptap document from either stored contentJson or legacy Markdown.
 */
export function resolveArticleTiptapDoc(
  contentJson?: Record<string, any>,
  fallbackMarkdown?: string
): TiptapDoc {
  if (
    contentJson &&
    typeof contentJson === 'object' &&
    contentJson.type === 'doc' &&
    Array.isArray(contentJson.content) &&
    contentJson.content.length > 0
  ) {
    return sanitizeTiptapDoc(contentJson);
  }
  return parseMarkdownToTiptapJson(fallbackMarkdown);
}
