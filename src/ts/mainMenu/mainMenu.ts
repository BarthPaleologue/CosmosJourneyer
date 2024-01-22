import { UberScene } from "../uberCore/uberScene";
import { DefaultControls } from "../defaultController/defaultControls";
import { StarSystemView } from "../starSystem/StarSystemView";
import { StarSystemController } from "../starSystem/starSystemController";
import { positionNearObjectWithStarVisible } from "../utils/positionNearObject";
import { BODY_TYPE } from "../model/common";
import { EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import mainMenuHTML from "../../html/mainMenu.html";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../uberCore/transforms/animations/translation";
import { Observable } from "@babylonjs/core/Misc/observable";
import { SystemSeed } from "../utils/systemSeed";
import { parseSaveFileData, SaveFileData } from "../saveFile/saveFileData";

export class MainMenu {
    readonly scene: UberScene;
    readonly controls: DefaultControls;

    readonly starSystemView: StarSystemView;
    readonly starSystemController: StarSystemController;

    readonly onStartObservable = new Observable<void>();
    readonly onLoadSaveObservable = new Observable<SaveFileData>();
    readonly onContributeObservable = new Observable<void>();
    readonly onCreditsObservable = new Observable<void>();
    readonly onAboutObservable = new Observable<void>();

    private htmlRoot: HTMLElement | null = null;
    private title: HTMLElement | null = null;

    private activeRightPanel: HTMLElement | null = null;
    private loadSavePanel: HTMLElement | null = null;
    private contributePanel: HTMLElement | null = null;
    private creditsPanel: HTMLElement | null = null;
    private aboutPanel: HTMLElement | null = null;

    constructor(starSystemView: StarSystemView) {
        this.starSystemView = starSystemView;

        this.scene = this.starSystemView.scene;
        this.controls = this.starSystemView.getDefaultControls();

        const allowedSeeds = [
            new SystemSeed(-2580282252593743, -688526648963167, 464658922001219, 0),
            new SystemSeed(3935150661125235, 4680257902545175, 4968241436399943, 0),
            new SystemSeed(1942125733379075, -3862794543036899, 2212860146496827, 0),
            new SystemSeed(3641602661119511, 91206409140523, 1081626828903715, 0),
            new SystemSeed(6987489365968175, 5899214087953411, -482678543564899, 0),
            new SystemSeed(-1628959327636315, 38204247336039, 7047545368534403, 0),
            new SystemSeed(3132497034982239, 7543003914077319, -6084670653643795, 0),
            new SystemSeed(-7292809030413071, -3635511197742219, -2218904218845895, 0),
            new SystemSeed(2542436462572791, 7347121178237787, 4238060996268067, 0),
            new SystemSeed(5428493874753067, -8923724700575275, 7237046022809219, 0),
            new SystemSeed(-3899216056009119, -7848080162041851, 8925190396180339, 0),
            new SystemSeed(-202807696914171, 8512184958570967, 4097489530118163, 0),
            new SystemSeed(-885543021563071, -1739658304181095, -8196004220949627, 0),
            new SystemSeed(-3831994119404563, 290653719847023, -1503550685041827, 0),
            new SystemSeed(4935006642582931, 385848138478679, 8147709060574067, 0),
            new SystemSeed(-8122625535230955, -296218998945099, 2938478904818683, 0)
        ];

        /*const randomSeed = new SystemSeed(
new Vector3(
    Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER),
    Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER),
    Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER)
),
0
);

console.log(randomSeed.starSectorCoordinates.x, randomSeed.starSectorCoordinates.y, randomSeed.starSectorCoordinates.z, randomSeed.index);*/

        const seed = allowedSeeds[Math.floor(Math.random() * allowedSeeds.length)];
        console.log(seed.starSectorX, seed.starSectorY, seed.starSectorZ, seed.index);
        this.starSystemController = new StarSystemController(seed, this.scene);
    }

    init() {
        this.starSystemView.setStarSystem(this.starSystemController, true);

        this.starSystemView.onInitStarSystem.addOnce(() => {
            this.starSystemView.switchToDefaultControls();
            const nbRadius = this.starSystemController.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 2;
            positionNearObjectWithStarVisible(
                this.controls,
                this.starSystemController.planets.length > 0 ? this.starSystemController.getBodies()[1] : this.starSystemController.stellarObjects[0],
                this.starSystemController,
                nbRadius
            );
        });

        this.starSystemView.ui.setEnabled(false);

        this.starSystemView.bodyEditor.setVisibility(EditorVisibility.HIDDEN);

        document.body.insertAdjacentHTML("beforeend", mainMenuHTML);

        const htmlRoot = document.getElementById("mainMenu");
        if (htmlRoot === null) throw new Error("#mainMenu does not exist!");
        this.htmlRoot = htmlRoot;

        const title = document.querySelector("#mainMenu h1");
        if (title === null) throw new Error("#mainMenu h1 does not exist!");
        this.title = title as HTMLElement;

        document.getElementById("startButton")?.addEventListener("click", () => {
            this.startAnimation(() => this.onStartObservable.notifyObservers());
        });

        const loadSaveButton = document.getElementById("loadSaveButton");
        if (loadSaveButton === null) throw new Error("#loadSaveButton does not exist!");

        const loadSavePanel = document.getElementById("loadSavePanel");
        if (loadSavePanel === null) throw new Error("#loadSavePanel does not exist!");
        this.loadSavePanel = loadSavePanel;

        const dropFileZone = document.getElementById("dropFileZone");
        if (dropFileZone === null) throw new Error("#dropFileZone does not exist!");

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

        dropFileZone.addEventListener("drop", (event) => {
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

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target === null) throw new Error("event.target is null");
                const data = event.target.result as string;
                try {
                    const saveFileData = parseSaveFileData(data);
                    this.startAnimation(() => this.onLoadSaveObservable.notifyObservers(saveFileData));
                } catch (e) {
                    dropFileZone.classList.add("invalid");
                    alert("Invalid save file");
                }
            };
            reader.readAsText(file);
        });

        dropFileZone.addEventListener("click", () => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "application/json";
            fileInput.onchange = () => {
                if (fileInput.files === null) throw new Error("fileInput.files is null");
                if (fileInput.files.length === 0) throw new Error("fileInput.files is empty");
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target === null) throw new Error("event.target is null");
                    const data = event.target.result as string;
                    const saveFileData = parseSaveFileData(data);
                    this.startAnimation(() => this.onLoadSaveObservable.notifyObservers(saveFileData));
                };
                reader.readAsText(file);
            };
            fileInput.click();
        });

        loadSaveButton.addEventListener("click", () => {
            this.toggleActivePanel(loadSavePanel);
        });

        const contributeButton = document.getElementById("contributeButton");
        if (contributeButton === null) throw new Error("#contributeButton does not exist!");

        const contributePanel = document.getElementById("contribute");
        if (contributePanel === null) throw new Error("#contribute does not exist!");
        this.contributePanel = contributePanel;

        contributeButton.addEventListener("click", () => {
            this.toggleActivePanel(contributePanel);
            this.onContributeObservable.notifyObservers();
        });

        const creditsButton = document.getElementById("creditsButton");
        if (creditsButton === null) throw new Error("#creditsButton does not exist!");
        const creditsPanel = document.getElementById("credits");
        if (creditsPanel === null) throw new Error("#credits does not exist!");
        this.creditsPanel = creditsPanel;

        creditsButton.addEventListener("click", () => {
            this.toggleActivePanel(creditsPanel);
            this.onCreditsObservable.notifyObservers();
        });

        const aboutButton = document.getElementById("aboutButton");
        if (aboutButton === null) throw new Error("#aboutButton does not exist!");
        const aboutPanel = document.getElementById("about");
        if (aboutPanel === null) throw new Error("#about does not exist!");
        this.aboutPanel = aboutPanel;

        aboutButton.addEventListener("click", () => {
            this.toggleActivePanel(aboutPanel);
            this.onAboutObservable.notifyObservers();
        });
    }

    private startAnimation(onAnimationFinished: () => void) {
        this.hideActivePanel();

        const currentForward = getForwardDirection(this.controls.getTransform());

        const planet = this.starSystemController.planets[0];
        const newForward = planet.getTransform().getAbsolutePosition().subtract(this.controls.getTransform().getAbsolutePosition()).normalize();
        const axis = Vector3.Cross(currentForward, newForward);
        const angle = Vector3.GetAngleBetweenVectors(currentForward, newForward, axis);
        const duration = 2;

        const rotationAnimation = new TransformRotationAnimation(this.controls.getTransform(), axis, angle, duration);
        const translationAnimation = new TransformTranslationAnimation(
            this.controls.getTransform(),
            this.controls
                .getTransform()
                .getAbsolutePosition()
                .add(newForward.scale(-planet.model.radius * 2)),
            duration
        );

        if (this.title === null) throw new Error("Title is null");

        this.title.animate(
            [
                {
                    marginTop: this.title.style.marginTop
                },
                {
                    marginTop: "30vh"
                }
            ],
            {
                duration: duration * 1000,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );

        const animationCallback = () => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (!translationAnimation.isFinished()) translationAnimation.update(deltaTime);
            if (!rotationAnimation.isFinished()) rotationAnimation.update(deltaTime);
            else {
                this.scene.onBeforePhysicsObservable.removeCallback(animationCallback);
                if (this.htmlRoot === null) throw new Error("MainMenu is null");
                this.htmlRoot.style.display = "none";
                onAnimationFinished();
            }

            this.controls.getActiveCamera().getViewMatrix();

            this.starSystemController.applyFloatingOrigin();
            this.starSystemController.updateShaders(0.0);
        };

        this.scene.onBeforePhysicsObservable.add(animationCallback);

        this.hideMenu();
    }

    private toggleActivePanel(newPanel: HTMLElement) {
        if (this.activeRightPanel === newPanel) {
            this.hideActivePanel();
            return;
        }

        if (this.activeRightPanel !== null) {
            this.hideActivePanel();
        }

        this.activeRightPanel = newPanel;
        newPanel.classList.add("visible");
    }

    private hideActivePanel() {
        if (this.activeRightPanel !== null) {
            this.activeRightPanel.classList.remove("visible");
            this.activeRightPanel = null;
        }
    }

    private hideMenu() {
        const menuItems = document.getElementById("menuItems");
        if (menuItems === null) throw new Error("#menuItems does not exist!");
        menuItems.style.left = "-20%";
    }

    public isVisible() {
        return this.htmlRoot !== null && this.htmlRoot.style.display !== "none";
    }
}
