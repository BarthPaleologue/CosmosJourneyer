export type ColorChannel = "r" | "g" | "b" | "a";

export type ConstantFill = 0 | 255;

export interface ChannelRowState {
    readonly outputChannel: ColorChannel;
    inputKey: string | null;
    inputFileName: string | null;
    sourceChannel: ColorChannel;
    readonly constantFill: ConstantFill;
}

export interface PreviewState {
    pixelBytes: Uint8ClampedArray | null;
    width: number | null;
    height: number | null;
    previewWidth: number | null;
    previewHeight: number | null;
    activeInputs: number;
}

export interface AppState {
    readonly rows: Record<ColorChannel, ChannelRowState>;
    readonly filesByKey: Map<string, File>;
    preview: PreviewState;
    statusMessage: string;
    statusTone: "default" | "error";
    hoveredDropTarget: ColorChannel | null;
    isBusy: boolean;
    busyLabel: string | null;
}

export interface ChannelAssignment {
    readonly outputChannel: ColorChannel;
    readonly inputKey: string | null;
    readonly sourceChannel: ColorChannel;
    readonly constantFill: number;
}

export interface PackRequest {
    readonly rows: [ChannelAssignment, ChannelAssignment, ChannelAssignment, ChannelAssignment];
}

export interface PreviewResponse {
    readonly pixelBytes: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly previewWidth: number;
    readonly previewHeight: number;
    readonly activeInputs: number;
}

export interface PackedTexture {
    readonly width: number;
    readonly height: number;
    readonly activeInputs: number;
    readonly pixels: Uint8ClampedArray;
}
