import { ChannelOrder, MaxPreviewEdge, RowPreviewResolution } from "./app/constants";
import { downloadBlob, formatError, waitForNextPaint } from "./app/helpers";
import {
    applyPreviewResponse,
    buildPackRequest,
    canSave,
    clearPreview,
    createFileKey,
    createInitialState,
    getAssignedInputCount,
    releaseFileKeyIfUnused,
} from "./app/state";
import { createUi, setHoveredDropTarget, syncUi } from "./app/ui";
import type { UiRefs } from "./app/ui";
import { ImageCache, generatePreview, savePackedPng, synchronizeCache } from "./packer";
import type { AppState, ColorChannel } from "./types";

const imageCache = new ImageCache();
const state = createInitialState();

let previewRevision = 0;
let pendingPickerChannel: ColorChannel | null = null;

const ui = createUi(state, {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onChoose: chooseTexture,
    onClear: clearChannel,
    onSourceChange(channel, sourceChannel) {
        void updateSourceChannel(channel, sourceChannel);
    },
    onSave() {
        void savePackedTexture();
    },
    onFileInputChange(file) {
        handleFileInputSelection(file);
    },
});

syncUi(state, ui);
setupWindowDragHandling(state, ui);
window.addEventListener("resize", () => {
    drawPreviewCanvas(state, ui);
});

/**
 * Assigns a chosen file to the pending channel and refreshes the preview.
 * @param file - Selected source file.
 */
function handleFileInputSelection(file: File | null): void {
    const target = pendingPickerChannel;
    pendingPickerChannel = null;

    if (target === null || file === null) {
        return;
    }

    assignFile(target, file);
    void refreshPreview();
}

/**
 * Updates the session status and redraws the interface and preview.
 * @param message - Status text to display.
 * @param tone - Visual status severity.
 */
function setStatus(message: string, tone: "default" | "error" = "default"): void {
    state.statusMessage = message;
    state.statusTone = tone;
    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
}

/**
 * Updates the operation indicator and synchronizes the interface.
 * @param isBusy - Whether an operation is in progress.
 * @param busyLabel - Optional operation label.
 */
function setBusyState(isBusy: boolean, busyLabel?: string): void {
    state.isBusy = isBusy;
    state.busyLabel = isBusy ? (busyLabel ?? "Working...") : null;
    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
}

/**
 * Opens the file picker for an output channel when no operation is running.
 * @param channel - RGBA channel being handled.
 */
function chooseTexture(channel: ColorChannel): void {
    if (state.isBusy) {
        return;
    }

    pendingPickerChannel = channel;
    ui.fileInput.click();
}

/**
 * Unassigns a channel, releases unused file data, and refreshes the preview.
 * @param channel - RGBA channel being handled.
 */
function clearChannel(channel: ColorChannel): void {
    const row = state.rows[channel];
    const oldKey = row.inputKey;

    row.inputKey = null;
    row.inputFileName = null;
    if (oldKey !== null) {
        releaseFileKeyIfUnused(state, oldKey);
    }

    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
    void refreshPreview();
}

/**
 * Changes a row’s source channel and regenerates its packed preview.
 * @param channel - RGBA channel being handled.
 * @param sourceChannel - RGBA channel to read from the source image.
 */
async function updateSourceChannel(channel: ColorChannel, sourceChannel: ColorChannel): Promise<void> {
    state.rows[channel].sourceChannel = sourceChannel;
    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
    await refreshPreview();
}

/**
 * Assigns a source file to an output row and releases its previous file if unused.
 * @param channel - RGBA channel being handled.
 * @param file - Selected source file.
 */
function assignFile(channel: ColorChannel, file: File): void {
    const row = state.rows[channel];
    const previousKey = row.inputKey;
    const key = createFileKey(file);

    row.inputKey = key;
    row.inputFileName = file.name;
    state.filesByKey.set(key, file);

    if (previousKey !== null && previousKey !== key) {
        releaseFileKeyIfUnused(state, previousKey);
    }

    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
}

/**
 * Regenerates the preview, ignoring stale results superseded by a newer revision.
 * @param statusPrefix - Optional message preceding the packing result.
 */
async function refreshPreview(statusPrefix?: string): Promise<void> {
    const revision = ++previewRevision;
    const request = buildPackRequest(state);
    const activeInputs = getAssignedInputCount(state);

    if (activeInputs === 0) {
        try {
            synchronizeCache(request, imageCache);
        } catch (error: unknown) {
            if (revision !== previewRevision) {
                return;
            }

            setStatus(formatError(error), "error");
            return;
        }

        if (revision !== previewRevision) {
            return;
        }

        clearPreview(state);
        setStatus("Select or drop at least one texture to generate a preview.");
        return;
    }

    setBusyState(true, "Packing preview...");
    await waitForNextPaint();

    try {
        const response = await generatePreview(request, state.filesByKey, imageCache, MaxPreviewEdge);

        if (revision !== previewRevision) {
            return;
        }

        applyPreviewResponse(state, response);
        const message = `Packed preview ready using ${response.activeInputs} source texture${response.activeInputs === 1 ? "" : "s"}.`;
        setStatus(statusPrefix === undefined ? message : `${statusPrefix} ${message}`);
    } catch (error: unknown) {
        if (revision !== previewRevision) {
            return;
        }

        clearPreview(state);
        setStatus(formatError(error), "error");
    } finally {
        if (revision === previewRevision) {
            setBusyState(false);
        }
    }
}

/**
 * Downloads the current full-resolution packing as a PNG and reports its outcome.
 */
async function savePackedTexture(): Promise<void> {
    if (!canSave(state)) {
        return;
    }

    setBusyState(true, "Saving PNG...");
    await waitForNextPaint();

    try {
        const response = await savePackedPng(
            buildPackRequest(state),
            state.filesByKey,
            imageCache,
            "packed-texture.png",
        );
        downloadBlob(response.blob, response.fileName);
        setStatus(`Saved ${response.width} x ${response.height} PNG as ${response.fileName}.`);
    } catch (error: unknown) {
        setStatus(formatError(error), "error");
    } finally {
        setBusyState(false);
    }
}

/**
 * Draws packed pixels fitted to the preview frame and refreshes channel thumbnails.
 * @param appState - Current channel-packing session.
 * @param uiRefs - References to the mounted interface.
 */
function drawPreviewCanvas(appState: AppState, uiRefs: UiRefs): void {
    if (
        appState.preview.pixelBytes === null ||
        appState.preview.width === null ||
        appState.preview.height === null ||
        appState.preview.previewWidth === null ||
        appState.preview.previewHeight === null
    ) {
        clearRowPreviews(uiRefs);
        return;
    }

    const context = uiRefs.previewCanvas.getContext("2d");
    if (context === null) {
        clearRowPreviews(uiRefs);
        return;
    }

    const computedStyle = window.getComputedStyle(uiRefs.previewFrame);
    const horizontalPadding =
        Number.parseFloat(computedStyle.paddingLeft) + Number.parseFloat(computedStyle.paddingRight);
    const verticalPadding =
        Number.parseFloat(computedStyle.paddingTop) + Number.parseFloat(computedStyle.paddingBottom);
    const availableWidth = Math.max(1, uiRefs.previewFrame.clientWidth - horizontalPadding);
    const availableHeight = Math.max(1, uiRefs.previewFrame.clientHeight - verticalPadding);
    const scale = Math.min(
        availableWidth / appState.preview.previewWidth,
        availableHeight / appState.preview.previewHeight,
    );
    const fittedWidth = Math.max(1, Math.floor(appState.preview.previewWidth * scale));
    const fittedHeight = Math.max(1, Math.floor(appState.preview.previewHeight * scale));

    uiRefs.previewCanvas.style.width = `${fittedWidth}px`;
    uiRefs.previewCanvas.style.height = `${fittedHeight}px`;
    const imageData = context.createImageData(appState.preview.previewWidth, appState.preview.previewHeight);
    imageData.data.set(appState.preview.pixelBytes);
    context.putImageData(imageData, 0, 0);

    drawRowPreviews(appState, uiRefs);
}

/**
 * Hides and resets every output channel thumbnail.
 * @param uiRefs - References to the mounted interface.
 */
function clearRowPreviews(uiRefs: UiRefs): void {
    for (const channel of ChannelOrder) {
        const canvas = uiRefs.rows[channel].previewCanvas;
        canvas.hidden = true;
        canvas.width = 1;
        canvas.height = 1;
    }
}

/**
 * Samples the packed preview into one thumbnail per output channel.
 * @param appState - Current channel-packing session.
 * @param uiRefs - References to the mounted interface.
 */
function drawRowPreviews(appState: AppState, uiRefs: UiRefs): void {
    const sourcePixels = appState.preview.pixelBytes;
    const sourceWidth = appState.preview.previewWidth;
    const sourceHeight = appState.preview.previewHeight;
    if (sourcePixels === null || sourceWidth === null || sourceHeight === null) {
        clearRowPreviews(uiRefs);
        return;
    }

    for (const channel of ChannelOrder) {
        const previewCanvas = uiRefs.rows[channel].previewCanvas;
        const context = previewCanvas.getContext("2d");
        if (context === null) {
            continue;
        }

        previewCanvas.hidden = false;
        previewCanvas.width = RowPreviewResolution;
        previewCanvas.height = RowPreviewResolution;

        const imageData = context.createImageData(RowPreviewResolution, RowPreviewResolution);
        const outputPixels = imageData.data;
        const sourceOffset = getChannelOffset(channel);

        for (let y = 0; y < RowPreviewResolution; y += 1) {
            const sourceY = Math.min(sourceHeight - 1, Math.floor((y * sourceHeight) / RowPreviewResolution));

            for (let x = 0; x < RowPreviewResolution; x += 1) {
                const sourceX = Math.min(sourceWidth - 1, Math.floor((x * sourceWidth) / RowPreviewResolution));
                const packedIndex = (sourceY * sourceWidth + sourceX) * 4 + sourceOffset;
                const outputIndex = (y * RowPreviewResolution + x) * 4;
                const value = sourcePixels[packedIndex] ?? 0;

                writePreviewPixel(outputPixels, outputIndex, value, channel);
            }
        }

        context.putImageData(imageData, 0, 0);
    }
}

/**
 * Writes a grayscale RGB sample or a white sample carrying the source alpha.
 * @param outputPixels - Thumbnail RGBA buffer to update.
 * @param outputIndex - Byte offset of the destination pixel.
 * @param value - Source channel byte value.
 * @param channel - RGBA channel being handled.
 */
function writePreviewPixel(
    outputPixels: Uint8ClampedArray,
    outputIndex: number,
    value: number,
    channel: ColorChannel,
): void {
    if (channel === "a") {
        outputPixels[outputIndex] = 255;
        outputPixels[outputIndex + 1] = 255;
        outputPixels[outputIndex + 2] = 255;
        outputPixels[outputIndex + 3] = value;
    } else {
        outputPixels[outputIndex] = value;
        outputPixels[outputIndex + 1] = value;
        outputPixels[outputIndex + 2] = value;
        outputPixels[outputIndex + 3] = 255;
    }
}

/**
 * Maps an RGBA channel to its byte offset within an interleaved pixel.
 * @param channel - RGBA channel being handled.
 * @returns The byte offset from zero to three.
 */
function getChannelOffset(channel: ColorChannel): number {
    if (channel === "r") {
        return 0;
    }
    if (channel === "g") {
        return 1;
    }
    if (channel === "b") {
        return 2;
    }

    return 3;
}

/**
 * Allows a drag onto a channel and highlights that drop target.
 * @param event - Browser drag event.
 * @param channel - RGBA channel being handled.
 */
function handleDragEnter(event: DragEvent, channel: ColorChannel): void {
    event.preventDefault();
    setHoveredDropTarget(ui, state, channel);
}

/**
 * Keeps a channel eligible and highlighted while a file is dragged over it.
 * @param event - Browser drag event.
 * @param channel - RGBA channel being handled.
 */
function handleDragOver(event: DragEvent, channel: ColorChannel): void {
    event.preventDefault();
    setHoveredDropTarget(ui, state, channel);
}

/**
 * Clears the drop highlight when the pointer leaves the channel and its descendants.
 * @param event - Browser drag event.
 * @param channel - RGBA channel being handled.
 */
function handleDragLeave(event: DragEvent, channel: ColorChannel): void {
    const currentTarget = event.currentTarget;
    if (!(currentTarget instanceof HTMLElement)) {
        return;
    }

    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && currentTarget.contains(nextTarget)) {
        return;
    }

    if (state.hoveredDropTarget === channel) {
        setHoveredDropTarget(ui, state, null);
    }
}

/**
 * Assigns the first dropped file to a channel and regenerates the packed preview.
 * @param event - Browser drag event.
 * @param channel - RGBA channel being handled.
 */
function handleDrop(event: DragEvent, channel: ColorChannel): void {
    event.preventDefault();

    if (state.isBusy) {
        setStatus("Wait for the current pack operation to finish before dropping another texture.");
        return;
    }

    setHoveredDropTarget(ui, state, null);

    const fileList = event.dataTransfer?.files;
    if (fileList === undefined || fileList.length === 0) {
        return;
    }

    const file = fileList.item(0);
    if (file === null) {
        return;
    }

    assignFile(channel, file);
    const statusPrefix =
        fileList.length > 1 ? "Only the first dropped file was used for this output channel." : undefined;
    void refreshPreview(statusPrefix);
}

/**
 * Prevents browser file navigation and clears channel highlights for drops outside rows.
 * @param appState - Current channel-packing session.
 * @param uiRefs - References to the mounted interface.
 */
function setupWindowDragHandling(appState: AppState, uiRefs: UiRefs): void {
    window.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    window.addEventListener("drop", (event) => {
        event.preventDefault();
        const target = event.target;
        if (target instanceof Element && target.closest("[data-row]") !== null) {
            return;
        }

        setHoveredDropTarget(uiRefs, appState, null);
        if (!appState.isBusy) {
            setStatus("Drop files directly onto an output row to assign them.");
        }
    });
}
