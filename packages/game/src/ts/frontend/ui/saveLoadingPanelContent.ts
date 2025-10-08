import { Observable } from "@babylonjs/core/Misc/observable";

import { type ISaveBackend } from "@/backend/save/saveBackend";
import { parseSaveFile } from "@/backend/save/saveFile";
import { createUrlFromSave, type Save } from "@/backend/save/saveFileData";
import { saveLoadingErrorToI18nString, type SaveLoadingError } from "@/backend/save/saveLoadingError";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { alertModal, promptModalBoolean } from "@/frontend/ui/dialogModal";
import { NotificationIntent, NotificationOrigin } from "@/frontend/ui/notification";

import { type DeepReadonly, type Result } from "@/utils/types";

import i18n from "@/i18n";

import { type INotificationManager } from "./notificationManager";

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

    constructor(
        starSystemDatabase: StarSystemDatabase,
        soundPlayer: ISoundPlayer,
        notificationManager: INotificationManager,
    ) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("saveLoadingPanelContent");

        this.soundPlayer = soundPlayer;
        this.notificationManager = notificationManager;

        const dropFileZone = document.createElement("div");
        dropFileZone.id = "dropFileZone";
        this.htmlRoot.appendChild(dropFileZone);

        const dropFileText = document.createElement("p");
        dropFileText.innerText = i18n.t("sidePanel:dropASaveFileHere");
        dropFileZone.appendChild(dropFileText);

        dropFileZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropFileZone.classList.add("dragover");
            dropFileZone.classList.remove("invalid");
            if (event.dataTransfer === null) throw new Error("event.dataTransfer is null");
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

            if (event.dataTransfer === null) throw new Error("event.dataTransfer is null");
            if (event.dataTransfer.files.length === 0) throw new Error("event.dataTransfer.files is empty");

            const file = event.dataTransfer.files[0];
            if (file === undefined) {
                await alertModal("No file dropped", this.soundPlayer);
                return;
            }

            await this.loadSaveFile(file, starSystemDatabase);
        });

        dropFileZone.addEventListener("click", () => {
            this.soundPlayer.playNow(SoundType.CLICK);
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "application/json";
            fileInput.onchange = async () => {
                if (fileInput.files === null) throw new Error("fileInput.files is null");
                if (fileInput.files.length === 0) throw new Error("fileInput.files is empty");

                const file = fileInput.files[0];
                if (file === undefined) {
                    await alertModal("No file selected", this.soundPlayer);
                    return;
                }

                await this.loadSaveFile(file, starSystemDatabase);
            };
            fileInput.click();
        });

        this.cmdrList = document.createElement("div");
        this.cmdrList.classList.add("cmdrList");
        this.htmlRoot.appendChild(this.cmdrList);
    }

    async populateCmdrList(starSystemDatabase: StarSystemDatabase, saveManager: ISaveBackend) {
        this.cmdrList.innerHTML = "";

        const cmdrUuids = await saveManager.getCmdrUuids();

        const flatSortedSaves: Map<string, Array<DeepReadonly<Save>>> = new Map();
        for (const uuid of cmdrUuids) {
            const cmdrSaves = await saveManager.getSavesForCmdr(uuid);
            if (cmdrSaves === undefined) continue;
            flatSortedSaves.set(uuid, cmdrSaves.manual.concat(cmdrSaves.auto));
        }
        flatSortedSaves.forEach((saves) => {
            saves.sort((a, b) => b.timestamp - a.timestamp);
        });

        // Sort cmdr UUIDs by latest save timestamp to have the most recent save at the top
        cmdrUuids.sort((a, b) => {
            const aLatestSave = flatSortedSaves.get(a)?.at(0);
            const bLatestSave = flatSortedSaves.get(b)?.at(0);
            if (aLatestSave === undefined || bLatestSave === undefined)
                throw new Error("aLatestSave or bLatestSave is undefined");
            return bLatestSave.timestamp - aLatestSave.timestamp;
        });

        for (const cmdrUuid of cmdrUuids) {
            const cmdrSaves = await saveManager.getSavesForCmdr(cmdrUuid);
            if (cmdrSaves === undefined) {
                return;
            }

            const cmdrDiv = document.createElement("div");
            cmdrDiv.classList.add("cmdr");
            this.cmdrList.appendChild(cmdrDiv);

            const allCmdrSaves = cmdrSaves.auto.concat(cmdrSaves.manual);
            allCmdrSaves.sort((a, b) => b.timestamp - a.timestamp);

            const latestSave = allCmdrSaves[0];
            if (latestSave === undefined) {
                return;
            }

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
            cmdrLastPlayed.innerText = i18n.t("sidePanel:lastPlayedOn", {
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
            cmdrPlayTime.innerText = i18n.t("sidePanel:journeyedFor", {
                nbHours: Math.ceil(latestSave.player.timePlayedSeconds / 60 / 60),
            });
            cmdrHeaderText.appendChild(cmdrPlayTime);

            const cmdrHeaderButtons = document.createElement("div");
            cmdrHeaderButtons.classList.add("cmdrHeaderButtons");
            cmdrHeader.appendChild(cmdrHeaderButtons);

            const continueButton = document.createElement("button");
            continueButton.classList.add("icon", "large");
            continueButton.addEventListener("click", () => {
                this.soundPlayer.playNow(SoundType.CLICK);
                this.onLoadSaveObservable.notifyObservers(latestSave);
            });
            cmdrHeaderButtons.appendChild(continueButton);

            const loadIcon = document.createElement("img");
            loadIcon.src = loadIconPath;
            continueButton.appendChild(loadIcon);

            const shareButton = document.createElement("button");
            shareButton.classList.add("icon", "large");
            shareButton.addEventListener("click", async () => {
                this.soundPlayer.playNow(SoundType.CLICK);
                const url = createUrlFromSave(latestSave);
                if (url === null) {
                    await alertModal("Could not create a URL from the save file.", this.soundPlayer);
                    return;
                }
                await navigator.clipboard.writeText(url.toString()).then(() => {
                    this.notificationManager.create(
                        NotificationOrigin.GENERAL,
                        NotificationIntent.SUCCESS,
                        i18n.t("notifications:copiedToClipboard"),
                        5000,
                    );
                });
            });
            cmdrHeaderButtons.appendChild(shareButton);

            const shareIcon = document.createElement("img");
            shareIcon.src = shareIconPath;
            shareButton.appendChild(shareIcon);

            const savesList = document.createElement("div");

            savesList.classList.add("savesList");
            savesList.classList.add("hidden"); // Hidden by default
            cmdrDiv.appendChild(savesList);

            allCmdrSaves.forEach((save) => {
                const saveDiv = this.createSaveDiv(
                    save,
                    cmdrSaves.auto.includes(save),
                    starSystemDatabase,
                    saveManager,
                );
                savesList.appendChild(saveDiv);
            });

            const expandIcon = document.createElement("img");
            expandIcon.src = expandIconPath;

            const collapseIcon = document.createElement("img");
            collapseIcon.src = collapseIconPath;

            const expandButton = document.createElement("button");
            expandButton.classList.add("expandButton", "icon", "large");
            expandButton.appendChild(expandIcon);
            expandButton.addEventListener("click", () => {
                this.soundPlayer.playNow(SoundType.CLICK);
                savesList.classList.toggle("hidden");
                expandButton.innerHTML = "";
                expandButton.appendChild(savesList.classList.contains("hidden") ? expandIcon : collapseIcon);
            });
            cmdrHeaderButtons.appendChild(expandButton);
        }
    }

    private createSaveDiv(
        save: DeepReadonly<Save>,
        isAutoSave: boolean,
        starSystemDatabase: StarSystemDatabase,
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
            throw new Error("locationToUse is undefined");
        }
        if (locationToUse.type === "inSpaceship") {
            throw new Error("Spaceship inside a spaceship is not supported yet");
        }
        const isLanded = locationToUse.type === "atStation";
        const nearestObject = starSystemDatabase.getObjectModelByUniverseId(locationToUse.universeObjectId);
        saveLocation.innerText = i18n.t(isLanded ? "sidePanel:landedAt" : "sidePanel:near", {
            location: nearestObject?.name ?? i18n.t("sidePanel:locationNotFound"),
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
            this.soundPlayer.playNow(SoundType.CLICK);
            this.onLoadSaveObservable.notifyObservers(save);
        });
        saveButtons.appendChild(loadButton);

        const loadIcon = document.createElement("img");
        loadIcon.src = loadIconPath;
        loadButton.appendChild(loadIcon);

        const shareButton = document.createElement("button");
        shareButton.classList.add("icon", "large");
        shareButton.addEventListener("click", async () => {
            this.soundPlayer.playNow(SoundType.CLICK);
            const url = createUrlFromSave(save);
            if (url === null) {
                await alertModal("Could not create a URL from the save file.", this.soundPlayer);
                return;
            }
            await navigator.clipboard.writeText(url.toString()).then(() => {
                this.notificationManager.create(
                    NotificationOrigin.GENERAL,
                    NotificationIntent.INFO,
                    i18n.t("notifications:copiedToClipboard"),
                    5000,
                );
            });
        });
        saveButtons.appendChild(shareButton);

        const shareIcon = document.createElement("img");
        shareIcon.src = shareIconPath;
        shareButton.appendChild(shareIcon);

        const downloadButton = document.createElement("button");
        downloadButton.classList.add("icon", "large");
        downloadButton.addEventListener("click", () => {
            this.soundPlayer.playNow(SoundType.CLICK);
            const blob = new Blob([JSON.stringify(save)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${save.player.name}_${save.timestamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
        saveButtons.appendChild(downloadButton);

        const downloadIcon = document.createElement("img");
        downloadIcon.src = downloadIconPath;
        downloadButton.appendChild(downloadIcon);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("danger", "icon", "large");
        deleteButton.addEventListener("click", async () => {
            this.soundPlayer.playNow(SoundType.CLICK);

            const shouldProceed = await promptModalBoolean(i18n.t("sidePanel:deleteSavePrompt"), this.soundPlayer);
            if (!shouldProceed) return;

            await saveManager.deleteSaveForCmdr(save.player.uuid, save.uuid);

            const cmdrSaves = await saveManager.getSavesForCmdr(save.player.uuid);
            if (cmdrSaves === undefined) return;

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

    private async loadSaveFile(
        file: File,
        starSystemDatabase: StarSystemDatabase,
    ): Promise<Result<Save, SaveLoadingError>> {
        const saveFileDataResult = await parseSaveFile(file, starSystemDatabase);
        if (!saveFileDataResult.success) {
            console.error(saveFileDataResult.error);
            await alertModal(saveLoadingErrorToI18nString(saveFileDataResult.error), this.soundPlayer);
            return saveFileDataResult;
        }

        this.onLoadSaveObservable.notifyObservers(saveFileDataResult.value);
        return saveFileDataResult;
    }
}
