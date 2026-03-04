import { MaxPreviewEdge } from "./app/constants";
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
import { createUi, setHoveredDropTarget, syncUi, type UiRefs } from "./app/ui";
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

function handleFileInputSelection(file: File | null): void {
    const target = pendingPickerChannel;
    pendingPickerChannel = null;

    if (target === null || file === null) {
        return;
    }

    assignFile(target, file);
    void refreshPreview();
}

function setStatus(message: string, tone: "default" | "error" = "default"): void {
    state.statusMessage = message;
    state.statusTone = tone;
    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
}

function setBusyState(isBusy: boolean, busyLabel?: string): void {
    state.isBusy = isBusy;
    state.busyLabel = isBusy ? (busyLabel ?? "Working...") : null;
    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
}

function chooseTexture(channel: ColorChannel): void {
    if (state.isBusy) {
        return;
    }

    pendingPickerChannel = channel;
    ui.fileInput.click();
}

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

async function updateSourceChannel(channel: ColorChannel, sourceChannel: ColorChannel): Promise<void> {
    state.rows[channel].sourceChannel = sourceChannel;
    syncUi(state, ui);
    drawPreviewCanvas(state, ui);
    await refreshPreview();
}

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

function drawPreviewCanvas(appState: AppState, uiRefs: UiRefs): void {
    if (
        appState.preview.pixelBytes === null ||
        appState.preview.width === null ||
        appState.preview.height === null ||
        appState.preview.previewWidth === null ||
        appState.preview.previewHeight === null
    ) {
        return;
    }

    const context = uiRefs.previewCanvas.getContext("2d");
    if (context === null) {
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
}

function handleDragEnter(event: DragEvent, channel: ColorChannel): void {
    event.preventDefault();
    setHoveredDropTarget(ui, state, channel);
}

function handleDragOver(event: DragEvent, channel: ColorChannel): void {
    event.preventDefault();
    setHoveredDropTarget(ui, state, channel);
}

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
