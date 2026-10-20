import MarkdownItRenderer from "markdown-it";

const markdownRenderer = new MarkdownItRenderer({
    html: false,
    linkify: true,
    typographer: false,
    breaks: false,
});

markdownRenderer.linkify.set({
    fuzzyLink: false,
    fuzzyEmail: true,
});

markdownRenderer.disable("image");

const defaultLinkOpen = markdownRenderer.renderer.rules["link_open"];
markdownRenderer.renderer.rules["link_open"] = (tokens, index, options, environment, self): string => {
    tokens[index]?.attrSet("target", "_blank");
    tokens[index]?.attrSet("rel", "noopener");

    return defaultLinkOpen?.(tokens, index, options, environment, self) ?? self.renderToken(tokens, index, options);
};

/**
 * Converts inline Markdown to HTML with raw HTML and images disabled.
 * @param markdown - Inline Markdown source to render.
 * @returns Rendered HTML fragment without paragraph wrappers.
 */
export function renderMarkdownInline(markdown: string): string {
    return markdownRenderer.renderInline(markdown);
}

/**
 * Converts block Markdown to HTML with raw HTML and images disabled.
 * @param markdown - Block Markdown source to render.
 * @returns Rendered HTML, including block-level markup such as paragraphs.
 */
export function renderMarkdownBlock(markdown: string): string {
    return markdownRenderer.render(markdown);
}

/**
 * Escape Markdown punctuation in values before interpolating them into translated Markdown.
 * @param value - Plain text value that will be inserted into Markdown syntax.
 * @returns The input with Markdown punctuation escaped by backslashes.
 */
export function escapeMarkdown(value: string): string {
    return value.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, "\\$&");
}
