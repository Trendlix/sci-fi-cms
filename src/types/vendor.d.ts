declare module "reactjs-tiptap-editor" {
    import type { ComponentType } from "react";

    type Extension = unknown;
    type ConfigurableExtension = { configure: (...args: unknown[]) => Extension };

    const RichTextEditor: ComponentType<Record<string, unknown>>;
    export const BaseKit: ConfigurableExtension;
    export default RichTextEditor;
}

declare module "reactjs-tiptap-editor/italic" {
    export const Italic: unknown;
}

declare module "reactjs-tiptap-editor/textunderline" {
    export const TextUnderline: unknown;
}

declare module "reactjs-tiptap-editor/bold" {
    export const Bold: unknown;
}

declare module "reactjs-tiptap-editor/color" {
    export const Color: unknown;
}

declare module "reactjs-tiptap-editor/highlight" {
    export const Highlight: unknown;
}

declare module "reactjs-tiptap-editor/fontsize" {
    export const FontSize: unknown;
}

declare module "reactjs-tiptap-editor/fontfamily" {
    export const FontFamily: unknown;
}

declare module "reactjs-tiptap-editor/formatpainter" {
    export const FormatPainter: unknown;
}

declare module "reactjs-tiptap-editor/textalign" {
    export const TextAlign: unknown;
}

declare module "reactjs-tiptap-editor/lineheight" {
    export const LineHeight: unknown;
}

declare module "reactjs-tiptap-editor/indent" {
    export const Indent: unknown;
}

declare module "reactjs-tiptap-editor/heading" {
    export const Heading: unknown;
}

declare module "reactjs-tiptap-editor/blockquote" {
    export const Blockquote: unknown;
}

declare module "reactjs-tiptap-editor/horizontalrule" {
    export const HorizontalRule: unknown;
}

declare module "reactjs-tiptap-editor/listitem" {
    export const ListItem: unknown;
}

declare module "reactjs-tiptap-editor/bulletlist" {
    export const BulletList: unknown;
}

declare module "reactjs-tiptap-editor/orderedlist" {
    export const OrderedList: unknown;
}

declare module "reactjs-tiptap-editor/tableofcontent" {
    export const TableOfContents: unknown;
}

declare module "reactjs-tiptap-editor/clear" {
    export const Clear: unknown;
}

declare module "reactjs-tiptap-editor/link" {
    export const Link: unknown;
}

declare module "reactjs-tiptap-editor/image" {
    export const Image: unknown;
}

declare module "reactjs-tiptap-editor/video" {
    export const Video: unknown;
}

declare module "reactjs-tiptap-editor/iframe" {
    export const Iframe: unknown;
}

declare module "reactjs-tiptap-editor/code" {
    export const Code: unknown;
}

declare module "reactjs-tiptap-editor/codeblock" {
    export const CodeBlock: unknown;
}

declare module "reactjs-tiptap-editor/importword" {
    export const ImportWord: unknown;
}

declare module "reactjs-tiptap-editor/exportword" {
    export const ExportWord: unknown;
}

declare module "reactjs-tiptap-editor/exportpdf" {
    export const ExportPdf: unknown;
}

declare module "reactjs-tiptap-editor/emoji" {
    export const Emoji: unknown;
}

declare module "reactjs-tiptap-editor/searchandreplace" {
    export const SearchAndReplace: unknown;
}

declare module "reactjs-tiptap-editor/history" {
    export const History: unknown;
}

declare module "reactjs-tiptap-editor/document" {
    export const Document: unknown;
}

declare module "@monaco-editor/react" {
    import type { ComponentType } from "react";
    const MonacoEditor: ComponentType<Record<string, unknown>>;
    export default MonacoEditor;
}

declare module "firebase/app" {
    export const initializeApp: (config: Record<string, unknown>) => unknown;
}

declare module "firebase/storage" {
    export const getStorage: (app?: unknown) => unknown;
}

