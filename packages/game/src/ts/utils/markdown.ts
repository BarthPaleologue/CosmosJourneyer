import MarkdownItRenderer from "markdown-it";

const markdownRenderer = new MarkdownItRenderer({
    html: false,
    linkify: false,
    typographer: false,
    breaks: false,
});

markdownRenderer.disable("image");

const defaultLinkOpen = markdownRenderer.renderer.rules["link_open"];
markdownRenderer.renderer.rules["link_open"] = (tokens, index, options, environment, self): string => {
    tokens[index]?.attrSet("target", "_blank");
    tokens[index]?.attrSet("rel", "noopener");

    return defaultLinkOpen?.(tokens, index, options, environment, self) ?? self.renderToken(tokens, index, options);
};

export function renderMarkdownInline(markdown: string): string {
    return markdownRenderer.renderInline(markdown);
}

export function renderMarkdownBlock(markdown: string): string {
    return markdownRenderer.render(markdown);
}

/** Escape Markdown punctuation in values before interpolating them into translated Markdown. */
export function escapeMarkdown(value: string): string {
    return value.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, "\\$&");
}
