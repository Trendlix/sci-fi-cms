import { useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit } from 'reactjs-tiptap-editor';

import { Bold } from 'reactjs-tiptap-editor/bold';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';

import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Clear } from 'reactjs-tiptap-editor/clear';


import { Link } from 'reactjs-tiptap-editor/link';



import { Emoji } from 'reactjs-tiptap-editor/emoji';
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace';

import 'react-image-crop/dist/ReactCrop.css';
import 'prism-code-editor-lightweight/layout.css';
import 'prism-code-editor-lightweight/themes/github-dark.css';
import 'reactjs-tiptap-editor/style.css';

const LinkExtension = Link as {
    extend: (options: { renderHTML: (args: { HTMLAttributes: Record<string, string> }) => unknown }) => unknown;
};

const extensions = [
    BaseKit.configure({
        placeholder: { showOnlyCurrent: true },
        characterCount: { limit: 10_000 },
    }),
    Bold, Italic, TextUnderline,
    BulletList, OrderedList, Clear,
    LinkExtension.extend({
        renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
            const attrs = Object.fromEntries(
                Object.entries(HTMLAttributes).filter(([key]) => key !== 'rel')
            );
            return ['a', attrs, 0];
        },
    }),
    Emoji, SearchAndReplace
];

const hashString = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
};

const BasicRichEditor = ({
    name = 'content',
    value,
    onChange,
}: {
    name: string;
    value?: string;
    onChange?: (value: string) => void;
}) => {
    const { register, setValue, watch, formState, getFieldState } = useFormContext();
    const watchedContent = watch(name);
    const content = value ?? watchedContent;
    const { isDirty } = getFieldState(name, formState);
    const editorKeyRef = useRef(`basic-editor-${name}`);
    const editorKey = useMemo(() => {
        if (isDirty) {
            return editorKeyRef.current;
        }
        const safeContent = content ?? "";
        const nextKey = `basic-editor-clean-${name}-${safeContent.length}-${hashString(safeContent)}`;
        editorKeyRef.current = nextKey;
        return nextKey;
    }, [content, isDirty, name]);

    useEffect(() => {
        register(name);
    }, [register, name]);

    const onChangeContent = (value: string) => {
        const trimmedValue = value.trim();
        const resolvedValue = trimmedValue === "<p></p>" ? "" : value;
        setValue(name, resolvedValue, { shouldValidate: true, shouldDirty: true });
        onChange?.(resolvedValue);
    };

    const fieldContainerClass = 'relative rounded-md border border-white/20 bg-white/5 text-white focus-within:border-white/40';
    const editorContentClass = 'min-h-24 px-3 py-2 text-white placeholder:text-white/40';

    return (
        <div className={fieldContainerClass}>
            <RichTextEditor
                key={editorKey}
                output="html"
                contentClass={editorContentClass}
                content={content ?? ""}
                onChangeContent={onChangeContent}
                extensions={extensions}
                dark={true}
            />
            {/* <div className='absolute -top-7 right-5'>
                <button
                    type='button'
                    onClick={() => setIsCode(!isCode)}
                    className='bg-white/5 border border-white/20 border-b-0 py-[0.36rem] px-5 rounded-md rounded-b-none text-xs cursor-pointer text-white hover:bg-white/10 duration-300 transition-colors'
                >
                    {isCode ? 'Switch to text' : 'Switch to code'}
                </button>
            </div> */}
        </div>
    );
};

export default BasicRichEditor;
