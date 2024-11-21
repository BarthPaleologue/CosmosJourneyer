import { Observable } from "@babylonjs/core/Misc/observable";
import i18n from "../i18n";
import { LocalStorageAutoSaves, LocalStorageManualSaves, parseSaveFileData, SaveFileData } from "../saveFile/saveFileData";
import { createNotification } from "../utils/notification";
import { Settings } from "../settings";
import { Sounds } from "../assets/sounds";
import expandIconPath from "../../asset/icons/expand.webp";
import collapseIconPath from "../../asset/icons/collapse.webp";
import loadIconPath from "../../asset/icons/play.webp";
import editIconPath from "../../asset/icons/edit.webp";
import downloadIconPath from "../../asset/icons/download.webp";
import trashIconPath from "../../asset/icons/trash.webp";
import { promptModal } from "../utils/dialogModal";

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

        this.populateCmdrList();
    }

    populateCmdrList() {
        this.cmdrList.innerHTML = "";

        const autoSavesDict: LocalStorageAutoSaves = JSON.parse(localStorage.getItem(Settings.AUTO_SAVE_KEY) ?? "{}");
        const manualSavesDict: LocalStorageManualSaves = JSON.parse(localStorage.getItem(Settings.MANUAL_SAVE_KEY) ?? "{}");

        // Get all cmdr UUIDs (union of auto saves and manual saves)
        const cmdrUuids = Object.keys(autoSavesDict);
        Object.keys(manualSavesDict).forEach((cmdrUuid) => {
            if (!cmdrUuids.includes(cmdrUuid)) cmdrUuids.push(cmdrUuid);
        });

        // Sort cmdr UUIDs by latest save timestamp to have the most recent save at the top
        cmdrUuids.sort((a, b) => {
            const aLatestSave = autoSavesDict[a] ?? manualSavesDict[a][0];
            const bLatestSave = autoSavesDict[b] ?? manualSavesDict[b][0];
            return bLatestSave.timestamp - aLatestSave.timestamp;
        });

        cmdrUuids.forEach((cmdrUuid) => {
            const cmdrDiv = document.createElement("div");
            cmdrDiv.classList.add("cmdr");
            this.cmdrList.appendChild(cmdrDiv);

            const manualSaves = manualSavesDict[cmdrUuid] ?? [];

            const latestSave = autoSavesDict[cmdrUuid] ?? manualSaves[0];

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
                    val: { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" },
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

            const editNameButton = document.createElement("button");
            editNameButton.classList.add("icon", "large");
            editNameButton.addEventListener("click", async () => {
                Sounds.MENU_SELECT_SOUND.play();
                const newName = await promptModal(i18n.t("sidePanel:cmdrNameChangePrompt"), latestSave.player.name);
                if (newName === null) return;
                
                if(autoSavesDict[cmdrUuid] !== undefined) {
                    autoSavesDict[cmdrUuid].player.name = newName;
                }
                
                manualSaves.forEach((manualSave) => {
                    manualSave.player.name = newName;
                });
                
                cmdrName.innerText = newName;

                localStorage.setItem(Settings.AUTO_SAVE_KEY, JSON.stringify(autoSavesDict));
                localStorage.setItem(Settings.MANUAL_SAVE_KEY, JSON.stringify(manualSavesDict));
            });
            cmdrHeaderButtons.appendChild(editNameButton);

            const editIcon = document.createElement("img");
            editIcon.src = editIconPath;
            editNameButton.appendChild(editIcon);

            const savesList = document.createElement("div");

            savesList.classList.add("savesList");
            savesList.classList.add("hidden"); // Hidden by default
            cmdrDiv.appendChild(savesList);

            const autoSaveDiv = this.createSaveDiv(autoSavesDict[cmdrUuid], true);
            savesList.appendChild(autoSaveDiv);

            manualSaves.forEach((manualSave) => {
                const manualSaveDiv = this.createSaveDiv(manualSave, false);
                savesList.appendChild(manualSaveDiv);
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
        deleteButton.addEventListener("click", () => {
            Sounds.MENU_SELECT_SOUND.play();
            const autoSavesDict: LocalStorageAutoSaves = JSON.parse(localStorage.getItem(Settings.AUTO_SAVE_KEY) ?? "{}");
            const manualSavesDict: LocalStorageManualSaves = JSON.parse(localStorage.getItem(Settings.MANUAL_SAVE_KEY) ?? "{}");

            if (isAutoSave) {
                delete autoSavesDict[save.player.uuid];
            } else {
                manualSavesDict[save.player.uuid] = manualSavesDict[save.player.uuid].filter((manualSave) => manualSave.timestamp !== save.timestamp);
            }

            if (autoSavesDict[save.player.uuid] === undefined && (manualSavesDict[save.player.uuid] ?? []).length === 0) {
                delete manualSavesDict[save.player.uuid];
                saveDiv.parentElement?.parentElement?.remove();
            }

            saveDiv.remove();

            localStorage.setItem(Settings.AUTO_SAVE_KEY, JSON.stringify(autoSavesDict));
            localStorage.setItem(Settings.MANUAL_SAVE_KEY, JSON.stringify(manualSavesDict));
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
                loadingSaveData.logs.forEach((log) => createNotification(log, 60_000));
                if (loadingSaveData.data === null) return;
                resolve(loadingSaveData.data);
            };
            reader.readAsText(rawSaveFile);
        });
    }
}
