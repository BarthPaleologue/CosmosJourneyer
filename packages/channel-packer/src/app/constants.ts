import type { ColorChannel } from "../types";

export const ChannelOrder: readonly ColorChannel[] = ["r", "g", "b", "a"];

export const ChannelLabels: Readonly<Record<ColorChannel, string>> = {
    r: "R",
    g: "G",
    b: "B",
    a: "A",
};

export const DefaultFills: Readonly<Record<ColorChannel, 0 | 255>> = {
    r: 0,
    g: 0,
    b: 0,
    a: 255,
};

export const AcceptedExtensions = ".png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff";

export const MaxPreviewEdge = 1024;
