import { Observable } from "@babylonjs/core/Misc/observable";
import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";
import type { TFunction } from "i18next";

import { parseCommanderArchive } from "@/backend/save/commanderArchive";
import type { ISaveBackend } from "@/backend/save/saveBackend";
import { parseSaveFile } from "@/backend/save/saveFile";
import { createUrlFromSave } from "@/backend/save/saveFileData";
import type { Save } from "@/backend/save/saveFileData";
import { saveLoadingErrorToI18nString } from "@/backend/save/saveLoadingError";
import type { SaveLoadingError } from "@/backend/save/saveLoadingError";
import type { UniverseBackend } from "@/backend/universe/universeBackend";

import type { ISoundPlayer } from "@/frontend/presentation/audio/soundPlayer";
import { alertModal, promptModalBoolean } from "@/frontend/presentation/ui/dialogModal";

import { downloadBlob } from "@/utils/downloadBlob";
import { downloadCommanderArchive } from "@/utils/downloadCommanderArchive";
import { renderMarkdownInline } from "@/utils/markdown";

import type { INotificationManager } from "./notificationManager";

import collapseIconPath from "@assets/icons/collapse.webp";
import downloadIconPath from "@assets/icons/download.webp";
import expandIconPath from "@assets/icons/expand.webp";
import shareIconPath from "@assets/icons/link.webp";
import loadIconPath from "@assets/icons/play.webp";
import trashIconPath from "@assets/icons/trash.webp";

export class SaveLoadingPanelContent {
    readonly htmlRoot: HTMLElement;

    readonly cmdrList: HTMLElement;

    readonly onLoadSaveObservable: Observable<DeepReadonly<Save>> = new Observable<DeepReadonly<Save>>();

    private readonly soundPlayer: ISoundPlayer;
    private readonly notificationManager: INotificationManager;
    private readonly saveBackend: ISaveBackend;
    private readonly universeBackend: UniverseBackend;

    private readonly t: TFunction;

    constructor(
        universeBackend: UniverseBackend,
        saveBackend: ISaveBackend,
        soundPlayer: ISoundPlayer,
        notificationManager: INotificationManager,
        t: TFunction,
    ) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("saveLoadingPanelContent");

        this.soundPlayer = soundPlayer;
        this.notificationManager = notificationManager;
        this.saveBackend = saveBackend;
        this.universeBackend = universeBackend;

        this.t = t;

        const migrationNotice = document.createElement("p");
        migrationNotice.classList.add("saveMigrationNotice");
        migrationNotice.innerHTML = renderMarkdownInline(this.t("sidePanel:saveMigrationNotice"));
        this.htmlRoot.appendChild(migrationNotice);

        const dropFileZone = document.createElement("div");
        dropFileZone.id = "dropFileZone";
        this.htmlRoot.appendChild(dropFileZone);

        const dropFileText = document.createElement("p");
        dropFileText.innerText = this.t("sidePanel:dropASaveFileHere");
        dropFileZone.appendChild(dropFileText);

        dropFileZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropFileZone.classList.add("dragover");
            dropFileZone.classList.remove("invalid");
            if (event.dataTransfer === null) {
                console.warn("event.dataTransfer is null");
                dropFileZone.classList.add("invalid");
                return;
            }
            event.dataTransfer.dropEffect = "copy";
        });

        dropFileZone.addEventListener("dragleave", (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropFileZone.classList.remove("dragover");
        });

        dropFileZone.addEventListener("drop", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropFileZone.classList.remove("dragover");

            if (event.dataTransfer === null) {
                console.warn("event.dataTransfer is null");
                dropFileZone.classList.add("invalid");
                return;
            }

            const file = event.dataTransfer.files[0];
            if (file === undefined) {
                await alertModal("No file dropped", this.soundPlayer, this.t);
                return;
            }

            await this.handleSelectedFile(file);
        });

        dropFileZone.addEventListener("click", () => {
            this.soundPlayer.playNow("click");
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "application/json,.json,application/zip,.zip";
            fileInput.onchange = async (): Promise<void> => {
                const file = fileInput.files?.[0];
                if (file === undefined) {
                    await alertModal("No file selected", this.soundPlayer, this.t);
                    return;
                }

                await this.handleSelectedFile(file);
            };
            fileInput.click();
        });

        this.cmdrList = document.createElement("div");
        this.cmdrList.classList.add("cmdrList");
        this.htmlRoot.appendChild(this.cmdrList);
    }

    async populateCmdrList(universeBackend: UniverseBackend, saveManager: ISaveBackend): Promise<void> {
        this.cmdrList.innerHTML = "";

        const cmdrUuids = await saveManager.getCmdrUuids();

        const flatSortedSaves: Map<string, Array<DeepReadonly<Save>>> = new Map();
        for (const uuid of cmdrUuids) {
            const cmdrSaves = await saveManager.getSavesForCmdr(uuid);
            if (cmdrSaves === undefined) {
                continue;
            }
            flatSortedSaves.set(uuid, cmdrSaves.manual.concat(cmdrSaves.auto));
        }
        flatSortedSaves.forEach((saves) => {
            saves.sort((a, b) => b.timestamp - a.timestamp);
        });

        // Sort cmdr UUIDs by latest save timestamp to have the most recent save at the top
        cmdrUuids.sort((a, b) => {
            const aLatestSave = flatSortedSaves.get(a)?.at(0);
            const bLatestSave = flatSortedSaves.get(b)?.at(0);
            if (aLatestSave === undefined || bLatestSave === undefined) {
                console.warn("aLatestSave or bLatestSave is undefined", a, b, aLatestSave, bLatestSave);
                return 0;
            }

            return bLatestSave.timestamp - aLatestSave.timestamp;
        });

        for (const cmdrUuid of cmdrUuids) {
            const cmdrSaves = await saveManager.getSavesForCmdr(cmdrUuid);
            if (cmdrSaves === undefined) {
                continue;
            }

            const allCmdrSaves = cmdrSaves.auto.concat(cmdrSaves.manual);
            allCmdrSaves.sort((a, b) => b.timestamp - a.timestamp);

            const latestSave = allCmdrSaves[0];
            if (latestSave === undefined) {
                continue;
            }

            const cmdrDiv = document.createElement("div");
            cmdrDiv.classList.add("cmdr");
            this.cmdrList.appendChild(cmdrDiv);

            const cmdrHeader = document.createElement("div");
            cmdrHeader.classList.add("cmdrHeader");
            cmdrDiv.appendChild(cmdrHeader);

            const cmdrHeaderText = document.createElement("div");
            cmdrHeaderText.classList.add("cmdrHeaderText");
            cmdrHeader.appendChild(cmdrHeaderText);

            const cmdrName = document.createElement("h3");
            cmdrName.innerText = latestSave.player.name;
            cmdrHeaderText.appendChild(cmdrName);

            const cmdrLastPlayed = document.createElement("p");
            cmdrLastPlayed.innerText = this.t("sidePanel:lastPlayedOn", {
                val: new Date(latestSave.timestamp),
                formatParams: {
                    val: {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    },
                },
            });
            cmdrHeaderText.appendChild(cmdrLastPlayed);

            const cmdrPlayTime = document.createElement("p");
            cmdrPlayTime.innerText = this.t("sidePanel:journeyedFor", {
                nbHours: Math.ceil(latestSave.player.timePlayedSeconds / 60 / 60),
            });
            cmdrHeaderText.appendChild(cmdrPlayTime);

            const cmdrHeaderButtons = document.createElement("div");
            cmdrHeaderButtons.classList.add("cmdrHeaderButtons");
            cmdrHeader.appendChild(cmdrHeaderButtons);

            const continueButton = document.createElement("button");
            continueButton.classList.add("icon", "large");
            continueButton.title = this.t("sidePanel:continueCommander");
            continueButton.addEventListener("click", () => {
                this.soundPlayer.playNow("click");
                this.onLoadSaveObservable.notifyObservers(latestSave);
            });
            cmdrHeaderButtons.appendChild(continueButton);

            const loadIcon = document.createElement("img");
            loadIcon.src = loadIconPath;
            continueButton.appendChild(loadIcon);

            const shareButton = document.createElement("button");
            shareButton.classList.add("icon", "large");
            shareButton.title = this.t("sidePanel:shareCommander");
            shareButton.addEventListener("click", async () => {
                this.soundPlayer.playNow("click");
                const url = createUrlFromSave(latestSave);
                if (url === null) {
                    await alertModal("Could not create a URL from the save file.", this.soundPlayer, this.t);
                    return;
                }
                await navigator.clipboard.writeText(url.toString()).then(() => {
                    this.notificationManager.create(
                        "general",
                        "success",
                        this.t("notifications:copiedToClipboard"),
                        5000,
                    );
                });
            });
            cmdrHeaderButtons.appendChild(shareButton);

            const shareIcon = document.createElement("img");
            shareIcon.src = shareIconPath;
            shareButton.appendChild(shareIcon);

            const downloadButton = document.createElement("button");
            downloadButton.classList.add("icon", "large");
            downloadButton.title = this.t("sidePanel:downloadCommanderArchive");
            downloadButton.addEventListener("click", () => {
                this.soundPlayer.playNow("click");
                downloadCommanderArchive(cmdrUuid, latestSave.player.name, cmdrSaves);
            });
            cmdrHeaderButtons.appendChild(downloadButton);

            const downloadIcon = document.createElement("img");
            downloadIcon.src = downloadIconPath;
            downloadButton.appendChild(downloadIcon);

            const savesList = document.createElement("div");

            savesList.classList.add("savesList");
            savesList.classList.add("hidden"); // Hidden by default
            cmdrDiv.appendChild(savesList);

            allCmdrSaves.forEach((save) => {
                const saveDiv = this.createSaveDiv(save, cmdrSaves.auto.includes(save), universeBackend, saveManager);
                savesList.appendChild(saveDiv);
            });

            const expandIcon = document.createElement("img");
            expandIcon.src = expandIconPath;

            const collapseIcon = document.createElement("img");
            collapseIcon.src = collapseIconPath;

            const expandButton = document.createElement("button");
            expandButton.classList.add("expandButton", "icon", "large");
            expandButton.title = this.t("sidePanel:showCommanderSaves");
            expandButton.appendChild(expandIcon);
            expandButton.addEventListener("click", () => {
                this.soundPlayer.playNow("click");
                savesList.classList.toggle("hidden");
                expandButton.innerHTML = "";
                const isHidden = savesList.classList.contains("hidden");
                expandButton.title = this.t(isHidden ? "sidePanel:showCommanderSaves" : "sidePanel:hideCommanderSaves");
                expandButton.appendChild(isHidden ? expandIcon : collapseIcon);
            });
            cmdrHeaderButtons.appendChild(expandButton);
        }
    }

    private createSaveDiv(
        save: DeepReadonly<Save>,
        isAutoSave: boolean,
        universeBackend: UniverseBackend,
        saveManager: ISaveBackend,
    ): HTMLElement {
        const saveDiv = document.createElement("div");
        saveDiv.classList.add("saveContainer");

        const saveText = document.createElement("div");
        saveText.classList.add("saveText");
        saveDiv.appendChild(saveText);

        const saveName = document.createElement("p");
        saveName.innerText = (isAutoSave ? `[Auto] ` : "") + new Date(save.timestamp).toLocaleString();
        saveText.appendChild(saveName);

        const saveLocation = document.createElement("p");
        const locationToUse =
            save.playerLocation.type === "inSpaceship"
                ? save.shipLocations[save.playerLocation.shipId]
                : save.playerLocation;
        if (locationToUse === undefined) {
            console.warn("locationToUse is undefined");
            saveLocation.innerText = this.t("sidePanel:locationNotFound");
            return saveDiv;
        }
        if (locationToUse.type === "inSpaceship") {
            console.warn("Spaceship inside a spaceship is not supported yet");
            saveLocation.innerText = this.t("sidePanel:locationNotFound");
            return saveDiv;
        }
        const isLanded = locationToUse.type === "atStation";
        const nearestObject = universeBackend.getObjectModelByUniverseId(locationToUse.universeObjectId);
        saveLocation.innerText = this.t(isLanded ? "sidePanel:landedAt" : "sidePanel:near", {
            location: nearestObject?.name ?? this.t("sidePanel:locationNotFound"),
            interpolation: {
                escapeValue: false,
            },
        });
        saveText.appendChild(saveLocation);

        // save info and thumbnail
        const saveContent = document.createElement("div");
        saveContent.classList.add("saveContent");
        saveDiv.appendChild(saveContent);

        // Add thumbnail
        if (save.thumbnail !== undefined) {
            const thumbnailContainer = document.createElement("div");
            thumbnailContainer.classList.add("saveThumbnail");

            const thumbnailImg = document.createElement("img");
            thumbnailImg.src = save.thumbnail;
            thumbnailImg.alt = "Save thumbnail";
            thumbnailContainer.appendChild(thumbnailImg);

            saveContent.appendChild(thumbnailContainer);
        }

        const saveButtons = document.createElement("div");
        saveButtons.classList.add("saveButtons");
        saveDiv.appendChild(saveButtons);

        const loadButton = document.createElement("button");
        loadButton.classList.add("icon", "large");
        loadButton.addEventListener("click", () => {
            this.soundPlayer.playNow("click");
            this.onLoadSaveObservable.notifyObservers(save);
        });
        saveButtons.appendChild(loadButton);

        const loadIcon = document.createElement("img");
        loadIcon.src = loadIconPath;
        loadButton.appendChild(loadIcon);

        const shareButton = document.createElement("button");
        shareButton.classList.add("icon", "large");
        shareButton.addEventListener("click", async () => {
            this.soundPlayer.playNow("click");
            const url = createUrlFromSave(save);
            if (url === null) {
                await alertModal("Could not create a URL from the save file.", this.soundPlayer, this.t);
                return;
            }
            await navigator.clipboard.writeText(url.toString()).then(() => {
                this.notificationManager.create("general", "info", this.t("notifications:copiedToClipboard"), 5000);
            });
        });
        saveButtons.appendChild(shareButton);

        const shareIcon = document.createElement("img");
        shareIcon.src = shareIconPath;
        shareButton.appendChild(shareIcon);

        const downloadButton = document.createElement("button");
        downloadButton.classList.add("icon", "large");
        downloadButton.addEventListener("click", () => {
            this.soundPlayer.playNow("click");
            downloadBlob(
                new Blob([JSON.stringify(save)], { type: "application/json" }),
                `${save.player.name}_${save.timestamp}.json`,
            );
        });
        saveButtons.appendChild(downloadButton);

        const downloadIcon = document.createElement("img");
        downloadIcon.src = downloadIconPath;
        downloadButton.appendChild(downloadIcon);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("danger", "icon", "large");
        deleteButton.addEventListener("click", async () => {
            this.soundPlayer.playNow("click");

            const shouldProceed = await promptModalBoolean(
                this.t("sidePanel:deleteSavePrompt"),
                this.soundPlayer,
                this.t,
            );
            if (!shouldProceed) {
                return;
            }

            await saveManager.deleteSaveForCmdr(save.player.uuid, save.uuid);

            const cmdrSaves = await saveManager.getSavesForCmdr(save.player.uuid);
            if (cmdrSaves === undefined) {
                return;
            }

            if (cmdrSaves.auto.length === 0 && cmdrSaves.manual.length === 0) {
                await saveManager.deleteCmdr(save.player.uuid);
                saveDiv.parentElement?.parentElement?.remove();
            }

            saveDiv.remove();
        });
        saveButtons.appendChild(deleteButton);

        const trashIcon = document.createElement("img");
        trashIcon.src = trashIconPath;
        deleteButton.appendChild(trashIcon);

        return saveDiv;
    }

    private async handleSelectedFile(file: File): Promise<void> {
        if (file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip") {
            await this.importCommanderArchive(file);
            return;
        }

        await this.loadSaveFile(file, this.universeBackend);
    }

    private async importCommanderArchive(file: File): Promise<void> {
        const archiveResult = parseCommanderArchive(new Uint8Array(await file.arrayBuffer()), this.universeBackend);
        if (!archiveResult.success) {
            console.error("Could not import Commander archive:", archiveResult.error);
            await alertModal(this.t("sidePanel:invalidCommanderArchive"), this.soundPlayer, this.t);
            return;
        }

        const existingSaves = await this.saveBackend.getSavesForCmdr(archiveResult.value.cmdrUuid);
        const existingSaveUuids = new Set(
            existingSaves === undefined ? [] : existingSaves.manual.concat(existingSaves.auto).map((save) => save.uuid),
        );
        const savesToImport = {
            manual: archiveResult.value.saves.manual.filter((save) => !existingSaveUuids.has(save.uuid)),
            auto: archiveResult.value.saves.auto.filter((save) => !existingSaveUuids.has(save.uuid)),
        };
        const importedCount = savesToImport.manual.length + savesToImport.auto.length;
        const archiveSaveCount = archiveResult.value.saves.manual.length + archiveResult.value.saves.auto.length;

        if (importedCount > 0) {
            const success = await this.saveBackend.importSaves({
                [archiveResult.value.cmdrUuid]: savesToImport,
            });
            if (!success) {
                await alertModal(this.t("sidePanel:commanderArchiveImportFailed"), this.soundPlayer, this.t);
                return;
            }
        }

        this.notificationManager.create(
            "general",
            "success",
            this.t("sidePanel:commanderArchiveImported", {
                importedCount,
                skippedCount: archiveSaveCount - importedCount,
            }),
            5000,
        );
        await this.populateCmdrList(this.universeBackend, this.saveBackend);
    }

    private async loadSaveFile(file: File, universeBackend: UniverseBackend): Promise<Result<Save, SaveLoadingError>> {
        const saveFileDataResult = await parseSaveFile(file, universeBackend);
        if (!saveFileDataResult.success) {
            console.error(saveFileDataResult.error);
            await alertModal(saveLoadingErrorToI18nString(saveFileDataResult.error, this.t), this.soundPlayer, this.t);
            return saveFileDataResult;
        }

        this.onLoadSaveObservable.notifyObservers(saveFileDataResult.value);
        return saveFileDataResult;
    }
}
