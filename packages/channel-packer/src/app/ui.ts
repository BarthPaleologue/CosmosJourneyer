import type { AppState, ChannelRowState, ColorChannel } from "../types";
import { AcceptedExtensions, ChannelLabels, ChannelOrder } from "./constants";
import { escapeHtml } from "./helpers";
import { canSave, formatDimensions } from "./state";

interface RowElements {
    readonly row: HTMLElement;
    readonly caption: HTMLParagraphElement;
    readonly fileName: HTMLParagraphElement;
    readonly chooseButton: HTMLButtonElement;
    readonly clearButton: HTMLButtonElement;
    readonly sourceSelect: HTMLSelectElement;
}

export interface UiRefs {
    readonly appShell: HTMLDivElement;
    readonly statusMessage: HTMLParagraphElement;
    readonly dimensionsValue: HTMLElement;
    readonly activeInputsValue: HTMLElement;
    readonly previewFrame: HTMLDivElement;
    readonly emptyPreview: HTMLParagraphElement;
    readonly previewCanvas: HTMLCanvasElement;
    readonly loaderOverlay: HTMLDivElement;
    readonly loaderLabel: HTMLSpanElement;
    readonly saveButton: HTMLButtonElement;
    readonly fileInput: HTMLInputElement;
    readonly rows: Record<ColorChannel, RowElements>;
}

export interface UiHandlers {
    onDragEnter(event: DragEvent, channel: ColorChannel): void;
    onDragOver(event: DragEvent, channel: ColorChannel): void;
    onDragLeave(event: DragEvent, channel: ColorChannel): void;
    onDrop(event: DragEvent, channel: ColorChannel): void;
    onChoose(channel: ColorChannel): void;
    onClear(channel: ColorChannel): void;
    onSourceChange(channel: ColorChannel, sourceChannel: ColorChannel): void;
    onSave(): void;
    onFileInputChange(file: File | null): void;
}

export function createUi(state: AppState, handlers: UiHandlers): UiRefs {
    const app = getAppRoot();
    app.innerHTML = createAppShellMarkup(state);

    const ui: UiRefs = {
        appShell: requireElement(app, ".app-shell", HTMLDivElement),
        statusMessage: requireElement(app, '[data-role="status-message"]', HTMLParagraphElement),
        dimensionsValue: requireElement(app, '[data-role="dimensions-value"]', HTMLElement),
        activeInputsValue: requireElement(app, '[data-role="active-inputs-value"]', HTMLElement),
        previewFrame: requireElement(app, '[data-role="preview-frame"]', HTMLDivElement),
        emptyPreview: requireElement(app, '[data-role="empty-preview"]', HTMLParagraphElement),
        previewCanvas: requireElement(app, "#preview-canvas", HTMLCanvasElement),
        loaderOverlay: requireElement(app, '[data-role="loader-overlay"]', HTMLDivElement),
        loaderLabel: requireElement(app, '[data-role="loader-label"]', HTMLSpanElement),
        saveButton: requireElement(app, '[data-action="save"]', HTMLButtonElement),
        fileInput: requireElement(app, '[data-role="file-input"]', HTMLInputElement),
        rows: {
            r: collectRowElements("r"),
            g: collectRowElements("g"),
            b: collectRowElements("b"),
            a: collectRowElements("a"),
        },
    };

    for (const channel of ChannelOrder) {
        const row = ui.rows[channel];
        row.row.addEventListener("dragenter", (event) => {
            handlers.onDragEnter(event, channel);
        });
        row.row.addEventListener("dragover", (event) => {
            handlers.onDragOver(event, channel);
        });
        row.row.addEventListener("dragleave", (event) => {
            handlers.onDragLeave(event, channel);
        });
        row.row.addEventListener("drop", (event) => {
            handlers.onDrop(event, channel);
        });
        row.chooseButton.addEventListener("click", () => {
            handlers.onChoose(channel);
        });
        row.clearButton.addEventListener("click", () => {
            handlers.onClear(channel);
        });
        row.sourceSelect.addEventListener("change", () => {
            const sourceChannel = parseColorChannel(row.sourceSelect.value);
            if (sourceChannel === null) {
                return;
            }

            handlers.onSourceChange(channel, sourceChannel);
        });
    }

    ui.fileInput.addEventListener("change", (event) => {
        const input = event.currentTarget;
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        const file = input.files?.item(0) ?? null;
        input.value = "";
        handlers.onFileInputChange(file);
    });

    ui.saveButton.addEventListener("click", () => {
        handlers.onSave();
    });

    return ui;
}

export function syncUi(state: AppState, ui: UiRefs): void {
    ui.appShell.classList.toggle("app-shell-busy", state.isBusy);
    ui.statusMessage.textContent = state.statusMessage;
    ui.statusMessage.classList.toggle("status-message-error", state.statusTone === "error");
    ui.dimensionsValue.textContent = formatDimensions(state.preview);
    ui.activeInputsValue.textContent = String(state.preview.activeInputs);

    const isLoaderVisible = state.isBusy && state.busyLabel !== null;
    ui.loaderOverlay.hidden = !isLoaderVisible;
    ui.loaderLabel.textContent = state.busyLabel ?? "Working...";

    ui.saveButton.disabled = !canSave(state);
    ui.saveButton.textContent = state.isBusy && state.busyLabel !== null ? state.busyLabel : "Pack & Save PNG";

    for (const channel of ChannelOrder) {
        syncRow(ui.rows[channel], state, channel);
    }

    if (
        state.preview.pixelBytes === null ||
        state.preview.width === null ||
        state.preview.height === null ||
        state.preview.previewWidth === null ||
        state.preview.previewHeight === null
    ) {
        ui.emptyPreview.hidden = false;
        ui.previewCanvas.hidden = true;
        ui.previewCanvas.width = 1;
        ui.previewCanvas.height = 1;
        ui.previewCanvas.style.width = "";
        ui.previewCanvas.style.height = "";
    } else {
        ui.emptyPreview.hidden = true;
        ui.previewCanvas.hidden = false;
        ui.previewCanvas.width = state.preview.previewWidth;
        ui.previewCanvas.height = state.preview.previewHeight;
    }
}

export function setHoveredDropTarget(ui: UiRefs, state: AppState, nextTarget: ColorChannel | null): void {
    if (state.hoveredDropTarget === nextTarget) {
        return;
    }

    const previousTarget = state.hoveredDropTarget;
    state.hoveredDropTarget = nextTarget;

    if (previousTarget !== null) {
        ui.rows[previousTarget].row.classList.remove("drop-active");
    }

    if (nextTarget !== null) {
        ui.rows[nextTarget].row.classList.add("drop-active");
    }
}

function syncRow(rowElements: RowElements, state: AppState, channel: ColorChannel): void {
    const rowState = state.rows[channel];

    rowElements.caption.textContent = rowState.inputKey === null ? "Uses constant fill" : "Texture assigned";
    rowElements.fileName.textContent = rowState.inputFileName ?? "No texture selected";
    rowElements.chooseButton.disabled = state.isBusy;
    rowElements.clearButton.disabled = rowState.inputKey === null || state.isBusy;
    rowElements.sourceSelect.disabled = state.isBusy;
    rowElements.sourceSelect.value = rowState.sourceChannel;
}

function createAppShellMarkup(state: AppState): string {
    return `
        <div class="app-shell">
            <header class="header">
                <h1>Channel Packer</h1>
                <p>Pack RGBA channels from separate source textures into one export-ready PNG.</p>
            </header>
            <main class="content-grid">
                <section class="panel routing-panel">
                    <h2>Channel Routing</h2>
                    <p class="row-caption">Assign one texture to each output row, then select which source channel should feed it.</p>
                    <div class="rows">
                        ${ChannelOrder.map((channel) => createRowMarkup(state.rows[channel])).join("")}
                    </div>
                </section>
                <section class="panel preview-panel">
                    <div class="preview-stack">
                        <div>
                            <h2>Preview</h2>
                            <p class="row-caption">The browser packs and previews using the same channel routing pipeline as export.</p>
                        </div>
                        <div class="summary-grid">
                            <div class="summary-card">
                                <span>Dimensions</span>
                                <strong data-role="dimensions-value">No preview</strong>
                            </div>
                            <div class="summary-card">
                                <span>Active Inputs</span>
                                <strong data-role="active-inputs-value">0</strong>
                            </div>
                        </div>
                        <div class="preview-frame" data-role="preview-frame">
                            <p class="empty-preview" data-role="empty-preview">A packed preview will appear here once at least one source texture is valid.</p>
                            <canvas class="preview-canvas" id="preview-canvas" aria-label="Packed output preview" hidden></canvas>
                            <div class="loader-overlay" data-role="loader-overlay" aria-live="polite" aria-busy="true" hidden>
                                <span class="loader-spinner" aria-hidden="true"></span>
                                <span data-role="loader-label">Working...</span>
                            </div>
                        </div>
                        <button class="primary-button" data-action="save" disabled>Pack & Save PNG</button>
                    </div>
                </section>
            </main>
            <footer class="status-bar">
                <p class="status-message" data-role="status-message">${escapeHtml(state.statusMessage)}</p>
                <div class="status-meta">
                    <span class="row-note">Drop a file directly onto an output row or use the file picker.</span>
                    <div class="status-links">
                        <a href="https://github.com/BarthPaleologue/CosmosJourneyer/tree/main/packages/channel-packer" target="_blank" rel="noreferrer">GitHub</a>
                        <a href="https://bsky.app/profile/barthpaleologue.bsky.social" target="_blank" rel="noreferrer">Bluesky</a>
                    </div>
                </div>
            </footer>
            <input data-role="file-input" type="file" accept="${AcceptedExtensions}" hidden />
        </div>
    `;
}

function createRowMarkup(row: ChannelRowState): string {
    return `
        <section class="channel-row" data-row="${row.outputChannel}">
            <div class="row-heading">
                <span class="channel-badge" data-channel="${row.outputChannel}">${ChannelLabels[row.outputChannel]}</span>
                <div class="row-title">
                    <h3>Output ${ChannelLabels[row.outputChannel]}</h3>
                    <p class="row-caption" data-role="row-caption">${row.inputKey === null ? "Uses constant fill" : "Texture assigned"}</p>
                </div>
            </div>
            <p class="file-name" data-role="file-name">${escapeHtml(row.inputFileName ?? "No texture selected")}</p>
            <div class="row-controls">
                <button data-action="choose" data-channel="${row.outputChannel}">Choose Texture</button>
                <button class="ghost-button" data-action="clear" data-channel="${row.outputChannel}" disabled>Clear</button>
                <label class="row-note" for="source-${row.outputChannel}">Input channel</label>
                <select id="source-${row.outputChannel}" data-role="source-select" data-channel="${row.outputChannel}">
                    ${ChannelOrder.map((channel) => `<option value="${channel}" ${row.sourceChannel === channel ? "selected" : ""}>${ChannelLabels[channel]}</option>`).join("")}
                </select>
            </div>
            <p class="row-note">Default constant when empty: ${row.constantFill}</p>
        </section>
    `;
}

function getAppRoot(): HTMLDivElement {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (app === null) {
        throw new Error("Missing #app root element.");
    }

    return app;
}

function requireElement<T extends Element>(
    parent: ParentNode,
    selector: string,
    constructor: abstract new (...args: never[]) => T,
): T {
    const element = parent.querySelector(selector);
    if (!(element instanceof constructor)) {
        throw new Error(`Missing expected element for selector ${selector}.`);
    }

    return element;
}

function collectRowElements(channel: ColorChannel): RowElements {
    const row = requireElement(document, `[data-row="${channel}"]`, HTMLElement);

    return {
        row,
        caption: requireElement(row, '[data-role="row-caption"]', HTMLParagraphElement),
        fileName: requireElement(row, '[data-role="file-name"]', HTMLParagraphElement),
        chooseButton: requireElement(row, `[data-action="choose"][data-channel="${channel}"]`, HTMLButtonElement),
        clearButton: requireElement(row, `[data-action="clear"][data-channel="${channel}"]`, HTMLButtonElement),
        sourceSelect: requireElement(row, `[data-role="source-select"][data-channel="${channel}"]`, HTMLSelectElement),
    };
}

function parseColorChannel(value: string | undefined): ColorChannel | null {
    if (value === "r" || value === "g" || value === "b" || value === "a") {
        return value;
    }

    return null;
}
