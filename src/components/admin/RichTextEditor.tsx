import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  ShieldCheck,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  X,
} from 'lucide-react';
import {
  isBase64DataUrl,
  resolveArticleTiptapDoc,
  sanitizeTiptapDoc,
  serializeTiptapJsonToMarkdown,
} from '../../lib/tiptapBridge';
import { countArticleWords, sanitizeUrl } from '../../lib/validationSchemas';

interface RichTextEditorProps {
  valueJson?: Record<string, any>;
  fallbackMarkdown?: string;
  direction: 'rtl' | 'ltr';
  uiLocale: 'ar' | 'en';
  contentLocale: 'ar' | 'en';
  placeholder?: string;
  minHeightClass?: string;
  onChange: (nextJson: Record<string, any>, syncedMarkdown: string) => void;
  onRequestImagePicker: (insertImage: (url: string, alt?: string) => void) => void;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  valueJson,
  fallbackMarkdown,
  direction,
  uiLocale,
  contentLocale,
  placeholder,
  minHeightClass = 'min-h-[380px]',
  onChange,
  onRequestImagePicker,
  onShowToast,
}) => {
  const isUiAr = uiLocale === 'ar';
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState('');
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const [, setToolbarTick] = useState(0);

  const initialDoc = resolveArticleTiptapDoc(valueJson, fallbackMarkdown);
  const lastEmittedSignatureRef = useRef<string>(JSON.stringify(initialDoc));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        isAllowedUri: (url, ctx) => {
          if (!url || isBase64DataUrl(url)) return false;
          if (url.startsWith('/')) return true;
          return ctx.defaultValidate(url);
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Placeholder.configure({
        placeholder:
          placeholder ||
          (contentLocale === 'ar'
            ? 'ابدأ بكتابة محتوى المقال هنا... يمكنك تنسيق العناوين والقوائم وإدراج الصور من مكتبة الوسائط.'
            : 'Start writing your article content here... Format headings, lists, quotes, code blocks, and media.'),
      }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        dir: direction,
        lang: contentLocale,
        class: `tiptap-prose w-full px-5 sm:px-7 py-6 text-[15px] text-slate-900 dark:text-slate-100 ${minHeightClass}`,
      },
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        // Block raw image binary drops/pastes that would become Base64 data URIs
        const hasImageFile = Array.from(clipboard.items || []).some(
          (item) => item.kind === 'file' && item.type.startsWith('image/')
        );
        const pastedHtml = clipboard.getData('text/html') || '';
        const pastedText = clipboard.getData('text/plain') || '';
        if (
          hasImageFile ||
          /src\s*=\s*["']data:image\//i.test(pastedHtml) ||
          /^\s*data:image\//i.test(pastedText)
        ) {
          event.preventDefault();
          onShowToast?.(
            isUiAr
              ? 'يُمنع لصق صور Base64 مباشرة. استخدم زر "إدراج صورة" لاختيار أو رفع صورة من مكتبة الوسائط.'
              : 'Direct Base64 image paste is disabled. Use "Insert Image" to pick or upload from the Media Library.',
            'info'
          );
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0 && Array.from(files).some((f) => f.type.startsWith('image/'))) {
          event.preventDefault();
          onShowToast?.(
            isUiAr
              ? 'لرفع صورة مضغوطة ومُحسّنة، استخدم زر "إدراج صورة" في شريط الأدوات.'
              : 'Use the toolbar "Insert Image" button to pick or upload from the Media Library.',
            'info'
          );
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const rawDoc = instance.getJSON();
      const safeDoc = sanitizeTiptapDoc(rawDoc);
      const signature = JSON.stringify(safeDoc);
      lastEmittedSignatureRef.current = signature;
      const syncedMarkdown = serializeTiptapJsonToMarkdown(safeDoc);
      onChangeRef.current(safeDoc, syncedMarkdown);
      setToolbarTick((t) => t + 1);
    },
    onSelectionUpdate: ({ editor: instance }) => {
      if (instance.isActive('image')) {
        setSelectedImageAlt(String(instance.getAttributes('image')?.alt || ''));
      }
      setToolbarTick((t) => t + 1);
    },
  });

  // Synchronize external value updates (e.g., switching article or restoring snapshot) without disrupting typing
  useEffect(() => {
    if (!editor) return;
    const incomingDoc = resolveArticleTiptapDoc(valueJson, fallbackMarkdown);
    const incomingSig = JSON.stringify(incomingDoc);
    if (incomingSig !== lastEmittedSignatureRef.current) {
      lastEmittedSignatureRef.current = incomingSig;
      editor.commands.setContent(incomingDoc, { emitUpdate: false });
    }
  }, [editor, valueJson, fallbackMarkdown]);

  if (!editor) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070E1A] p-6 text-xs text-slate-400 ${minHeightClass}`}
      >
        {isUiAr ? 'جاري تهيئة المحرر...' : 'Initializing rich text studio...'}
      </div>
    );
  }

  const currentDocJson = sanitizeTiptapDoc(editor.getJSON());
  const wordCount = countArticleWords(undefined, currentDocJson);
  const charCount = editor.getText().trim().length;

  const activeBlockLabel = editor.isActive('heading', { level: 1 })
    ? 'H1'
    : editor.isActive('heading', { level: 2 })
    ? 'H2'
    : editor.isActive('heading', { level: 3 })
    ? 'H3'
    : editor.isActive('blockquote')
    ? isUiAr
      ? 'اقتباس'
      : 'Quote'
    : editor.isActive('codeBlock')
    ? isUiAr
      ? 'كتلة كود'
      : 'Code Block'
    : editor.isActive('bulletList')
    ? isUiAr
      ? 'قائمة نقطية'
      : 'Bullet List'
    : editor.isActive('orderedList')
    ? isUiAr
      ? 'قائمة مرقمة'
      : 'Ordered List'
    : editor.isActive('image')
    ? isUiAr
      ? 'صورة'
      : 'Image'
    : isUiAr
    ? 'فقرة'
    : 'Paragraph';

  const handleOpenLinkPopover = () => {
    const existingHref = String(editor.getAttributes('link')?.href || '');
    setLinkInputUrl(existingHref || 'https://');
    setLinkPopoverOpen((open) => !open);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeUrl(linkInputUrl);
    if (!cleaned || isBase64DataUrl(cleaned)) {
      onShowToast?.(
        isUiAr
          ? 'يرجى إدخال رابط صالح يبدأ بـ https:// أو مسار نسبي /'
          : 'Please enter a valid URL starting with https:// or /',
        'error'
      );
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: cleaned }).run();
    setLinkPopoverOpen(false);
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkInputUrl('');
  };

  const handleInsertImageClick = () => {
    const savedPos = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };

    onRequestImagePicker((selectedUrl, customAlt) => {
      const safeUrl = sanitizeUrl(selectedUrl);
      if (!safeUrl || isBase64DataUrl(safeUrl)) {
        onShowToast?.(
          isUiAr
            ? 'تم رفض رابط الصورة لأنه غير صالح أو بصيغة Base64.'
            : 'Image URL rejected: invalid or Base64 data URI.',
          'error'
        );
        return;
      }
      const fallbackAlt =
        customAlt?.trim() ||
        (contentLocale === 'ar' ? 'صورة توضيحية داخل المقال' : 'Article illustration image');
      const maxDocSize = editor.state.doc.content.size;
      const clampedFrom = Math.min(Math.max(0, savedPos.from), maxDocSize);
      const clampedTo = Math.min(Math.max(clampedFrom, savedPos.to), maxDocSize);

      editor
        .chain()
        .focus()
        .setTextSelection({ from: clampedFrom, to: clampedTo })
        .setImage({ src: safeUrl, alt: fallbackAlt })
        .run();
      onShowToast?.(
        isUiAr ? 'تم إدراج الصورة عند موضع المؤشر بنجاح' : 'Image inserted at cursor position',
        'success'
      );
    });
  };

  const toolbarBtn = (
    active: boolean,
    onClick: () => void,
    title: string,
    icon: React.ReactNode,
    disabled = false
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
        active
          ? 'bg-[#00C2CB] text-slate-950 font-bold shadow-xs'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/75 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070E1A] overflow-visible shadow-sm flex flex-col">
      {/* CUSTOM AHMED SOLIMAN CMS TIPTAP TOOLBAR */}
      <div className="sticky top-0 z-10 px-3 py-2.5 bg-slate-50/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-2xl space-y-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* History */}
          <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200 dark:border-slate-800">
            {toolbarBtn(
              false,
              () => editor.chain().focus().undo().run(),
              isUiAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)',
              <Undo2 className="w-3.5 h-3.5" />,
              !editor.can().undo()
            )}
            {toolbarBtn(
              false,
              () => editor.chain().focus().redo().run(),
              isUiAr ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)',
              <Redo2 className="w-3.5 h-3.5" />,
              !editor.can().redo()
            )}
          </div>

          {/* Headings & Paragraph */}
          <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200 dark:border-slate-800">
            {toolbarBtn(
              editor.isActive('paragraph'),
              () => editor.chain().focus().setParagraph().run(),
              isUiAr ? 'نص عادي' : 'Normal Paragraph',
              <Pilcrow className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('heading', { level: 1 }),
              () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
              isUiAr ? 'عنوان رئيسي H1' : 'Heading 1',
              <Heading1 className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('heading', { level: 2 }),
              () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
              isUiAr ? 'عنوان فرعي H2' : 'Heading 2',
              <Heading2 className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('heading', { level: 3 }),
              () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
              isUiAr ? 'عنوان ثانوي H3' : 'Heading 3',
              <Heading3 className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Text Marks */}
          <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200 dark:border-slate-800">
            {toolbarBtn(
              editor.isActive('bold'),
              () => editor.chain().focus().toggleBold().run(),
              isUiAr ? 'خط عريض' : 'Bold',
              <Bold className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('italic'),
              () => editor.chain().focus().toggleItalic().run(),
              isUiAr ? 'خط مائل' : 'Italic',
              <Italic className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('underline'),
              () => editor.chain().focus().toggleUnderline().run(),
              isUiAr ? 'تسطير' : 'Underline',
              <UnderlineIcon className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('strike'),
              () => editor.chain().focus().toggleStrike().run(),
              isUiAr ? 'يتوسطه خط' : 'Strikethrough',
              <Strikethrough className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('code'),
              () => editor.chain().focus().toggleCode().run(),
              isUiAr ? 'كود سطري' : 'Inline Code',
              <Code className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200 dark:border-slate-800">
            {toolbarBtn(
              editor.isActive({ textAlign: 'right' }),
              () => editor.chain().focus().setTextAlign('right').run(),
              isUiAr ? 'محاذاة لليمين' : 'Align Right',
              <AlignRight className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive({ textAlign: 'center' }),
              () => editor.chain().focus().setTextAlign('center').run(),
              isUiAr ? 'توسيط' : 'Align Center',
              <AlignCenter className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive({ textAlign: 'left' }),
              () => editor.chain().focus().setTextAlign('left').run(),
              isUiAr ? 'محاذاة لليسار' : 'Align Left',
              <AlignLeft className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive({ textAlign: 'justify' }),
              () => editor.chain().focus().setTextAlign('justify').run(),
              isUiAr ? 'ضبط النص' : 'Justify',
              <AlignJustify className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Lists & Blocks */}
          <div className="flex items-center gap-0.5 pe-2 border-e border-slate-200 dark:border-slate-800">
            {toolbarBtn(
              editor.isActive('bulletList'),
              () => editor.chain().focus().toggleBulletList().run(),
              isUiAr ? 'قائمة نقطية' : 'Bullet List',
              <List className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('orderedList'),
              () => editor.chain().focus().toggleOrderedList().run(),
              isUiAr ? 'قائمة مرقمة' : 'Ordered List',
              <ListOrdered className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('blockquote'),
              () => editor.chain().focus().toggleBlockquote().run(),
              isUiAr ? 'اقتباس' : 'Blockquote',
              <Quote className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              editor.isActive('codeBlock'),
              () => editor.chain().focus().toggleCodeBlock().run(),
              isUiAr ? 'كتلة كود برمجي' : 'Code Block',
              <Code2 className="w-3.5 h-3.5" />
            )}
            {toolbarBtn(
              false,
              () => editor.chain().focus().setHorizontalRule().run(),
              isUiAr ? 'فاصل أفقي' : 'Horizontal Rule',
              <Minus className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Link & Media Insert + Clear */}
          <div className="flex items-center gap-1">
            {toolbarBtn(
              editor.isActive('link') || linkPopoverOpen,
              handleOpenLinkPopover,
              isUiAr ? 'إدراج أو تعديل رابط' : 'Insert / Edit Link',
              <Link2 className="w-3.5 h-3.5" />
            )}
            {editor.isActive('link') &&
              toolbarBtn(
                false,
                handleRemoveLink,
                isUiAr ? 'إزالة الرابط' : 'Remove Link',
                <Unlink className="w-3.5 h-3.5" />
              )}

            <button
              type="button"
              onClick={handleInsertImageClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00C2CB]/15 text-[#0099A3] dark:text-[#00C2CB] hover:bg-[#00C2CB] hover:text-slate-950 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title={
                isUiAr
                  ? 'إدراج صورة من مكتبة الوسائط عند موضع المؤشر'
                  : 'Insert image from Media Library at cursor'
              }
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>{isUiAr ? 'إدراج صورة' : 'Image'}</span>
            </button>

            {toolbarBtn(
              false,
              () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
              isUiAr ? 'مسح التنسيق' : 'Clear Formatting',
              <RemoveFormatting className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Inline Link Input Popover */}
        {linkPopoverOpen && (
          <form
            onSubmit={handleApplyLink}
            className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#070E1A] border border-[#00C2CB]/40"
          >
            <Link2 className="w-3.5 h-3.5 text-[#00C2CB] shrink-0" />
            <input
              type="text"
              dir="ltr"
              value={linkInputUrl}
              onChange={(e) => setLinkInputUrl(e.target.value)}
              placeholder="https://example.com or /ar/projects"
              className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs font-mono-tabular"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00C2CB] text-slate-950 text-[11px] font-bold cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{isUiAr ? 'تطبيق' : 'Apply'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLinkPopoverOpen(false)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
              aria-label={isUiAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Selected Image Alt Text Quick Editor */}
        {editor.isActive('image') && (
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px]">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {isUiAr ? 'وصف الصورة المحددة (Alt):' : 'Selected Image Alt:'}
            </span>
            <input
              type="text"
              dir={direction}
              value={selectedImageAlt}
              onChange={(e) => {
                const nextAlt = e.target.value;
                setSelectedImageAlt(nextAlt);
                editor.chain().updateAttributes('image', { alt: nextAlt }).run();
              }}
              placeholder={
                isUiAr ? 'أدخل وصف الصورة لتحسين SEO...' : 'Describe image for SEO...'
              }
              className="flex-1 min-w-[180px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#070E1A] border border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>
        )}
      </div>

      {/* TIPTAP EDITING CANVAS */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* STUDIO FOOTER METRICS */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-[#0B1222] border-t border-slate-200 dark:border-slate-800 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 uppercase">
            {direction.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#00C2CB]/10 text-[#0099A3] dark:text-[#00C2CB] font-semibold">
            {activeBlockLabel}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isUiAr ? 'حماية Base64 نشطة' : 'Media-only URLs'}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono-tabular">
          <span>
            {wordCount} {isUiAr ? 'كلمة' : 'words'}
          </span>
          <span>·</span>
          <span>
            {charCount} {isUiAr ? 'حرف' : 'chars'}
          </span>
        </div>
      </div>
    </div>
  );
};
