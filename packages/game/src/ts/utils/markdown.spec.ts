import { describe, expect, it } from "vitest";

import { renderMarkdownBlock, renderMarkdownInline } from "./markdown";

describe("Markdown renderer", () => {
    it("renders inline emphasis without a wrapping paragraph", () => {
        expect(renderMarkdownInline("This is **important**.")).toBe("This is <strong>important</strong>.");
    });

    it("renders multiple block paragraphs", () => {
        expect(renderMarkdownBlock("First paragraph.\n\nSecond paragraph.")).toBe(
            "<p>First paragraph.</p>\n<p>Second paragraph.</p>\n",
        );
    });

    it("does not interpret raw HTML", () => {
        expect(renderMarkdownInline("<strong>unsafe</strong>")).toBe("&lt;strong&gt;unsafe&lt;/strong&gt;");
    });

    it("linkifies URLs and opens them in a new tab without suppressing the referrer", () => {
        expect(renderMarkdownInline("Visit https://cosmosjourneyer.com")).toBe(
            'Visit <a href="https://cosmosjourneyer.com" target="_blank" rel="noopener">https://cosmosjourneyer.com</a>',
        );
    });

    it("linkifies email addresses", () => {
        expect(renderMarkdownInline("Contact test@example.com")).toBe(
            'Contact <a href="mailto:test@example.com" target="_blank" rel="noopener">test@example.com</a>',
        );
    });

    it("does not linkify domains without a protocol", () => {
        expect(renderMarkdownInline("Visit cosmosjourneyer.com")).toBe("Visit cosmosjourneyer.com");
    });

    it("preserves explicit Markdown links", () => {
        expect(renderMarkdownInline("[documentation](https://example.com/docs)")).toBe(
            '<a href="https://example.com/docs" target="_blank" rel="noopener">documentation</a>',
        );
    });

    it("does not emit dangerous link targets", () => {
        expect(renderMarkdownInline("javascript:alert(1)")).not.toContain("<a");
        expect(renderMarkdownInline("[unsafe](javascript:alert(1))")).not.toContain('href="javascript:');
    });

    it("does not render images", () => {
        expect(renderMarkdownInline("![tracking pixel](https://example.com/pixel.png)")).not.toContain("<img");
    });
});
