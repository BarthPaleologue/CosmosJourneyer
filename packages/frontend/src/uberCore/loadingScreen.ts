import { type ILoadingScreen } from "@babylonjs/core/Loading/loadingScreen";
import { type Nullable } from "@babylonjs/core/types";

import i18next from "@/i18n";

export class LoadingScreen implements ILoadingScreen {
    private loadingDiv: Nullable<HTMLDivElement> = null;
    private loadingTextDiv: Nullable<HTMLDivElement> = null;

    private title: Nullable<HTMLElement> = null;

    private progressBar: Nullable<HTMLDivElement> = null;

    private loadingText = "";

    private loadingDivBackgroundColor = "black";

    private canvas: HTMLCanvasElement;

    /**
     * Creates a new default loading screen
     * @param canvas defines the canvas used to render the scene
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    /**
     * Function called to display the loading screen
     */
    public displayLoadingUI(): void {
        if (this.loadingDiv) {
            // Do not add a loading screen if there is already one
            return;
        }

        this.loadingDiv = document.createElement("div");
        this.loadingDiv.id = "babylonjsLoadingDiv";

        this.title = document.createElement("h1");
        this.title.innerText = "Cosmos Journeyer";
        this.loadingDiv.appendChild(this.title);

        const progressBarContainer = document.createElement("div");
        progressBarContainer.classList.add("progressBarContainer");
        this.loadingDiv.appendChild(progressBarContainer);

        this.progressBar = document.createElement("div");
        this.progressBar.classList.add("progressBar");
        progressBarContainer.appendChild(this.progressBar);

        // Loading text
        this.loadingTextDiv = document.createElement("div");
        this.loadingTextDiv.classList.add("loadingText");

        this.loadingDiv.appendChild(this.loadingTextDiv);

        //set the predefined text
        this.loadingTextDiv.innerText = this.loadingText;
        // Loading img
        const imgBack = new Image();
        imgBack.src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODAuMTcgMjA4LjA0Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2UwNjg0Yjt9LmNscy0ze2ZpbGw6I2JiNDY0Yjt9LmNscy00e2ZpbGw6I2UwZGVkODt9LmNscy01e2ZpbGw6I2Q1ZDJjYTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkJhYnlsb25Mb2dvPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iUGFnZV9FbGVtZW50cyIgZGF0YS1uYW1lPSJQYWdlIEVsZW1lbnRzIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05MC4wOSwwLDAsNTJWMTU2bDkwLjA5LDUyLDkwLjA4LTUyVjUyWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxODAuMTcgNTIuMDEgMTUxLjk3IDM1LjczIDEyNC44NSA1MS4zOSAxNTMuMDUgNjcuNjcgMTgwLjE3IDUyLjAxIi8+PHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjI3LjEyIDY3LjY3IDExNy4yMSAxNS42NiA5MC4wOCAwIDAgNTIuMDEgMjcuMTIgNjcuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iNjEuODkgMTIwLjMgOTAuMDggMTM2LjU4IDExOC4yOCAxMjAuMyA5MC4wOCAxMDQuMDIgNjEuODkgMTIwLjMiLz48cG9seWdvbiBjbGFzcz0iY2xzLTMiIHBvaW50cz0iMTUzLjA1IDY3LjY3IDE1My4wNSAxNDAuMzcgOTAuMDggMTc2LjcyIDI3LjEyIDE0MC4zNyAyNy4xMiA2Ny42NyAwIDUyLjAxIDAgMTU2LjAzIDkwLjA4IDIwOC4wNCAxODAuMTcgMTU2LjAzIDE4MC4xNyA1Mi4wMSAxNTMuMDUgNjcuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTMiIHBvaW50cz0iOTAuMDggNzEuNDYgNjEuODkgODcuNzQgNjEuODkgMTIwLjMgOTAuMDggMTA0LjAyIDExOC4yOCAxMjAuMyAxMTguMjggODcuNzQgOTAuMDggNzEuNDYiLz48cG9seWdvbiBjbGFzcz0iY2xzLTQiIHBvaW50cz0iMTUzLjA1IDY3LjY3IDExOC4yOCA4Ny43NCAxMTguMjggMTIwLjMgOTAuMDggMTM2LjU4IDkwLjA4IDE3Ni43MiAxNTMuMDUgMTQwLjM3IDE1My4wNSA2Ny42NyIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtNSIgcG9pbnRzPSIyNy4xMiA2Ny42NyA2MS44OSA4Ny43NCA2MS44OSAxMjAuMyA5MC4wOCAxMzYuNTggOTAuMDggMTc2LjcyIDI3LjEyIDE0MC4zNyAyNy4xMiA2Ny42NyIvPjwvZz48L2c+PC9zdmc+`;

        imgBack.style.width = "50%";
        imgBack.style.gridColumn = "1";
        imgBack.style.gridRow = "1";
        imgBack.style.top = "50%";
        imgBack.style.left = "50%";
        imgBack.style.transform = "translate(-50%, -50%)";
        imgBack.style.position = "absolute";

        const imageSpinnerContainer = document.createElement("div");
        imageSpinnerContainer.classList.add("imageSpinnerContainer");

        // Loading spinner
        const imgSpinner = new Image();
        imgSpinner.classList.add("loadingSpinner");
        imgSpinner.src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzOTIgMzkyIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2UwNjg0Yjt9LmNscy0ye2ZpbGw6bm9uZTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlNwaW5uZXJJY29uPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iU3Bpbm5lciI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDAuMjEsMTI2LjQzYzMuNy03LjMxLDcuNjctMTQuNDQsMTItMjEuMzJsMy4zNi01LjEsMy41Mi01YzEuMjMtMS42MywyLjQxLTMuMjksMy42NS00LjkxczIuNTMtMy4yMSwzLjgyLTQuNzlBMTg1LjIsMTg1LjIsMCwwLDEsODMuNCw2Ny40M2EyMDgsMjA4LDAsMCwxLDE5LTE1LjY2YzMuMzUtMi40MSw2Ljc0LTQuNzgsMTAuMjUtN3M3LjExLTQuMjgsMTAuNzUtNi4zMmM3LjI5LTQsMTQuNzMtOCwyMi41My0xMS40OSwzLjktMS43Miw3Ljg4LTMuMywxMi00LjY0YTEwNC4yMiwxMDQuMjIsMCwwLDEsMTIuNDQtMy4yMyw2Mi40NCw2Mi40NCwwLDAsMSwxMi43OC0xLjM5QTI1LjkyLDI1LjkyLDAsMCwxLDE5NiwyMS40NGE2LjU1LDYuNTUsMCwwLDEsMi4wNSw5LDYuNjYsNi42NiwwLDAsMS0xLjY0LDEuNzhsLS40MS4yOWEyMi4wNywyMi4wNywwLDAsMS01Ljc4LDMsMzAuNDIsMzAuNDIsMCwwLDEtNS42NywxLjYyLDM3LjgyLDM3LjgyLDAsMCwxLTUuNjkuNzFjLTEsMC0xLjkuMTgtMi44NS4yNmwtMi44NS4yNHEtNS43Mi41MS0xMS40OCwxLjFjLTMuODQuNC03LjcxLjgyLTExLjU4LDEuNGExMTIuMzQsMTEyLjM0LDAsMCwwLTIyLjk0LDUuNjFjLTMuNzIsMS4zNS03LjM0LDMtMTAuOTQsNC42NHMtNy4xNCwzLjUxLTEwLjYsNS41MUExNTEuNiwxNTEuNiwwLDAsMCw2OC41Niw4N0M2Ny4yMyw4OC40OCw2Niw5MCw2NC42NCw5MS41NnMtMi41MSwzLjE1LTMuNzUsNC43M2wtMy41NCw0LjljLTEuMTMsMS42Ni0yLjIzLDMuMzUtMy4zMyw1YTEyNywxMjcsMCwwLDAtMTAuOTMsMjEuNDksMS41OCwxLjU4LDAsMSwxLTMtMS4xNVM0MC4xOSwxMjYuNDcsNDAuMjEsMTI2LjQzWiIvPjxyZWN0IGNsYXNzPSJjbHMtMiIgd2lkdGg9IjM5MiIgaGVpZ2h0PSIzOTIiLz48L2c+PC9nPjwvc3ZnPg==`;

        imageSpinnerContainer.appendChild(imgBack);
        imageSpinnerContainer.appendChild(imgSpinner);

        progressBarContainer.appendChild(imageSpinnerContainer);

        this.resizeLoadingUI();

        window.addEventListener("resize", this.resizeLoadingUI);

        this.loadingDiv.style.backgroundColor = this.loadingDivBackgroundColor;
        document.body.appendChild(this.loadingDiv);

        this.loadingDiv.style.opacity = "1";
    }

    /**
     * Function called to hide the loading screen
     */
    public hideLoadingUI(): void {
        if (!this.loadingDiv) {
            return;
        }

        const onTransitionEnd = () => {
            if (this.loadingTextDiv) {
                this.loadingTextDiv.remove();
                this.loadingTextDiv = null;
            }
            if (this.loadingDiv) {
                this.loadingDiv.remove();
                this.loadingDiv = null;
            }
            window.removeEventListener("resize", this.resizeLoadingUI);
        };

        this.loadingDiv.style.opacity = "0";
        this.loadingDiv.addEventListener("transitionend", onTransitionEnd);
    }

    public setProgress(startedCount: number, completedCount: number) {
        const percentage = (completedCount / startedCount) * 100;
        this.loadingUIText = `${i18next.t("common:loading")} (${completedCount}/${startedCount})`;
        this.progressBar?.style.setProperty("--progress", `${percentage}%`);
    }

    /**
     * Gets or sets the text to display while loading
     */
    public set loadingUIText(text: string) {
        this.loadingText = text;

        if (this.loadingTextDiv) {
            this.loadingTextDiv.innerHTML = this.loadingText;
        }
    }

    public get loadingUIText(): string {
        return this.loadingText;
    }

    /**
     * Gets or sets the color to use for the background
     */
    public get loadingUIBackgroundColor(): string {
        return this.loadingDivBackgroundColor;
    }

    public set loadingUIBackgroundColor(color: string) {
        this.loadingDivBackgroundColor = color;

        if (!this.loadingDiv) {
            return;
        }

        this.loadingDiv.style.backgroundColor = this.loadingDivBackgroundColor;
    }

    // Resize
    private resizeLoadingUI = () => {
        const canvasRect = this.canvas.getBoundingClientRect();
        const canvasPositioning = window.getComputedStyle(this.canvas).position;

        if (!this.loadingDiv) {
            return;
        }

        this.loadingDiv.style.position = canvasPositioning === "fixed" ? "fixed" : "absolute";
        this.loadingDiv.style.left = `${canvasRect.left}px`;
        this.loadingDiv.style.top = `${canvasRect.top}px`;
        this.loadingDiv.style.width = `${canvasRect.width}px`;
        this.loadingDiv.style.height = `${canvasRect.height}px`;
    };
}
