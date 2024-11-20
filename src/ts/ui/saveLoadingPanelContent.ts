import { Observable } from "@babylonjs/core/Misc/observable";
import i18n from "../i18n";
import { LocalStorageAutoSaves, LocalStorageManualSaves, parseSaveFileData, SaveFileData } from "../saveFile/saveFileData";
import { createNotification } from "../utils/notification";
import { Settings } from "../settings";

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

            const saveFileData = await this.parseFile(file);
            this.onLoadSaveObservable.notifyObservers(saveFileData);
        });

        dropFileZone.addEventListener("click", () => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "application/json";
            fileInput.onchange = async () => {
                if (fileInput.files === null) throw new Error("fileInput.files is null");
                if (fileInput.files.length === 0) throw new Error("fileInput.files is empty");
                const file = fileInput.files[0];
                const saveFileData = await this.parseFile(file);
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
        const autoSavesDict: LocalStorageAutoSaves = JSON.parse(localStorage.getItem(Settings.AUTO_SAVE_KEY) ?? "{}");
        const manualSavesDict: LocalStorageManualSaves = JSON.parse(localStorage.getItem(Settings.MANUAL_SAVE_KEY) ?? "{}");

        // Get all cmdr UUIDs (union of auto saves and manual saves)
        const cmdrUuids = Object.keys(autoSavesDict);
        Object.keys(manualSavesDict).forEach((cmdrUuid) => {
            if (!cmdrUuids.includes(cmdrUuid)) cmdrUuids.push(cmdrUuid);
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

            const cmdrName = document.createElement("h3");
            cmdrName.innerText = latestSave.player.name;
            cmdrHeader.appendChild(cmdrName);

            const cmdrLastPlayed = document.createElement("p");
            cmdrLastPlayed.innerText = `Last played on ${new Date(latestSave.timestamp).toLocaleString()}`;
            cmdrHeader.appendChild(cmdrLastPlayed);

            const cmdrPlayTime = document.createElement("p");
            cmdrPlayTime.innerText = `Play time: ${latestSave.player.timePlayedSeconds} seconds`;
            cmdrHeader.appendChild(cmdrPlayTime);

            const continueButton = document.createElement("button");
            continueButton.innerText = i18n.t("sidePanel:continue");
            continueButton.addEventListener("click", () => {
                this.onLoadSaveObservable.notifyObservers(latestSave);
            });
            cmdrDiv.appendChild(continueButton);

            const savesList = document.createElement("div");
            savesList.classList.add("savesList");
            cmdrDiv.appendChild(savesList);

            const autoSaveDiv = this.createSaveDiv(autoSavesDict[cmdrUuid], true);
            savesList.appendChild(autoSaveDiv);

            manualSaves.forEach((manualSave) => {
                const manualSaveDiv = this.createSaveDiv(manualSave, false);
                savesList.appendChild(manualSaveDiv);
            });

            const expandButton = document.createElement("div");
            expandButton.classList.add("expandButton");
            expandButton.innerText = "+";
            expandButton.addEventListener("click", () => {
                cmdrDiv.classList.toggle("expanded");
                expandButton.innerText = cmdrDiv.classList.contains("expanded") ? "-" : "+";
            });
            cmdrHeader.appendChild(expandButton);
        });
    }

    private createSaveDiv(save: SaveFileData, isAutoSave: boolean): HTMLElement {
        const saveDiv = document.createElement("div");
        saveDiv.classList.add("saveContainer");

        const saveHeader = document.createElement("div");
        saveHeader.classList.add("saveHeader");
        saveDiv.appendChild(saveHeader);

        const saveName = document.createElement("p");
        saveName.innerText = (isAutoSave ? `[Auto] ` : "") + new Date(save.timestamp).toLocaleString();
        saveHeader.appendChild(saveName);

        const saveButtons = document.createElement("div");
        saveButtons.classList.add("saveButtons");
        saveDiv.appendChild(saveButtons);

        const loadButton = document.createElement("button");
        loadButton.innerText = i18n.t("sidePanel:load");
        loadButton.addEventListener("click", () => {
            this.onLoadSaveObservable.notifyObservers(save);
        });
        saveButtons.appendChild(loadButton);

        const downloadButton = document.createElement("button");
        downloadButton.innerText = i18n.t("sidePanel:download");
        downloadButton.addEventListener("click", () => {
            const blob = new Blob([JSON.stringify(save)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${save.player.name}_${save.timestamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
        saveButtons.appendChild(downloadButton);

        const deleteButton = document.createElement("button");
        deleteButton.innerText = i18n.t("sidePanel:delete");
        deleteButton.addEventListener("click", () => {
            const autoSavesDict: LocalStorageAutoSaves = JSON.parse(localStorage.getItem(Settings.AUTO_SAVE_KEY) ?? "{}");
            const manualSavesDict: LocalStorageManualSaves = JSON.parse(localStorage.getItem(Settings.MANUAL_SAVE_KEY) ?? "{}");

            if (isAutoSave) {
                delete autoSavesDict[save.player.uuid];
            } else {
                manualSavesDict[save.player.uuid] = manualSavesDict[save.player.uuid].filter((manualSave) => manualSave.timestamp !== save.timestamp);
            }

            saveDiv.remove();
        });
        saveButtons.appendChild(deleteButton);

        return saveDiv;
    }

    private async parseFile(file: File): Promise<SaveFileData> {
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
            reader.readAsText(file);
        });
    }
}
