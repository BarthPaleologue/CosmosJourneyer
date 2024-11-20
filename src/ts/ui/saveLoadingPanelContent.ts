import { Observable } from "@babylonjs/core/Misc/observable";
import i18n from "../i18n";
import { parseSaveFileData, SaveFileData } from "../saveFile/saveFileData";
import { createNotification } from "../utils/notification";

export class SaveLoadingPanelContent {
    readonly htmlRoot: HTMLElement;

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
