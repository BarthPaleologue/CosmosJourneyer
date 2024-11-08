import { UberScene } from "../uberCore/uberScene";
import { DefaultControls } from "../defaultControls/defaultControls";
import { StarSystemView } from "../starSystem/starSystemView";
import { positionNearObjectAsteroidField, positionNearObjectWithStarVisible } from "../utils/positionNearObject";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../uberCore/transforms/animations/translation";
import { Observable } from "@babylonjs/core/Misc/observable";
import { parseSaveFileData, SaveFileData } from "../saveFile/saveFileData";
import packageInfo from "../../../package.json";
import { Settings } from "../settings";
import i18n from "../i18n";
import { Sounds } from "../assets/sounds";
import { PanelType, SidePanels } from "./sidePanels";
import { SystemObjectType, UniverseObjectId } from "../utils/coordinates/universeCoordinates";
import { getObjectBySystemId } from "../utils/coordinates/orbitalObjectId";
import { getSystemModelFromCoordinates } from "../starSystem/modelFromCoordinates";
import { getStarSystemCoordinatesFromSeed } from "../starSystem/systemSeed";
import { StarSystemModel, StarSystemModelUtils } from "../starSystem/starSystemModel";
import { OrbitalObjectType } from "../architecture/orbitalObject";
import { createNotification } from "../utils/notification";

export class MainMenu {
    readonly scene: UberScene;
    readonly controls: DefaultControls;

    readonly starSystemView: StarSystemView;
    readonly starSystemModel: StarSystemModel;

    readonly onStartObservable = new Observable<void>();
    readonly onLoadSaveObservable = new Observable<SaveFileData>();
    readonly onContributeObservable = new Observable<void>();
    readonly onCreditsObservable = new Observable<void>();
    readonly onAboutObservable = new Observable<void>();

    private readonly htmlRoot: HTMLElement;
    private readonly title: HTMLElement;
    private readonly version: HTMLElement;

    private readonly sidePanels: SidePanels;

    private readonly universeObjectId: UniverseObjectId;

    private readonly startAnimationDurationSeconds = 5;

    constructor(sidePanels: SidePanels, starSystemView: StarSystemView) {
        this.sidePanels = sidePanels;
        this.starSystemView = starSystemView;

        this.scene = this.starSystemView.scene;
        this.controls = this.starSystemView.getDefaultControls();

        this.starSystemView.setUIEnabled(false);

        const allowedIdentifiers: UniverseObjectId[] = [
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 1,
                    starSectorY: 1,
                    starSectorZ: 0,
                    index: 7
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 1
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    index: 0
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 1
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 1,
                    index: 4
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 3
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 1,
                    index: 9
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 0
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 1,
                    index: 1
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 1
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 1,
                    starSectorY: 1,
                    starSectorZ: 0,
                    index: 12
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 0
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 1,
                    starSectorY: 1,
                    starSectorZ: 0,
                    index: 5
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 0
            },
            {
                starSystemCoordinates: getStarSystemCoordinatesFromSeed({
                    starSectorX: 0,
                    starSectorY: 0,
                    starSectorZ: 0,
                    index: 17
                }),
                objectType: SystemObjectType.PLANETARY_MASS_OBJECT,
                objectIndex: 2
            }
        ];

        const randomIndex = Math.floor(Math.random() * allowedIdentifiers.length);
        this.universeObjectId = allowedIdentifiers[randomIndex];
        const coordinates = this.universeObjectId.starSystemCoordinates;
        this.starSystemModel = getSystemModelFromCoordinates(coordinates);

        const htmlRoot = document.getElementById("mainMenu");
        if (htmlRoot === null) throw new Error("#mainMenu does not exist!");
        this.htmlRoot = htmlRoot;
        this.htmlRoot.style.display = "none";

        const title = document.querySelector("#mainMenu h1");
        if (title === null) throw new Error("#mainMenu h1 does not exist!");
        this.title = title as HTMLElement;

        const version = document.getElementById("version");
        if (version === null) throw new Error("#version does not exist!");
        // children a elements has the version number as textContent
        const childLink = version.querySelector("a");
        if (childLink === null) throw new Error("version link does not exist!");
        childLink.textContent = `Alpha ${packageInfo.version}`;
        this.version = version;

        document.querySelectorAll("#menuItems li").forEach((li) => {
            // on mouse hover, play a sound
            li.addEventListener("mouseenter", () => {
                Sounds.MENU_HOVER_SOUND.play();
            });

            // on click, play a sound
            li.addEventListener("click", () => {
                Sounds.MENU_SELECT_SOUND.play();
            });
        });

        // Translate all main menu elements
        document.querySelectorAll("#mainMenu *[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            if (key === null) throw new Error("data-i18n attribute is null");
            element.textContent = i18n.t(key);
        });

        const startButton = document.getElementById("startButton");
        if (startButton === null) throw new Error("#startButton does not exist!");
        startButton.addEventListener("click", () => {
            this.startAnimation(() => this.onStartObservable.notifyObservers());
        });

        const loadSaveButton = document.getElementById("loadSaveButton");
        if (loadSaveButton === null) throw new Error("#loadSaveButton does not exist!");

        this.initLoadSavePanel();

        loadSaveButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.LOAD_SAVE);
        });

        const settingsButton = document.getElementById("settingsButton");
        if (settingsButton === null) throw new Error("#settingsButton does not exist!");

        settingsButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.SETTINGS);
        });

        const tutorialsButton = document.getElementById("tutorialsButton");
        if (tutorialsButton === null) throw new Error("#tutorialsButton does not exist!");

        tutorialsButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.TUTORIALS);
        });

        const contributeButton = document.getElementById("contributeButton");
        if (contributeButton === null) throw new Error("#contributeButton does not exist!");

        contributeButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.CONTRIBUTE);
            this.onContributeObservable.notifyObservers();
        });

        const creditsButton = document.getElementById("creditsButton");
        if (creditsButton === null) throw new Error("#creditsButton does not exist!");

        creditsButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.CREDITS);
            this.onCreditsObservable.notifyObservers();
        });

        const aboutButton = document.getElementById("aboutButton");
        if (aboutButton === null) throw new Error("#aboutButton does not exist!");

        aboutButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.ABOUT);
            this.onAboutObservable.notifyObservers();
        });
    }

    async init() {
        await this.starSystemView.loadStarSystem(this.starSystemModel);

        this.starSystemView.onInitStarSystem.addOnce(async () => {
            await this.starSystemView.switchToDefaultControls(false);
            const nbRadius = StarSystemModelUtils.GetStellarObjects(this.starSystemModel)[0].type === OrbitalObjectType.BLACK_HOLE ? 8 : 2;
            const targetObject = getObjectBySystemId(this.universeObjectId, this.starSystemView.getStarSystem());
            if (targetObject === null) {
                throw new Error(`Could not find object with ID ${JSON.stringify(this.universeObjectId)}`);
            }
            positionNearObjectWithStarVisible(this.controls, targetObject, this.starSystemView.getStarSystem(), nbRadius);

            Settings.TIME_MULTIPLIER = 3;

            Sounds.MAIN_MENU_BACKGROUND_MUSIC.play();
        });

        this.starSystemView.targetCursorLayer.setEnabled(false);

        this.htmlRoot.style.display = "block";
    }

    /**
     * Initializes the load save panel to be able to drop a file or click on the drop zone to load a save file
     * @private
     */
    private initLoadSavePanel() {
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

                const loadingSaveData = parseSaveFileData(data);
                loadingSaveData.logs.forEach((log) => createNotification(log, 60_000));
                if (loadingSaveData.data === null) return;
                const saveFileData = loadingSaveData.data;
                this.startAnimation(() => this.onLoadSaveObservable.notifyObservers(saveFileData));
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
                    const loadingSaveData = parseSaveFileData(data);
                    loadingSaveData.logs.forEach((log) => createNotification(log, 60_000));
                    if (loadingSaveData.data === null) return;
                    const saveFileData = loadingSaveData.data;
                    this.startAnimation(() => this.onLoadSaveObservable.notifyObservers(saveFileData));
                };
                reader.readAsText(file);
            };
            fileInput.click();
        });
    }

    private startAnimation(onAnimationFinished: () => void) {
        this.sidePanels.hideActivePanel();
        Settings.TIME_MULTIPLIER = 1;

        const starSystemController = this.starSystemView.getStarSystem();

        const currentForward = getForwardDirection(this.controls.getTransform());

        const orbitalObject = getObjectBySystemId(this.universeObjectId, starSystemController);
        if (orbitalObject === null) {
            throw new Error("Could not find object with ID " + JSON.stringify(this.universeObjectId));
        }
        const celestialBody = starSystemController.getCelestialBodies().find((body) => body === orbitalObject);
        if (celestialBody === undefined) {
            throw new Error("No corresponding celestial body found");
        }
        const newForward = celestialBody.getTransform().getAbsolutePosition().subtract(this.controls.getTransform().getAbsolutePosition()).normalize();
        const axis = Vector3.Cross(currentForward, newForward);
        const angle = Vector3.GetAngleBetweenVectors(currentForward, newForward, axis);

        const targetPosition = positionNearObjectAsteroidField(celestialBody, starSystemController);

        const rotationAnimation = new TransformRotationAnimation(this.controls.getTransform(), axis, angle, this.startAnimationDurationSeconds);
        const translationAnimation = new TransformTranslationAnimation(this.controls.getTransform(), targetPosition, this.startAnimationDurationSeconds);

        if (this.title === null) throw new Error("Title is null");

        this.title.animate(
            [
                {
                    marginTop: this.title.style.marginTop,
                    opacity: 1
                },
                {
                    marginTop: "30vh",
                    opacity: 0
                }
            ],
            {
                duration: this.startAnimationDurationSeconds * 1000,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );

        Sounds.MAIN_MENU_BACKGROUND_MUSIC.setVolume(0, this.startAnimationDurationSeconds);

        const animationCallback = () => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (!translationAnimation.isFinished()) translationAnimation.update(deltaTime);
            if (!rotationAnimation.isFinished()) rotationAnimation.update(deltaTime);
            else {
                this.scene.onBeforePhysicsObservable.removeCallback(animationCallback);
                if (this.htmlRoot === null) throw new Error("MainMenu is null");
                this.htmlRoot.style.display = "none";
                Sounds.MAIN_MENU_BACKGROUND_MUSIC.stop();

                this.starSystemView.setUIEnabled(true);
                onAnimationFinished();

                return;
            }

            this.controls.getActiveCameras().forEach((camera) => camera.getViewMatrix());

            starSystemController.applyFloatingOrigin();
            starSystemController.updateShaders(0.0, this.starSystemView.postProcessManager);
        };

        this.scene.onBeforePhysicsObservable.add(animationCallback);

        this.hideMenu();
        this.hideVersion();
    }

    private hideVersion() {
        if (this.version === null) throw new Error("Version is null");
        this.version.style.transform = "translateY(100%)";
    }

    private hideMenu() {
        const menuItems = document.getElementById("menuItems");
        if (menuItems === null) throw new Error("#menuItems does not exist!");
        menuItems.style.left = "-20%";
    }

    public hide() {
        this.hideVersion();
        this.hideMenu();
        this.sidePanels.hideActivePanel();
        this.htmlRoot.style.display = "none";
        Sounds.MAIN_MENU_BACKGROUND_MUSIC.setVolume(0, 2);
    }

    public isVisible() {
        return this.htmlRoot !== null && this.htmlRoot.style.display !== "none";
    }
}
