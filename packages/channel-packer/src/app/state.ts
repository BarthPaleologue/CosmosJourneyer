import type { AppState, ChannelRowState, ColorChannel, PackRequest, PreviewResponse, PreviewState } from "../types";
import { ChannelOrder, DefaultFills } from "./constants";

let nextFileKeyId = 0;

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

export function createInitialRow(outputChannel: ColorChannel): ChannelRowState {
    return {
        outputChannel,
        inputKey: null,
        inputFileName: null,
        sourceChannel: outputChannel,
        constantFill: DefaultFills[outputChannel],
    };
}

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

export function createFileKey(file: File): string {
    nextFileKeyId += 1;
    return `${nextFileKeyId}:${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

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

export function getAssignedInputCount(state: AppState): number {
    return ChannelOrder.filter((channel) => state.rows[channel].inputKey !== null).length;
}

export function canSave(state: AppState): boolean {
    return state.preview.pixelBytes !== null && !state.isBusy;
}

export function formatDimensions(preview: PreviewState): string {
    if (preview.width === null || preview.height === null) {
        return "No preview";
    }

    return `${preview.width} x ${preview.height}`;
}

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

export function clearPreview(state: AppState): void {
    state.preview = createEmptyPreviewState();
}

export function releaseFileKeyIfUnused(state: AppState, key: string): void {
    for (const channel of ChannelOrder) {
        if (state.rows[channel].inputKey === key) {
            return;
        }
    }

    state.filesByKey.delete(key);
}
