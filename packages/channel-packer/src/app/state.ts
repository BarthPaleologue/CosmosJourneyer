import type { AppState, ChannelRowState, ColorChannel, PackRequest, PreviewResponse, PreviewState } from "../types";
import { ChannelOrder, DefaultFills } from "./constants";

/**
 * @returns A new session with default channel fills and no assigned inputs.
 */
export function createInitialState(): AppState {
    return {
        rows: {
            r: createInitialRow("r"),
            g: createInitialRow("g"),
            b: createInitialRow("b"),
            a: createInitialRow("a"),
        },
        filesByKey: new Map<string, File>(),
        preview: createEmptyPreviewState(),
        statusMessage: "Select or drop textures onto the output rows to build a packed texture.",
        statusTone: "default",
        hoveredDropTarget: null,
        isBusy: false,
        busyLabel: null,
    };
}

/**
 * @param outputChannel - Destination RGBA channel.
 * @returns An unassigned row using the destination channel as its source.
 */
export function createInitialRow(outputChannel: ColorChannel): ChannelRowState {
    return {
        outputChannel,
        inputKey: null,
        inputFileName: null,
        sourceChannel: outputChannel,
        constantFill: DefaultFills[outputChannel],
    };
}

/**
 * @returns A preview with no pixel data or dimensions.
 */
export function createEmptyPreviewState(): PreviewState {
    return {
        pixelBytes: null,
        width: null,
        height: null,
        previewWidth: null,
        previewHeight: null,
        activeInputs: 0,
    };
}

/**
 * @param file - Selected source file.
 * @returns A key derived from file name, size, modification time, and media type.
 */
export function createFileKey(file: File): string {
    return `${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

/**
 * Snapshots the current channel routing and constant fills into a packing request.
 * @param state - Session state to snapshot.
 * @returns The current routing request.
 */
export function buildPackRequest(state: AppState): PackRequest {
    const red = state.rows.r;
    const green = state.rows.g;
    const blue = state.rows.b;
    const alpha = state.rows.a;

    const rows: PackRequest["rows"] = [
        {
            outputChannel: red.outputChannel,
            inputKey: red.inputKey,
            sourceChannel: red.sourceChannel,
            constantFill: red.constantFill,
        },
        {
            outputChannel: green.outputChannel,
            inputKey: green.inputKey,
            sourceChannel: green.sourceChannel,
            constantFill: green.constantFill,
        },
        {
            outputChannel: blue.outputChannel,
            inputKey: blue.inputKey,
            sourceChannel: blue.sourceChannel,
            constantFill: blue.constantFill,
        },
        {
            outputChannel: alpha.outputChannel,
            inputKey: alpha.inputKey,
            sourceChannel: alpha.sourceChannel,
            constantFill: alpha.constantFill,
        },
    ];

    return { rows };
}

/**
 * @param state - Session whose assigned rows are counted.
 * @returns The number of assigned output rows.
 */
export function getAssignedInputCount(state: AppState): number {
    return ChannelOrder.filter((channel) => state.rows[channel].inputKey !== null).length;
}

/**
 * @param state - Session state to check.
 * @returns Whether a preview exists and the session is idle.
 */
export function canSave(state: AppState): boolean {
    return state.preview.pixelBytes !== null && !state.isBusy;
}

/**
 * @param preview - Preview data whose dimensions are displayed.
 * @returns Dimensions in pixels, or `No preview` when dimensions are unavailable.
 */
export function formatDimensions(preview: PreviewState): string {
    if (preview.width === null || preview.height === null) {
        return "No preview";
    }

    return `${preview.width} x ${preview.height}`;
}

/**
 * Replaces the session preview with the latest packed pixel data and dimensions.
 * @param state - Session whose preview is replaced.
 * @param response - Latest packed pixels and dimensions.
 */
export function applyPreviewResponse(state: AppState, response: PreviewResponse): void {
    state.preview = {
        pixelBytes: response.pixelBytes,
        width: response.width,
        height: response.height,
        previewWidth: response.previewWidth,
        previewHeight: response.previewHeight,
        activeInputs: response.activeInputs,
    };
}

/**
 * Removes the current preview data from the session.
 * @param state - Session whose preview is cleared.
 */
export function clearPreview(state: AppState): void {
    state.preview = createEmptyPreviewState();
}

/**
 * Releases a selected file only when no output row still references it.
 * @param state - Session containing the rows and file map.
 * @param key - Input cache key.
 */
export function releaseFileKeyIfUnused(state: AppState, key: string): void {
    for (const channel of ChannelOrder) {
        if (state.rows[channel].inputKey === key) {
            return;
        }
    }

    state.filesByKey.delete(key);
}
