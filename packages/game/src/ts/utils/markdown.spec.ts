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

    it("opens links in a new tab without suppressing the referrer", () => {
        expect(renderMarkdownInline("[Cosmos Journeyer](https://cosmosjourneyer.com)")).toBe(
            '<a href="https://cosmosjourneyer.com" target="_blank" rel="noopener">Cosmos Journeyer</a>',
        );
    });

    it("does not emit dangerous link targets", () => {
        expect(renderMarkdownInline("[unsafe](javascript:alert(1))")).not.toContain('href="javascript:');
    });

    it("does not render images", () => {
        expect(renderMarkdownInline("![tracking pixel](https://example.com/pixel.png)")).not.toContain("<img");
    });
});
