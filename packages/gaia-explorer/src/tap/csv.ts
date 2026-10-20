import type { DeepReadonly } from "@cosmos-journeyer/typescript";

/**
 * Rejects a CSV input that ended before a quoted field was closed.
 * @param quoted Whether the parser is still inside a quoted field.
 */
function assertClosed(quoted: boolean): void {
    if (quoted) {
        throw new Error("Invalid CSV: unterminated quoted field");
    }
}
/**
 * Parse RFC 4180-style CSV without converting textual values.
 * @param text CSV text whose first row contains column headers.
 * @returns Parsed rows keyed by trimmed header names.
 */
export function parseCsv(text: string): DeepReadonly<Array<Record<string, string>>> {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char ?? "";
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (char !== "\r") {
            field += char ?? "";
        }
    }
    assertClosed(quoted);
    if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    const headers = rows.shift();
    if (headers === undefined) {
        return [];
    }
    return rows
        .filter((values) => values.some((value) => value !== ""))
        .map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}
