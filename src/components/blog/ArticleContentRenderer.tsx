import React from 'react';
import { Locale } from '../../types/cms';
import { sanitizeUrl } from '../../lib/validationSchemas';
import {
  TiptapMark,
  TiptapNode,
  isBase64DataUrl,
  resolveArticleTiptapDoc,
} from '../../lib/tiptapBridge';
import { OptimizedImage } from '../common/OptimizedImage';

interface ArticleContentRendererProps {
  contentJson?: Record<string, any>;
  fallbackMarkdown?: string;
  locale: Locale;
  titleFallback?: string;
}

function getAlignmentClass(align?: string): string {
  if (align === 'center') return 'text-center';
  if (align === 'left') return 'text-left';
  if (align === 'right') return 'text-right';
  if (align === 'justify') return 'text-justify';
  return '';
}

function renderInlineMarks(
  text: string,
  marks: TiptapMark[] | undefined,
  key: string
): React.ReactNode {
  if (!marks || marks.length === 0) {
    return <React.Fragment key={key}>{text}</React.Fragment>;
  }

  let el: React.ReactNode = text;

  for (const mark of marks) {
    if (!mark || !mark.type) continue;
    if (mark.type === 'code') {
      el = (
        <code
          dir="ltr"
          className="px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-emerald-300 font-mono text-[0.86em]"
        >
          {el}
        </code>
      );
    } else if (mark.type === 'bold') {
      el = (
        <strong className="font-extrabold text-stone-950 dark:text-[#F5F3EE]">
          {el}
        </strong>
      );
    } else if (mark.type === 'italic') {
      el = <em className="italic">{el}</em>;
    } else if (mark.type === 'underline') {
      el = (
        <u className="underline underline-offset-4 decoration-stone-400 dark:decoration-stone-500">
          {el}
        </u>
      );
    } else if (mark.type === 'strike') {
      el = <s className="line-through opacity-75">{el}</s>;
    } else if (mark.type === 'link') {
      const safeHref = sanitizeUrl(String(mark.attrs?.href || ''));
      if (safeHref && !isBase64DataUrl(safeHref)) {
        const isExternal = /^https?:\/\//i.test(safeHref);
        el = (
          <a
            href={safeHref}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="font-semibold text-[#16382E] dark:text-[#6EE7B7] underline decoration-emerald-700/50 dark:decoration-emerald-400/50 underline-offset-4 hover:opacity-80 transition-opacity"
          >
            {el}
          </a>
        );
      }
    }
  }

  return <React.Fragment key={key}>{el}</React.Fragment>;
}

function renderInlineChildren(
  children: TiptapNode[] | undefined,
  keyPrefix: string
): React.ReactNode[] {
  if (!Array.isArray(children) || children.length === 0) return [];
  return children.map((child, idx) => {
    const childKey = `${keyPrefix}-${idx}`;
    if (child.type === 'hardBreak') {
      return <br key={childKey} />;
    }
    if (child.type === 'text') {
      return renderInlineMarks(child.text || '', child.marks, childKey);
    }
    if (Array.isArray(child.content)) {
      return (
        <React.Fragment key={childKey}>
          {renderInlineChildren(child.content, childKey)}
        </React.Fragment>
      );
    }
    return null;
  });
}

function renderBlockNode(
  node: TiptapNode,
  idx: number,
  locale: Locale,
  titleFallback?: string
): React.ReactNode {
  const key = `node-${idx}`;
  const alignClass = getAlignmentClass(node.attrs?.textAlign);

  if (node.type === 'heading') {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level || 2)));
    const children = renderInlineChildren(node.content, key);
    if (level === 1) {
      return (
        <h2
          key={key}
          className={`text-2xl sm:text-3xl font-black text-stone-950 dark:text-[#F5F3EE] pt-6 pb-2 leading-tight ${alignClass}`}
        >
          {children}
        </h2>
      );
    }
    if (level === 2) {
      return (
        <h2
          key={key}
          className={`text-xl sm:text-2xl font-black text-stone-950 dark:text-[#F5F3EE] pt-6 border-b border-stone-300/70 dark:border-stone-800 pb-2.5 leading-snug ${alignClass}`}
        >
          {children}
        </h2>
      );
    }
    return (
      <h3
        key={key}
        className={`text-lg sm:text-xl font-extrabold text-[#16382E] dark:text-[#6EE7B7] pt-3 leading-snug ${alignClass}`}
      >
        {children}
      </h3>
    );
  }

  if (node.type === 'paragraph') {
    const children = renderInlineChildren(node.content, key);
    if (children.length === 0) return null;
    return (
      <p key={key} className={`leading-[1.9] ${alignClass}`}>
        {children}
      </p>
    );
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    const ListTag = node.type === 'orderedList' ? 'ol' : 'ul';
    return (
      <ListTag
        key={key}
        className={`space-y-2.5 ps-5 text-stone-700 dark:text-stone-200 ${
          ListTag === 'ol' ? 'list-decimal' : 'list-disc'
        }`}
      >
        {(node.content || []).map((item, itemIdx) => (
          <li key={`${key}-li-${itemIdx}`} className="leading-[1.85]">
            {(item.content || []).map((inner, innerIdx) => {
              if (inner.type === 'paragraph') {
                return (
                  <React.Fragment key={`${key}-li-${itemIdx}-p-${innerIdx}`}>
                    {renderInlineChildren(
                      inner.content,
                      `${key}-li-${itemIdx}-p-${innerIdx}`
                    )}
                  </React.Fragment>
                );
              }
              return renderBlockNode(inner, innerIdx, locale, titleFallback);
            })}
          </li>
        ))}
      </ListTag>
    );
  }

  if (node.type === 'blockquote') {
    return (
      <blockquote
        key={key}
        className="my-6 py-5 px-6 rounded-2xl bg-white/85 dark:bg-[#171B1A] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 italic text-base sm:text-lg leading-relaxed space-y-2"
      >
        {(node.content || []).map((child, childIdx) =>
          child.type === 'paragraph' ? (
            <p key={`${key}-bq-${childIdx}`}>
              {renderInlineChildren(child.content, `${key}-bq-${childIdx}`)}
            </p>
          ) : (
            renderBlockNode(child, childIdx, locale, titleFallback)
          )
        )}
      </blockquote>
    );
  }

  if (node.type === 'codeBlock') {
    const language = node.attrs?.language ? String(node.attrs.language) : '';
    const codeText = (node.content || []).map((c) => c.text || '').join('');
    return (
      <div
        key={key}
        dir="ltr"
        className="my-6 rounded-2xl overflow-hidden border border-stone-300/80 dark:border-stone-800 bg-[#0B1220] text-slate-100"
      >
        {language && (
          <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] font-mono-tabular uppercase tracking-wider text-emerald-400 font-bold">
            {language}
          </div>
        )}
        <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed">
          <code>{codeText}</code>
        </pre>
      </div>
    );
  }

  if (node.type === 'horizontalRule') {
    return (
      <hr
        key={key}
        className="my-8 border-t border-stone-300/80 dark:border-stone-800"
      />
    );
  }

  if (node.type === 'image') {
    const safeSrc = sanitizeUrl(String(node.attrs?.src || ''));
    if (!safeSrc || isBase64DataUrl(safeSrc)) return null;
    const altText =
      String(node.attrs?.alt || '').trim() ||
      titleFallback ||
      (locale === 'ar' ? 'صورة توضيحية' : 'Article figure');
    const explicitCaption = String(node.attrs?.alt || '').trim();

    return (
      <figure
        key={key}
        className="my-8 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#171B1A]"
      >
        <div className="max-h-[480px] overflow-hidden bg-stone-900">
          <OptimizedImage
            src={safeSrc}
            alt={altText}
            width={1200}
            containerClassName="w-full h-full"
            className="w-full h-auto max-h-[480px] object-cover"
          />
        </div>
        {explicitCaption && (
          <figcaption className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400 text-center border-t border-stone-100 dark:border-stone-800">
            {explicitCaption}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
}

/**
 * Safely renders Tiptap JSON (and seamlessly upgrades legacy Markdown articles)
 * as pure sanitized React JSX nodes with zero innerHTML XSS exposure.
 */
export const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({
  contentJson,
  fallbackMarkdown,
  locale,
  titleFallback,
}) => {
  const safeDoc = resolveArticleTiptapDoc(contentJson, fallbackMarkdown);

  return (
    <div className="space-y-6">
      {(safeDoc.content || []).map((node, idx) =>
        renderBlockNode(node, idx, locale, titleFallback)
      )}
    </div>
  );
};
