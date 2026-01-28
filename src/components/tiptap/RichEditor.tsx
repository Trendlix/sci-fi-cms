import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit } from 'reactjs-tiptap-editor';
import Editor from '@monaco-editor/react';

import { Bold } from 'reactjs-tiptap-editor/bold';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Color } from 'reactjs-tiptap-editor/color';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FormatPainter } from 'reactjs-tiptap-editor/formatpainter';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { LineHeight } from 'reactjs-tiptap-editor/lineheight';
import { Indent } from 'reactjs-tiptap-editor/indent';

import { Heading } from 'reactjs-tiptap-editor/heading';
import { Blockquote } from 'reactjs-tiptap-editor/blockquote';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { ListItem } from 'reactjs-tiptap-editor/listitem';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { TableOfContents } from 'reactjs-tiptap-editor/tableofcontent';
import { Clear } from 'reactjs-tiptap-editor/clear';

import { Image } from 'reactjs-tiptap-editor/image';
import { Video } from 'reactjs-tiptap-editor/video';
import { Iframe } from 'reactjs-tiptap-editor/iframe';

import { Link } from 'reactjs-tiptap-editor/link';

import { Code } from 'reactjs-tiptap-editor/code';
import { CodeBlock } from 'reactjs-tiptap-editor/codeblock';

import { ImportWord } from 'reactjs-tiptap-editor/importword';
import { ExportWord } from 'reactjs-tiptap-editor/exportword';
import { ExportPdf } from 'reactjs-tiptap-editor/exportpdf';

import { Emoji } from 'reactjs-tiptap-editor/emoji';
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace';
import { History } from 'reactjs-tiptap-editor/history';
import { Document } from 'reactjs-tiptap-editor/document';

import 'react-image-crop/dist/ReactCrop.css';
import 'prism-code-editor-lightweight/layout.css';
import 'prism-code-editor-lightweight/themes/github-dark.css';
import 'reactjs-tiptap-editor/style.css';
import { useFirebase } from '@/shared/hooks/firebase/useFirebase';

const TextAlignExtension = TextAlign as { configure: (options: { types: string[] }) => unknown };
const ImageExtension = Image as {
    configure: (options: {
        acceptMimes: string[];
        upload: (file: File) => Promise<string>;
        maxSize: number;
    }) => unknown
};
const VideoExtension = Video as {
    configure: (options: {
        upload: (file: File) => Promise<string>;
    }) => unknown
};

const extensions = [
    BaseKit.configure({
        placeholder: { showOnlyCurrent: true },
        characterCount: { limit: 100_000 },
    }),
    Bold, Italic, TextUnderline, Color, Highlight, FontSize, FontFamily,
    FormatPainter,
    TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
    LineHeight, Indent,
    Heading, Blockquote, HorizontalRule, ListItem, BulletList, OrderedList, TableOfContents, Clear,
    ImageExtension.configure({
        acceptMimes: [
            '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.svgz', '.xbm',
            '.tiff', '.ico', '.jfif', '.heic', '.heif', '.avif', '.bmp',
            '.apng', '.pjpeg'
        ],
        upload: async (file: File): Promise<string> => {
            const { uploadFile } = useFirebase.getState();
            const uploadResult = await uploadFile(file, "rich-editor");
            return uploadResult.url ?? "";
        },
        maxSize: 1024 * 1024 * 5,
    }), VideoExtension.configure({
        upload: async (file: File): Promise<string> => {
            const { uploadFile } = useFirebase.getState();
            const uploadResult = await uploadFile(file, "rich-editor");
            return uploadResult.url ?? "";
        },
    }), Iframe,
    (Link as {
        extend: (options: {
            renderHTML: (props: { HTMLAttributes: Record<string, string> }) => unknown;
        }) => {
            configure: (options: { HTMLAttributes: Record<string, string> }) => unknown;
        };
    }).extend({
        renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
            const attrs = Object.fromEntries(
                Object.entries(HTMLAttributes).filter(([key]) => key !== 'rel')
            );
            return ['a', attrs, 0];
        },
    }).configure({
        HTMLAttributes: {
            target: '_blank',
            class: 'link',
        },
    }),
    Code, CodeBlock,
    ImportWord, ExportWord, ExportPdf,
    Emoji, SearchAndReplace, History, Document
];

const RichEditor = ({ name = 'content' }: { name: string }) => {
    const { register, setValue, watch } = useFormContext();
    const [isCode, setIsCode] = useState(false);
    const content = watch(name);

    useEffect(() => {
        register(name);
    }, [register, name]);

    const onChangeContent = (value: string) => {
        setValue(name, value, { shouldValidate: true, shouldDirty: true });
    };

    return (
        <div className='relative'>
            {isCode ? (
                <Editor
                    height="400px"
                    defaultLanguage="html"
                    value={content}
                    onChange={(value?: string) => onChangeContent(value as string)}
                    options={{
                        minimap: { enabled: false },
                        wordWrap: "on",
                        fontSize: 14,
                        lineNumbers: "on"
                    }}
                    theme="vs-dark"
                />
            ) : (
                <RichTextEditor
                    output="html"
                    contentClass="min-h-[270px]"
                    content={content}
                    onChangeContent={onChangeContent}
                    extensions={extensions}
                    dark={true}
                />
            )}
            <div className='absolute -top-7 right-5'>
                <button
                    type='button'
                    onClick={() => setIsCode(!isCode)}
                    className='bg-main-desire py-[0.36rem] px-5 rounded-md rounded-b-none text-xs cursor-pointer hover:bg-main/50 duration-300 transition-colors'
                >
                    {isCode ? 'Switch to text' : 'Switch to code'}
                </button>
            </div>
        </div>
    );
};

export default RichEditor;
