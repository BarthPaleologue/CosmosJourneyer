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

import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Image } from "@babylonjs/gui/2D/controls/image";

import hoveredCircle from "../../asset/textures/hoveredCircle.png";
import selectedCircle from "../../asset/textures/selectedCircle.png";

import { Animation } from "@babylonjs/core/Animations/animation";
import { Scene } from "@babylonjs/core/scene";
import { Settings } from "../settings";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import i18n from "../i18n";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { getStellarTypeString } from "../stellarObjects/common";
import { SeededStarSystemModel } from "../starSystem/seededStarSystemModel";
import { StarModel } from "../stellarObjects/star/starModel";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { BodyType } from "../architecture/bodyType";
import { getStarGalacticCoordinates } from "../utils/getStarGalacticCoordinates";
import { parseDistance } from "../utils/parseToStrings";
import { placeSpaceStations } from "../society/spaceStationPlacement";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { getSpaceStationSeed } from "../planets/common";
import { factionToString } from "../powerplay/factions";
import { isSystemInHumanBubble } from "../society/starSystemSociety";

export class StarMapUI {
    readonly gui: AdvancedDynamicTexture;

    readonly hoveredSystemRing: Image;
    readonly selectedSystemRing: Image;
    readonly currentSystemRing: Image;

    readonly htmlRoot: HTMLDivElement;

    readonly infoPanel: HTMLDivElement;
    readonly infoPanelStarPreview: HTMLDivElement;
    readonly infoPanelTitle: HTMLHeadingElement;
    readonly starSector: HTMLParagraphElement;
    readonly nbPlanets: HTMLParagraphElement;
    readonly distanceToSol: HTMLParagraphElement;

    readonly humanPresence: HTMLDivElement;
    readonly nbSpaceStations: HTMLParagraphElement;
    readonly factions: HTMLDivElement;

    readonly cursor: HTMLDivElement;

    readonly shortHandUI: HTMLDivElement;
    readonly shortHandUITitle: HTMLHeadingElement;
    readonly shortHandUIDistanceFromCurrent: HTMLParagraphElement;
    readonly shortHandUIFactions: HTMLDivElement;
    readonly shortHandUIButtonContainer: HTMLDivElement;
    readonly shortHandUIPlotItineraryButton: HTMLButtonElement;
    readonly shortHandUIBookmarkButton: HTMLButtonElement;

    private selectedMesh: AbstractMesh | null = null;

    readonly scene: Scene;
    readonly uiCamera: FreeCamera;

    static ALPHA_ANIMATION = new Animation("alphaAnimation", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    constructor(engine: AbstractEngine) {
        this.scene = new Scene(engine);
        this.scene.useRightHandedSystem = true;
        this.scene.autoClear = false;

        this.uiCamera = new FreeCamera("UiCamera", Vector3.Zero(), this.scene);

        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("StarMapUI", true, this.scene);

        this.hoveredSystemRing = new Image("hoverSystemRing", hoveredCircle);
        this.hoveredSystemRing.fixedRatio = 1;
        this.hoveredSystemRing.width = 0.2;
        this.hoveredSystemRing.alpha = 0.8;
        this.hoveredSystemRing.zIndex = 4;

        this.selectedSystemRing = new Image("selectedSystemRing", hoveredCircle);
        this.selectedSystemRing.fixedRatio = 1;
        this.selectedSystemRing.width = 0.2;
        this.selectedSystemRing.alpha = 0.8;
        this.selectedSystemRing.zIndex = 4;

        this.currentSystemRing = new Image("currentSystemRing", selectedCircle);
        this.currentSystemRing.fixedRatio = 1;
        this.currentSystemRing.width = 0.2;
        this.currentSystemRing.alpha = 1;
        this.currentSystemRing.zIndex = 5;

        StarMapUI.ALPHA_ANIMATION.setKeys([
            { frame: 0, value: 0.0 },
            { frame: 60, value: 0.8 }
        ]);

        this.hoveredSystemRing.animations = [StarMapUI.ALPHA_ANIMATION];

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("starMapUI");
        document.body.appendChild(this.htmlRoot);

        this.infoPanel = document.createElement("div");
        this.infoPanel.classList.add("starMapInfoPanel");
        this.htmlRoot.appendChild(this.infoPanel);

        this.infoPanelStarPreview = document.createElement("div");
        this.infoPanelStarPreview.classList.add("starMapInfoPanelStarPreview");
        this.infoPanel.appendChild(this.infoPanelStarPreview);

        this.infoPanelTitle = document.createElement("h2");
        this.infoPanelTitle.classList.add("starMapInfoPanelTitle");
        this.infoPanel.appendChild(this.infoPanelTitle);

        const hr = document.createElement("hr");
        this.infoPanel.appendChild(hr);

        this.starSector = document.createElement("p");
        this.starSector.classList.add("starMapInfoPanelStarSector");
        this.infoPanel.appendChild(this.starSector);

        const hr2 = document.createElement("hr");
        this.infoPanel.appendChild(hr2);

        const generalInfoTitle = document.createElement("h3");
        generalInfoTitle.textContent = i18n.t("starMap:generalInfo");
        this.infoPanel.appendChild(generalInfoTitle);

        this.nbPlanets = document.createElement("p");
        this.nbPlanets.classList.add("starMapInfoPanelNbPlanets");
        this.infoPanel.appendChild(this.nbPlanets);

        this.distanceToSol = document.createElement("p");
        this.distanceToSol.classList.add("starMapInfoPanelDistanceToSol");
        this.infoPanel.appendChild(this.distanceToSol);

        this.humanPresence = document.createElement("div");
        this.humanPresence.classList.add("starMapInfoPanelHumanPresence");
        this.infoPanel.appendChild(this.humanPresence);

        const humanPresenceTitle = document.createElement("h3");
        humanPresenceTitle.textContent = i18n.t("starMap:humanPresence");
        this.humanPresence.appendChild(humanPresenceTitle);

        this.nbSpaceStations = document.createElement("p");
        this.nbSpaceStations.classList.add("starMapInfoPanelNbSpaceStations");
        this.humanPresence.appendChild(this.nbSpaceStations);

        this.factions = document.createElement("div");
        this.factions.classList.add("starMapInfoPanelFactions");
        this.infoPanel.appendChild(this.factions);

        this.cursor = document.createElement("div");
        this.cursor.classList.add("cursor");
        this.htmlRoot.appendChild(this.cursor);

        this.shortHandUI = document.createElement("div");
        this.shortHandUI.classList.add("shortHandUI");
        this.htmlRoot.appendChild(this.shortHandUI);

        this.shortHandUITitle = document.createElement("h2");
        this.shortHandUI.appendChild(this.shortHandUITitle);

        this.shortHandUIDistanceFromCurrent = document.createElement("p");
        this.shortHandUI.appendChild(this.shortHandUIDistanceFromCurrent);

        this.shortHandUIFactions = document.createElement("p");
        this.shortHandUI.appendChild(this.shortHandUIFactions);

        this.shortHandUIButtonContainer = document.createElement("div");
        this.shortHandUIButtonContainer.classList.add("buttonContainer");
        this.shortHandUI.appendChild(this.shortHandUIButtonContainer);

        this.shortHandUIPlotItineraryButton = document.createElement("button");
        this.shortHandUIPlotItineraryButton.classList.add("plotItineraryButton");
        this.shortHandUIPlotItineraryButton.textContent = i18n.t("starMap:setAsDestination");
        this.shortHandUIButtonContainer.appendChild(this.shortHandUIPlotItineraryButton);

        this.shortHandUIBookmarkButton = document.createElement("button");
        this.shortHandUIBookmarkButton.classList.add("bookmarkButton");
        this.shortHandUIBookmarkButton.textContent = i18n.t("starMap:bookmark");
        this.shortHandUIButtonContainer.appendChild(this.shortHandUIBookmarkButton);

        document.addEventListener("pointermove", (event) => {
            this.cursor.style.transform = `translate(calc(${event.clientX}px - 50%), calc(${event.clientY}px - 50%))`;
        });
    }

    update(playerPosition: Vector3) {
        if (this.hoveredSystemRing.linkedMesh !== null && this.hoveredSystemRing.linkedMesh !== undefined) {
            const distance = this.hoveredSystemRing.linkedMesh.getAbsolutePosition().subtract(playerPosition).length();
            const scale = this.hoveredSystemRing.linkedMesh.scaling.x / distance;
            this.hoveredSystemRing.scaleX = scale;
            this.hoveredSystemRing.scaleY = scale;
        }
        if (this.selectedSystemRing.linkedMesh !== null && this.selectedSystemRing.linkedMesh !== undefined) {
            const distance = this.selectedSystemRing.linkedMesh.getAbsolutePosition().subtract(playerPosition).length();
            const scale = Math.max(0.3, this.selectedSystemRing.linkedMesh.scaling.x / distance);
            this.selectedSystemRing.scaleX = scale;
            this.selectedSystemRing.scaleY = scale;
        }
        if (this.currentSystemRing.linkedMesh !== null && this.currentSystemRing.linkedMesh !== undefined) {
            const distance = this.currentSystemRing.linkedMesh.getAbsolutePosition().subtract(playerPosition).length();
            const scale = Math.max(0.3, this.currentSystemRing.linkedMesh.scaling.x / distance);
            this.currentSystemRing.scaleX = scale;
            this.currentSystemRing.scaleY = scale;
        }        

        if(this.selectedMesh !== null) {
            const camera = this.scene.activeCamera;
            if (camera === null) {
                throw new Error("No active camera found");
            }

            this.shortHandUI.style.visibility = "visible";
            const meshScreenCoordinates = Vector3.Project(this.selectedMesh.position, Matrix.IdentityReadOnly, camera.getTransformationMatrix(), camera.viewport);
            const width = this.scene.getEngine().getRenderWidth();
            const height = this.scene.getEngine().getRenderHeight();
            this.shortHandUI.style.visibility = "visible";
            this.shortHandUI.style.transform = `translate(calc(${(meshScreenCoordinates.x * width).toFixed(0)}px + 50px), calc(${(meshScreenCoordinates.y * height).toFixed(0)}px - 50%))`;
        } else {
            this.shortHandUI.style.visibility = "hidden";
        }
    }

    attachUIToMesh(mesh: AbstractMesh) {
        this.gui._linkedControls = [];
        this.gui.addControl(this.selectedSystemRing);
        this.selectedSystemRing.linkWithMesh(mesh);

        //FIXME: this should not be here, probably a BabylonJS bug
        this.currentSystemRing.linkWithMesh(this.currentSystemRing.linkedMesh);

        const camera = this.scene.activeCamera;
        if (camera === null) {
            throw new Error("No active camera found");
        }

        this.selectedMesh = mesh;
    }

    setHoveredStarSystemMesh(mesh: AbstractMesh | null) {
        if (mesh !== null) {
            this.scene.beginAnimation(this.hoveredSystemRing, 0, 60, false, 2.0);
            this.gui.addControl(this.hoveredSystemRing);
        } else {
            this.gui.removeControl(this.hoveredSystemRing);
        }
        this.hoveredSystemRing.linkWithMesh(mesh);
    }

    setCurrentStarSystemMesh(mesh: AbstractMesh | null) {
        if (mesh !== null) this.gui.addControl(this.currentSystemRing);
        this.currentSystemRing.linkWithMesh(mesh);
    }

    getCurrentPickedMesh() {
        return this.selectedMesh;
    }

    getCurrentHoveredMesh() {
        return this.hoveredSystemRing.linkedMesh;
    }

    setSelectedSystem(targetSystemModel: SeededStarSystemModel, currentSystemModel: SeededStarSystemModel | null) {
        const targetCoordinates = getStarGalacticCoordinates(targetSystemModel.seed);

        let text = "";
        if (currentSystemModel !== null) {
            const currentCoordinates = getStarGalacticCoordinates(currentSystemModel.seed);

            const distance = Vector3.Distance(currentCoordinates, targetCoordinates) * Settings.LIGHT_YEAR;
            text += `${i18n.t("starMap:distance")}: ${parseDistance(distance)}\n`;

            this.shortHandUIDistanceFromCurrent.textContent = `${i18n.t("starMap:distanceFromCurrent")}: ${Vector3.Distance(currentCoordinates, targetCoordinates).toFixed(1)} ${i18n.t("units:ly")}`;
        }

        const starSeed = targetSystemModel.getStellarObjectSeed(0);
        const stellarObjectType = targetSystemModel.getBodyTypeOfStellarObject(0);

        let starModel: StarModel | BlackHoleModel | NeutronStarModel;
        switch (stellarObjectType) {
            case BodyType.STAR:
                starModel = new StarModel(starSeed, targetSystemModel);
                break;
            case BodyType.BLACK_HOLE:
                starModel = new BlackHoleModel(starSeed, targetSystemModel);
                break;
            case BodyType.NEUTRON_STAR:
                starModel = new NeutronStarModel(starSeed, targetSystemModel);
                break;
            default:
                throw new Error("Unknown stellar object type!");
        }

        let typeString = "";
        if (starModel.bodyType === BodyType.BLACK_HOLE) typeString = i18n.t("objectTypes:blackHole");
        else if (starModel.bodyType === BodyType.NEUTRON_STAR) typeString = i18n.t("objectTypes:neutronStar");
        else typeString = i18n.t("objectTypes:star", { stellarType: getStellarTypeString(starModel.stellarType) });
        text += `${typeString}\n`;

        text += `${i18n.t("starMap:planets")}: ${targetSystemModel.getNbPlanets()}\n`;

        if (starModel instanceof StarModel) {
            this.infoPanelStarPreview.style.background = starModel.color.toHexString();
            this.infoPanelStarPreview.style.boxShadow = `0 0 20px ${starModel.color.toHexString()}`;
        }

        this.infoPanelTitle.textContent = targetSystemModel.name;
        this.shortHandUITitle.textContent = targetSystemModel.name;

        this.starSector.textContent = `X:${targetSystemModel.seed.starSectorX} Y:${targetSystemModel.seed.starSectorY} Z:${targetSystemModel.seed.starSectorZ} I:${targetSystemModel.seed.index}`;

        this.nbPlanets.textContent = `${i18n.t("starMap:planets")}: ${targetSystemModel.getNbPlanets()}`;

        this.distanceToSol.textContent = `${i18n.t("starMap:distanceToSol")}: ${Vector3.Distance(targetCoordinates, Vector3.Zero()).toFixed(1)} ${i18n.t("units:ly")}`;

        if (isSystemInHumanBubble(targetSystemModel.seed)) {
            const spaceStationParents = placeSpaceStations(targetSystemModel);
            const spaceStations = spaceStationParents.map((planet) => {
                return new SpaceStationModel(getSpaceStationSeed(planet, 0), targetSystemModel, planet);
            });

            this.nbSpaceStations.textContent = `${i18n.t("starMap:spaceStations")}: ${spaceStations.length}`;

            const factionNames = spaceStations.map((station) => factionToString(station.faction));
            const uniqueFactions = Array.from(new Set(factionNames));

            this.factions.textContent = `${i18n.t("starMap:factions")}: ${uniqueFactions.join(", ")}`;
            this.shortHandUIFactions.textContent = `${i18n.t("starMap:factions")}: ${uniqueFactions.join(", ")}`;
        } else {
            this.nbSpaceStations.textContent = `${i18n.t("starMap:spaceStations")}: 0`;
            this.factions.textContent = `${i18n.t("starMap:factions")}: ${i18n.t("starMap:none")}`;
            this.shortHandUIFactions.textContent = `${i18n.t("starMap:factions")}: ${i18n.t("starMap:none")}`;
        }
    }

    detachUIFromMesh() {
        this.gui.removeControl(this.selectedSystemRing);
        this.selectedMesh = null;
    }

    dispose() {
        this.scene.dispose();
        this.gui.dispose();
        this.htmlRoot.remove();
    }
}
