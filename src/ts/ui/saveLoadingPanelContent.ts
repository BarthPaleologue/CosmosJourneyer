import { Observable } from "@babylonjs/core/Misc/observable";
import i18n from "../i18n";
import { createNotification, NotificationIntent, NotificationOrigin } from "../utils/notification";
import { createUrlFromSave, getSavesFromLocalStorage, parseSaveFileData, SaveFileData, writeSavesToLocalStorage } from "../saveFile/saveFileData";
import { Sounds } from "../assets/sounds";
import expandIconPath from "../../asset/icons/expand.webp";
import collapseIconPath from "../../asset/icons/collapse.webp";
import loadIconPath from "../../asset/icons/play.webp";
import editIconPath from "../../asset/icons/edit.webp";
import downloadIconPath from "../../asset/icons/download.webp";
import trashIconPath from "../../asset/icons/trash.webp";
import shareIconPath from "../../asset/icons/link.webp";
import { promptModalBoolean, promptModalString } from "../utils/dialogModal";
import { getObjectModelByUniverseId } from "../utils/coordinates/orbitalObjectId";

export class SaveLoadingPanelContent {
    readonly htmlRoot: HTMLElement;

    readonly cmdrList: HTMLElement;

    readonly onLoadSaveObservable: Observable<SaveFileData> = new Observable<SaveFileData>();

    constructor() {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("saveLoadingPanelContent");

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
            if (file.type !== "application/json") {
                dropFileZone.classList.add("invalid");
                alert("File is not a JSON file");
                return;
            }

            const saveFileData = await this.parseSaveFile(file);
            this.onLoadSaveObservable.notifyObservers(saveFileData);
        });

        dropFileZone.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "application/json";
            fileInput.onchange = async () => {
                if (fileInput.files === null) throw new Error("fileInput.files is null");
                if (fileInput.files.length === 0) throw new Error("fileInput.files is empty");
                const file = fileInput.files[0];
                const saveFileData = await this.parseSaveFile(file);
                this.onLoadSaveObservable.notifyObservers(saveFileData);
            };
            fileInput.click();
        });

        this.cmdrList = document.createElement("div");
        this.cmdrList.classList.add("cmdrList");
        this.htmlRoot.appendChild(this.cmdrList);
    }

    populateCmdrList() {
        this.cmdrList.innerHTML = "";

        const saves = getSavesFromLocalStorage();

        const flatSortedSaves: Map<string, SaveFileData[]> = new Map();
        for (const uuid in saves) {
            flatSortedSaves.set(uuid, saves[uuid].manual.concat(saves[uuid].auto));
        }
        flatSortedSaves.forEach((saves) => {
            saves.sort((a, b) => b.timestamp - a.timestamp);
        });

        // Get all cmdr UUIDs
        const cmdrUuids = Object.keys(saves);

        // Sort cmdr UUIDs by latest save timestamp to have the most recent save at the top
        cmdrUuids.sort((a, b) => {
            const aLatestSave = flatSortedSaves.get(a)?.at(0);
            const bLatestSave = flatSortedSaves.get(b)?.at(0);
            if (aLatestSave === undefined || bLatestSave === undefined) throw new Error("aLatestSave or bLatestSave is undefined");
            return bLatestSave.timestamp - aLatestSave.timestamp;
        });

        cmdrUuids.forEach((cmdrUuid) => {
            const cmdrDiv = document.createElement("div");
            cmdrDiv.classList.add("cmdr");
            this.cmdrList.appendChild(cmdrDiv);

            const cmdrSaves = saves[cmdrUuid];

            const autoSaves = cmdrSaves.auto;

            const manualSaves = cmdrSaves.manual;

            const allSaves = autoSaves.concat(manualSaves);
            allSaves.sort((a, b) => b.timestamp - a.timestamp);

            const latestSave = allSaves[0];

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
                    val: { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }
                }
            });
            cmdrHeaderText.appendChild(cmdrLastPlayed);

            const cmdrPlayTime = document.createElement("p");
            cmdrPlayTime.innerText = i18n.t("sidePanel:journeyedFor", { nbHours: Math.ceil(latestSave.player.timePlayedSeconds / 60 / 60) });
            cmdrHeaderText.appendChild(cmdrPlayTime);

            const cmdrHeaderButtons = document.createElement("div");
            cmdrHeaderButtons.classList.add("cmdrHeaderButtons");
            cmdrHeader.appendChild(cmdrHeaderButtons);

            const continueButton = document.createElement("button");
            continueButton.classList.add("icon", "large");
            continueButton.addEventListener("click", () => {
                Sounds.MENU_SELECT_SOUND.play();
                this.onLoadSaveObservable.notifyObservers(latestSave);
            });
            cmdrHeaderButtons.appendChild(continueButton);

            const loadIcon = document.createElement("img");
            loadIcon.src = loadIconPath;
            continueButton.appendChild(loadIcon);

            const shareButton = document.createElement("button");
            shareButton.classList.add("icon", "large");
            shareButton.addEventListener("click", async () => {
                Sounds.MENU_SELECT_SOUND.play();
                const url = createUrlFromSave(latestSave);
                await navigator.clipboard.writeText(url.toString()).then(() => {
                    createNotification(NotificationOrigin.GENERAL, NotificationIntent.SUCCESS, i18n.t("notifications:copiedToClipboard"), 5000);
                });
            });
            cmdrHeaderButtons.appendChild(shareButton);

            const shareIcon = document.createElement("img");
            shareIcon.src = shareIconPath;
            shareButton.appendChild(shareIcon);

            const editNameButton = document.createElement("button");
            editNameButton.classList.add("icon", "large");
            editNameButton.addEventListener("click", async () => {
                Sounds.MENU_SELECT_SOUND.play();
                const newName = await promptModalString(i18n.t("sidePanel:cmdrNameChangePrompt"), latestSave.player.name);
                if (newName === null) return;

                autoSaves.forEach((autoSave) => {
                    autoSave.player.name = newName;
                });

                manualSaves.forEach((manualSave) => {
                    manualSave.player.name = newName;
                });

                cmdrName.innerText = newName;

                writeSavesToLocalStorage(saves);
            });
            cmdrHeaderButtons.appendChild(editNameButton);

            const editIcon = document.createElement("img");
            editIcon.src = editIconPath;
            editNameButton.appendChild(editIcon);

            const savesList = document.createElement("div");

            savesList.classList.add("savesList");
            savesList.classList.add("hidden"); // Hidden by default
            cmdrDiv.appendChild(savesList);

            allSaves.forEach((save) => {
                const saveDiv = this.createSaveDiv(save, autoSaves.includes(save));
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
                Sounds.MENU_SELECT_SOUND.play();
                savesList.classList.toggle("hidden");
                expandButton.innerHTML = "";
                expandButton.appendChild(savesList.classList.contains("hidden") ? expandIcon : collapseIcon);
            });
            cmdrHeaderButtons.appendChild(expandButton);
        });
    }

    private createSaveDiv(save: SaveFileData, isAutoSave: boolean): HTMLElement {
        const saveDiv = document.createElement("div");
        saveDiv.classList.add("saveContainer");

        const saveText = document.createElement("div");
        saveText.classList.add("saveText");
        saveDiv.appendChild(saveText);

        const saveName = document.createElement("p");
        saveName.innerText = (isAutoSave ? `[Auto] ` : "") + new Date(save.timestamp).toLocaleString();
        saveText.appendChild(saveName);

        const saveLocation = document.createElement("p");
        const isLanded = save.padNumber !== undefined;
        saveLocation.innerText = i18n.t(isLanded ? "sidePanel:landedAt" : "sidePanel:near", {
            location: getObjectModelByUniverseId(save.universeCoordinates.universeObjectId).name,
            interpolation: {
                escapeValue: false
            }
        });
        saveText.appendChild(saveLocation);

        const saveButtons = document.createElement("div");
        saveButtons.classList.add("saveButtons");
        saveDiv.appendChild(saveButtons);

        const loadButton = document.createElement("button");
        loadButton.classList.add("icon", "large");
        loadButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            this.onLoadSaveObservable.notifyObservers(save);
        });
        saveButtons.appendChild(loadButton);

        const loadIcon = document.createElement("img");
        loadIcon.src = loadIconPath;
        loadButton.appendChild(loadIcon);

        const shareButton = document.createElement("button");
        shareButton.classList.add("icon", "large");
        shareButton.addEventListener("click", async () => {
            Sounds.MENU_SELECT_SOUND.play();
            const url = createUrlFromSave(save);
            await navigator.clipboard.writeText(url.toString()).then(() => {
                createNotification(NotificationOrigin.GENERAL, NotificationIntent.INFO, i18n.t("notifications:copiedToClipboard"), 5000);
            });
        });
        saveButtons.appendChild(shareButton);

        const shareIcon = document.createElement("img");
        shareIcon.src = shareIconPath;
        shareButton.appendChild(shareIcon);

        const downloadButton = document.createElement("button");
        downloadButton.classList.add("icon", "large");
        downloadButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
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
            Sounds.MENU_SELECT_SOUND.play();

            const shouldProceed = await promptModalBoolean(i18n.t("sidePanel:deleteSavePrompt"));
            if (!shouldProceed) return;

            const saves = getSavesFromLocalStorage();

            if (isAutoSave) {
                saves[save.player.uuid].auto = saves[save.player.uuid].auto.filter((autoSave) => autoSave.timestamp !== save.timestamp);
            } else {
                saves[save.player.uuid].manual = saves[save.player.uuid].manual.filter((manualSave) => manualSave.timestamp !== save.timestamp);
            }

            if (saves[save.player.uuid].auto.length === 0 && saves[save.player.uuid].manual.length === 0) {
                delete saves[save.player.uuid];
                saveDiv.parentElement?.parentElement?.remove();
            }

            saveDiv.remove();

            writeSavesToLocalStorage(saves);
        });
        saveButtons.appendChild(deleteButton);

        const trashIcon = document.createElement("img");
        trashIcon.src = trashIconPath;
        deleteButton.appendChild(trashIcon);

        return saveDiv;
    }

    private async parseSaveFile(rawSaveFile: File): Promise<SaveFileData> {
        return new Promise<SaveFileData>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target === null) throw new Error("event.target is null");
                const data = event.target.result as string;
                const loadingSaveData = parseSaveFileData(data);
                loadingSaveData.logs.forEach((log) => createNotification(NotificationOrigin.GENERAL, NotificationIntent.WARNING, log, 60_000));
                if (loadingSaveData.data === null) return;
                resolve(loadingSaveData.data);
            };
            reader.readAsText(rawSaveFile);
        });
    }
}
