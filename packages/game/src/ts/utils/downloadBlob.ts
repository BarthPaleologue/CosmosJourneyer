/**
 * Triggers a browser download for a blob using a temporary object URL.
 * @param blob - Content to expose as the downloaded file.
 * @param fileName - Suggested filename shown by the browser's download flow.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}
