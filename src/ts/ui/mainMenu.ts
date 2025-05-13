//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";

import packageInfo from "../../../package.json";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { ISoundPlayer, SoundType } from "../audio/soundPlayer";
import { DefaultControls } from "../defaultControls/defaultControls";
import i18n from "../i18n";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { StarSystemView } from "../starSystem/starSystemView";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../uberCore/transforms/animations/translation";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { UberScene } from "../uberCore/uberScene";
import { StarSystemCoordinates } from "../utils/coordinates/starSystemCoordinates";
import { getUniverseObjectId, UniverseObjectId } from "../utils/coordinates/universeObjectId";
import { positionNearObjectAsteroidField, positionNearObjectWithStarVisible } from "../utils/positionNearObject";
import { DeepReadonly } from "../utils/types";
import { PanelType, SidePanels } from "./sidePanels";

export class MainMenu {
    readonly scene: UberScene;
    readonly controls: DefaultControls;

    readonly starSystemView: StarSystemView;
    readonly starSystemModel: DeepReadonly<StarSystemModel>;

    readonly onStartObservable = new Observable<void>();
    readonly onContributeObservable = new Observable<void>();
    readonly onCreditsObservable = new Observable<void>();
    readonly onAboutObservable = new Observable<void>();

    private readonly htmlRoot: HTMLElement;
    private readonly title: HTMLElement;
    private readonly version: HTMLElement;

    private readonly sidePanels: SidePanels;

    private readonly universeObjectId: UniverseObjectId;

    private readonly startAnimationDurationSeconds = 5;

    constructor(
        sidePanels: SidePanels,
        starSystemView: StarSystemView,
        starSystemDatabase: StarSystemDatabase,
        soundPlayer: ISoundPlayer
    ) {
        this.sidePanels = sidePanels;
        this.starSystemView = starSystemView;

        this.scene = this.starSystemView.scene;
        this.controls = this.starSystemView.getDefaultControls();

        this.starSystemView.setUIEnabled(false);

        const coordinates: StarSystemCoordinates = {
            localX: 0.49137314641446483,
            localY: 0.48043087077347135,
            localZ: 0.38353311777279386,
            starSectorX: 0,
            starSectorY: 0,
            starSectorZ: 0
        };

        const system = starSystemDatabase.getSystemModelFromCoordinates(coordinates);
        if (system === null) {
            throw new Error("Cannot find system");
        }

        const object = system.planets.at(1);
        if (object === undefined) {
            throw new Error("Cannot find planet with index 2");
        }

        this.universeObjectId = getUniverseObjectId(object, system);

        this.starSystemModel = system;

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
                soundPlayer.playNow(SoundType.HOVER);
            });

            // on click, play a sound
            li.addEventListener("click", () => {
                soundPlayer.playNow(SoundType.CLICK);
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

        loadSaveButton.addEventListener("click", () => {
            this.sidePanels.toggleActivePanel(PanelType.LOAD_SAVE);
        });

        this.sidePanels.loadSavePanelContent.onLoadSaveObservable.add(() => {
            this.hide();
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
            const nbRadius = this.starSystemModel.stellarObjects[0].type === OrbitalObjectType.BLACK_HOLE ? 8 : 2;
            const targetObject = this.starSystemView
                .getStarSystem()
                .getOrbitalObjectById(this.universeObjectId.idInSystem);
            if (targetObject === undefined) {
                throw new Error(`Could not find object with ID ${JSON.stringify(this.universeObjectId)}`);
            }
            positionNearObjectWithStarVisible(
                this.controls,
                targetObject,
                this.starSystemView.getStarSystem(),
                nbRadius
            );
        });

        this.starSystemView.targetCursorLayer.setEnabled(false);

        this.htmlRoot.style.display = "block";
    }

    private startAnimation(onAnimationFinished: () => void) {
        this.sidePanels.hideActivePanel();

        const starSystemController = this.starSystemView.getStarSystem();

        const currentForward = getForwardDirection(this.controls.getTransform());

        const orbitalObject = starSystemController.getOrbitalObjectById(this.universeObjectId.idInSystem);
        const celestialBody = starSystemController.getCelestialBodies().find((body) => body === orbitalObject);
        if (celestialBody === undefined) {
            throw new Error("No corresponding celestial body found");
        }
        const newForward = celestialBody
            .getTransform()
            .getAbsolutePosition()
            .subtract(this.controls.getTransform().getAbsolutePosition())
            .normalize();
        const axis = Vector3.Cross(currentForward, newForward);
        const angle = Vector3.GetAngleBetweenVectors(currentForward, newForward, axis);

        const targetPosition = positionNearObjectAsteroidField(celestialBody, starSystemController, 0.9);

        const rotationAnimation = new TransformRotationAnimation(
            this.controls.getTransform(),
            axis,
            angle,
            this.startAnimationDurationSeconds
        );
        const translationAnimation = new TransformTranslationAnimation(
            this.controls.getTransform(),
            targetPosition,
            this.startAnimationDurationSeconds
        );

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

        const animationCallback = () => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (!translationAnimation.isFinished()) translationAnimation.update(deltaTime);
            if (!rotationAnimation.isFinished()) rotationAnimation.update(deltaTime);
            else {
                this.scene.onBeforePhysicsObservable.removeCallback(animationCallback);
                this.htmlRoot.style.display = "none";

                this.starSystemView.setUIEnabled(true);
                onAnimationFinished();

                return;
            }

            this.controls.getActiveCamera().getViewMatrix();

            starSystemController.applyFloatingOrigin();
            starSystemController.updateShaders(0.0, this.starSystemView.postProcessManager);
        };

        this.scene.onBeforePhysicsObservable.add(animationCallback);

        this.hideMenu();
        this.hideVersion();
    }

    private hideVersion() {
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
    }

    public isVisible() {
        return this.htmlRoot.style.display !== "none";
    }
}
