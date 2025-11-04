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

import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";
import { type UniverseBackend } from "@/backend/universe/universeBackend";
import { getUniverseObjectId, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { TransformRotationAnimation } from "@/frontend/helpers/animations/rotation";
import { TransformTranslationAnimation } from "@/frontend/helpers/animations/translation";
import {
    positionNearObjectAsteroidField,
    positionNearObjectWithStarVisible,
} from "@/frontend/helpers/positionNearObject";
import { type UberScene } from "@/frontend/helpers/uberScene";
import { type StarSystemView } from "@/frontend/starSystemView";

import { type DeepReadonly } from "@/utils/types";

import i18n from "@/i18n";

import packageInfo from "../../../../package.json";
import { PanelType, type SidePanels } from "./sidePanels";

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

    private readonly startButton: HTMLElement;
    private readonly loadSaveButton: HTMLElement;
    private readonly settingsButton: HTMLElement;
    private readonly tutorialsButton: HTMLElement;
    private readonly contributeButton: HTMLElement;
    private readonly creditsButton: HTMLElement;
    private readonly aboutButton: HTMLElement;
    private readonly menuItems: HTMLElement;

    private readonly sidePanels: SidePanels;

    private readonly universeObjectId: UniverseObjectId;

    private readonly startAnimationDurationSeconds = 5;

    private createMainMenuHTML(): {
        htmlRoot: HTMLElement;
        title: HTMLElement;
        version: HTMLElement;
        startButton: HTMLElement;
        loadSaveButton: HTMLElement;
        settingsButton: HTMLElement;
        tutorialsButton: HTMLElement;
        contributeButton: HTMLElement;
        creditsButton: HTMLElement;
        aboutButton: HTMLElement;
        menuItems: HTMLElement;
    } {
        const mainMenuDiv = document.createElement("div");
        mainMenuDiv.className = "mainMenu";

        // Create title
        const title = document.createElement("h1");
        title.textContent = "Cosmos Journeyer";
        mainMenuDiv.appendChild(title);

        // Create version paragraph
        const versionP = document.createElement("p");
        versionP.className = "version";
        const versionLink = document.createElement("a");
        versionLink.target = "_blank";
        versionLink.href = "https://github.com/BarthPaleologue/CosmosJourneyer/releases";
        versionP.appendChild(versionLink);
        mainMenuDiv.appendChild(versionP);

        // Create menu items list
        const menuItemsUl = document.createElement("ul");
        menuItemsUl.className = "leftSideMenu";

        // Create individual button elements with translated text
        const startButton = document.createElement("li");
        startButton.textContent = i18n.t("mainMenu:newJourney");
        menuItemsUl.appendChild(startButton);

        const loadSaveButton = document.createElement("li");
        loadSaveButton.textContent = i18n.t("mainMenu:loadSave");
        menuItemsUl.appendChild(loadSaveButton);

        const settingsButton = document.createElement("li");
        settingsButton.textContent = i18n.t("mainMenu:settings");
        menuItemsUl.appendChild(settingsButton);

        const tutorialsButton = document.createElement("li");
        tutorialsButton.textContent = i18n.t("mainMenu:tutorials");
        menuItemsUl.appendChild(tutorialsButton);

        const contributeButton = document.createElement("li");
        contributeButton.textContent = i18n.t("mainMenu:contribute");
        menuItemsUl.appendChild(contributeButton);

        const creditsButton = document.createElement("li");
        creditsButton.textContent = i18n.t("mainMenu:credits");
        menuItemsUl.appendChild(creditsButton);

        const aboutButton = document.createElement("li");
        aboutButton.textContent = i18n.t("mainMenu:about");
        menuItemsUl.appendChild(aboutButton);

        mainMenuDiv.appendChild(menuItemsUl);

        return {
            htmlRoot: mainMenuDiv,
            title: title,
            version: versionP,
            startButton: startButton,
            loadSaveButton: loadSaveButton,
            settingsButton: settingsButton,
            tutorialsButton: tutorialsButton,
            contributeButton: contributeButton,
            creditsButton: creditsButton,
            aboutButton: aboutButton,
            menuItems: menuItemsUl,
        };
    }

    constructor(
        sidePanels: SidePanels,
        starSystemView: StarSystemView,
        universeBackend: UniverseBackend,
        soundPlayer: ISoundPlayer,
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
            starSectorZ: 0,
        };

        const system = universeBackend.getSystemModelFromCoordinates(coordinates);
        if (system === null) {
            throw new Error("Cannot find system");
        }

        const object = system.planets.at(1);
        if (object === undefined) {
            throw new Error("Cannot find planet with index 2");
        }

        this.universeObjectId = getUniverseObjectId(object, system);

        this.starSystemModel = system;

        // Create and append the main menu HTML structure
        const elements = this.createMainMenuHTML();
        this.htmlRoot = elements.htmlRoot;
        this.title = elements.title;
        this.version = elements.version;
        this.startButton = elements.startButton;
        this.loadSaveButton = elements.loadSaveButton;
        this.settingsButton = elements.settingsButton;
        this.tutorialsButton = elements.tutorialsButton;
        this.contributeButton = elements.contributeButton;
        this.creditsButton = elements.creditsButton;
        this.aboutButton = elements.aboutButton;
        this.menuItems = elements.menuItems;

        this.htmlRoot.style.display = "none";
        document.body.appendChild(this.htmlRoot);

        // Set version text content
        const childLink = this.version.querySelector("a");
        if (childLink === null) throw new Error("version link does not exist!");
        childLink.textContent = `Alpha ${packageInfo.version}`;

        // Add sound events to all menu items
        const allMenuItems = [
            this.startButton,
            this.loadSaveButton,
            this.settingsButton,
            this.tutorialsButton,
            this.contributeButton,
            this.creditsButton,
            this.aboutButton,
        ];

        allMenuItems.forEach((li) => {
            // on mouse hover, play a sound
            li.addEventListener("mouseenter", () => {
                soundPlayer.playNow(SoundType.HOVER);
            });

            // on click, play a sound
            li.addEventListener("click", () => {
                soundPlayer.playNow(SoundType.CLICK);
            });
        });

        this.startButton.addEventListener("click", () => {
            this.startAnimation(() => this.onStartObservable.notifyObservers());
        });

        this.loadSaveButton.addEventListener("click", async () => {
            await this.sidePanels.toggleActivePanel(PanelType.LOAD_SAVE);
        });

        this.sidePanels.loadSavePanel.content.onLoadSaveObservable.add(() => {
            this.hide();
        });

        this.settingsButton.addEventListener("click", async () => {
            await this.sidePanels.toggleActivePanel(PanelType.SETTINGS);
        });

        this.tutorialsButton.addEventListener("click", async () => {
            await this.sidePanels.toggleActivePanel(PanelType.TUTORIALS);
        });

        this.contributeButton.addEventListener("click", async () => {
            await this.sidePanels.toggleActivePanel(PanelType.CONTRIBUTE);
            this.onContributeObservable.notifyObservers();
        });

        this.creditsButton.addEventListener("click", async () => {
            await this.sidePanels.toggleActivePanel(PanelType.CREDITS);
            this.onCreditsObservable.notifyObservers();
        });

        this.aboutButton.addEventListener("click", async () => {
            await this.sidePanels.toggleActivePanel(PanelType.ABOUT);
            this.onAboutObservable.notifyObservers();
        });
    }

    async init() {
        await this.starSystemView.loadStarSystem(this.starSystemModel);

        this.starSystemView.onInitStarSystem.addOnce(async () => {
            await this.starSystemView.switchToDefaultControls(false);
            const nbRadius = this.starSystemModel.stellarObjects[0].type === "blackHole" ? 8 : 2;
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
                nbRadius,
            );
        });

        this.starSystemView.targetCursorLayer.setEnabled(false);

        this.htmlRoot.style.display = "block";
    }

    private startAnimation(onAnimationFinished: () => void) {
        this.sidePanels.hideActivePanel();

        const starSystemController = this.starSystemView.getStarSystem();

        const currentForward = this.controls.getTransform().forward;

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
            this.startAnimationDurationSeconds,
        );
        const translationAnimation = new TransformTranslationAnimation(
            this.controls.getTransform(),
            targetPosition,
            this.startAnimationDurationSeconds,
        );

        this.title.animate(
            [
                {
                    marginTop: this.title.style.marginTop,
                    opacity: 1,
                },
                {
                    marginTop: "30vh",
                    opacity: 0,
                },
            ],
            {
                duration: this.startAnimationDurationSeconds * 1000,
                easing: "ease-in-out",
                fill: "forwards",
            },
        );

        const animationCallback = () => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (!translationAnimation.isFinished()) translationAnimation.update(deltaTime);
            if (!rotationAnimation.isFinished()) rotationAnimation.update(deltaTime);
            else {
                this.scene.onBeforeRenderObservable.removeCallback(animationCallback);
                this.htmlRoot.style.display = "none";

                this.starSystemView.setUIEnabled(true);
                onAnimationFinished();

                return;
            }
        };

        this.scene.onBeforeRenderObservable.add(animationCallback, undefined, true);

        this.hideMenu();
        this.hideVersion();
    }

    private hideVersion() {
        this.version.style.transform = "translateY(100%)";
    }

    private hideMenu() {
        this.menuItems.style.left = "-20%";
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
