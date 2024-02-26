import { UberScene } from "../uberCore/uberScene";
import { DefaultControls } from "../defaultController/defaultControls";
import { StarSystemView } from "../starSystem/starSystemView";
import { StarSystemController } from "../starSystem/starSystemController";
import { positionNearObjectWithStarVisible } from "../utils/positionNearObject";
import { BodyType } from "../model/common";
import { EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import mainMenuHTML from "../../html/mainMenu.html";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../uberCore/transforms/animations/translation";
import { Observable } from "@babylonjs/core/Misc/observable";
import { SystemSeed } from "../utils/systemSeed";
import { parseSaveFileData, SaveFileData } from "../saveFile/saveFileData";
import packageInfo from "../../../package.json";
import { InputMaps } from "../inputs/inputMaps";
import Action from "@brianchirls/game-input/Action";
import Interaction from "@brianchirls/game-input/interactions/Interaction";
import { Assets } from "../assets";
import DPadComposite from "@brianchirls/game-input/controls/DPadComposite";
import {
    AxisComposite,
    ButtonInputControl,
    StickInputControl,
    Vector2InputControl
} from "@brianchirls/game-input/browser";
import { Settings } from "../settings";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import {
    axisCompositeToString,
    buttonInputToString,
    dPadCompositeToString,
    stickInputToString,
    vector2ToString
} from "../utils/inputControlsString";

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
    private version: HTMLElement | null = null;

    private activeRightPanel: HTMLElement | null = null;
    private loadSavePanel: HTMLElement | null = null;
    private settingsPanel: HTMLElement | null = null;
    private contributePanel: HTMLElement | null = null;
    private creditsPanel: HTMLElement | null = null;
    private aboutPanel: HTMLElement | null = null;

    constructor(starSystemView: StarSystemView) {
        this.starSystemView = starSystemView;

        this.scene = this.starSystemView.scene;
        this.controls = this.starSystemView.getDefaultControls();

        const allowedSeeds = [
            new SystemSeed(-600, 955, -68, 0),
            new SystemSeed(576, -192, 480, 0),
            new SystemSeed(-760, -856, 60, 0),
            new SystemSeed(-238, 254, -675, 0),
            new SystemSeed(-312, 314, 736, 0),
            new SystemSeed(-866, 71, -294, 0),
            new SystemSeed(-249, 706, 631, 0),
            new SystemSeed(-433, 945, -693, 0),
            new SystemSeed(-430, -767, -670, 0),
            new SystemSeed(61, 376, -389, 0),
            new SystemSeed(-499, -114, 377, 0),
            new SystemSeed(-596, 339, -571, 0),
            new SystemSeed(-319, 253, 30, 0),
            new SystemSeed(709, 570, 285, 0),
            new SystemSeed(-516, -140, -2, 0),
            new SystemSeed(728, 691, -883, 0),
            new SystemSeed(-673, -545, 753, 0),
            new SystemSeed(-218, 213, 765, 0),
            new SystemSeed(-47, 97, -20, 0),
            new SystemSeed(817, 750, -983, 0)
        ];

        /*const randomSeed = new SystemSeed(
Math.trunc((Math.random() * 2 - 1) * 1000),
Math.trunc((Math.random() * 2 - 1) * 1000),
Math.trunc((Math.random() * 2 - 1) * 1000),
0
);*/

        const seed = allowedSeeds[Math.floor(Math.random() * allowedSeeds.length)];
        console.log(seed.starSectorX + ", " + seed.starSectorY + ", " + seed.starSectorZ + ", " + seed.index);
        this.starSystemController = new StarSystemController(seed, this.scene);
    }

    async init() {
        await this.starSystemView.loadStarSystem(this.starSystemController, true);

        this.starSystemView.onInitStarSystem.addOnce(() => {
            this.starSystemView.switchToDefaultControls();
            const nbRadius = this.starSystemController.model.getBodyTypeOfStellarObject(0) === BodyType.BLACK_HOLE ? 8 : 2;
            const targetObject = this.starSystemController.planets.length > 0 ? this.starSystemController.planets[0] : this.starSystemController.stellarObjects[0];
            positionNearObjectWithStarVisible(this.controls, targetObject, this.starSystemController, nbRadius);

            if (targetObject instanceof GasPlanet) Settings.TIME_MULTIPLIER = 30;
            else Settings.TIME_MULTIPLIER = 3;

            Assets.MAIN_MENU_BACKGROUND_MUSIC.play();
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
                Assets.MENU_HOVER_SOUND.play();
            });

            // on click, play a sound
            li.addEventListener("click", () => {
                Assets.MENU_SELECT_SOUND.play();
            });
        });

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
                    alert(
                        "Invalid save file. Please check your save file against the current format at https://barthpaleologue.github.io/CosmosJourneyer/docs/types/saveFile_saveFileData.SaveFileData.html\nYou can open an issue here if the issue persists: https://github.com/BarthPaleologue/CosmosJourneyer"
                    );
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

        const settingsButton = document.getElementById("settingsButton");
        if (settingsButton === null) throw new Error("#settingsButton does not exist!");

        const settingsPanel = document.getElementById("settingsPanel");
        if (settingsPanel === null) throw new Error("#settings does not exist!");
        this.settingsPanel = settingsPanel;

        InputMaps.forEach((inputMap) => {
            // create a div
            // the name of the map will be an h3
            // each action will be a div with the name of the action and the bindings
            const mapDiv = document.createElement("div");
            mapDiv.classList.add("map");
            const mapName = document.createElement("h3");
            // break camelCase with a space
            mapName.textContent = inputMap.name.replace(/([A-Z])/g, " $1").trim();

            mapDiv.appendChild(mapName);

            for (const [actionName, action] of Object.entries(inputMap.map)) {

                const subActionMap: Map<string, string[]> = new Map();

                const actionOrInteraction = action as Action | Interaction;
                const bindings = actionOrInteraction instanceof Action ? actionOrInteraction.bindings : actionOrInteraction.action.bindings;
                bindings.forEach((binding) => {
                    if (binding.control instanceof DPadComposite) {
                        const strings = dPadCompositeToString(binding.control);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else if (binding.control instanceof ButtonInputControl) {
                        const text = buttonInputToString(binding.control);
                        subActionMap.set("BUTTON", [text]);
                    } else if (binding.control instanceof AxisComposite) {
                        const strings = axisCompositeToString(binding.control);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else if (binding.control instanceof StickInputControl) {
                        const strings = stickInputToString(binding.control);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else if(binding.control instanceof Vector2InputControl) {
                        const strings = vector2ToString(binding.control);
                        strings.forEach((string) => {
                            const [key, name] = string;
                            if (!subActionMap.has(key)) {
                                subActionMap.set(key, []);
                            }
                            subActionMap.get(key)?.push(name);
                        });
                    } else {
                        throw new Error("Unknown control type");
                    }
                });

                const actionDiv = document.createElement("div");

                const label = document.createElement("p");
                // break camelCase with a space
                label.textContent = actionName.replace(/([A-Z])/g, " $1").trim();

                actionDiv.appendChild(label);

                if (subActionMap.size === 1) {
                    actionDiv.classList.add("actionSingle");

                    const valuesContainer = document.createElement("div");
                    valuesContainer.classList.add("valuesContainer");

                    subActionMap.forEach((value, key) => {
                        value.forEach((v) => {
                            const valueContainer = document.createElement("p");
                            valueContainer.innerText = v;
                            valuesContainer.appendChild(valueContainer);
                        });
                    });

                    actionDiv.appendChild(valuesContainer);
                } else {
                    actionDiv.classList.add("actionMultiple");

                    subActionMap.forEach((value, key) => {
                        const subActionDiv = document.createElement("div");
                        subActionDiv.classList.add("subAction");

                        const subActionLabel = document.createElement("p");
                        subActionLabel.textContent = key;

                        const valuesContainer = document.createElement("div");
                        valuesContainer.classList.add("valuesContainer");

                        value.forEach((v) => {
                            const valueContainer = document.createElement("p");
                            valueContainer.innerText = v;
                            valuesContainer.appendChild(valueContainer);
                        });

                        subActionDiv.appendChild(subActionLabel);
                        subActionDiv.appendChild(valuesContainer);

                        actionDiv.appendChild(subActionDiv);
                    });
                }

                mapDiv.appendChild(actionDiv);
            }

            settingsPanel.appendChild(mapDiv);
        });

        settingsButton.addEventListener("click", () => {
            this.toggleActivePanel(settingsPanel);
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
        Settings.TIME_MULTIPLIER = 1;

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
                    marginTop: this.title.style.marginTop,
                    opacity: 1
                },
                {
                    marginTop: "30vh",
                    opacity: 0
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
                Assets.MAIN_MENU_BACKGROUND_MUSIC.stop();
                onAnimationFinished();
            }

            const currentProgress = translationAnimation.getProgress();
            Assets.MAIN_MENU_BACKGROUND_MUSIC.setVolume(1 - currentProgress);

            this.controls.getActiveCamera().getViewMatrix();

            this.starSystemController.applyFloatingOrigin();
            this.starSystemController.updateShaders(0.0);
        };

        this.scene.onBeforePhysicsObservable.add(animationCallback);

        this.hideMenu();
        this.hideVersion();
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

    private hideVersion() {
        if (this.version === null) throw new Error("Version is null");
        this.version.style.transform = "translateY(100%)";
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
