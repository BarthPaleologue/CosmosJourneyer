/**
 * Yields until the next animation frame so pending UI updates can render.
 */
export async function waitForNextPaint(): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}

/**
 * Extracts a readable packing error, with a fallback for unrecognized values.
 * @param error - Failure value to display.
 * @returns The readable error message.
 */
export function formatError(error: unknown): string {
    if (typeof error === "string") {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Channel packing failed. Check the selected files and try again.";
}

/**
 * Escapes text for insertion into HTML markup.
 * @param value - Raw text to escape.
 * @returns The escaped text.
 */
export function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * Starts a browser download and releases its temporary object URL shortly afterward.
 * @param blob - Payload to download.
 * @param fileName - Download filename.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}
