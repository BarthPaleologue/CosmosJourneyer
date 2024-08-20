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
import { Animation } from "@babylonjs/core/Animations/animation";
import { Scene } from "@babylonjs/core/scene";
import { Settings } from "../settings";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import i18n from "../i18n";
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
    readonly htmlRoot: HTMLDivElement;

    readonly hoveredSystemCursorContainer: HTMLDivElement;
    readonly hoveredSystemCursor: HTMLDivElement;
    readonly selectedSystemCursorContainer: HTMLDivElement;
    readonly selectedSystemCursor: HTMLDivElement;
    readonly currentSystemCursorContainer: HTMLDivElement;
    readonly currentSystemCursor: HTMLDivElement;

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
    readonly shortHandUISystemType: HTMLParagraphElement;
    readonly shortHandUIDistanceFromCurrent: HTMLParagraphElement;
    readonly shortHandUIFactions: HTMLDivElement;
    readonly shortHandUIButtonContainer: HTMLDivElement;
    readonly shortHandUIPlotItineraryButton: HTMLButtonElement;
    readonly shortHandUIBookmarkButton: HTMLButtonElement;

    private selectedMesh: AbstractMesh | null = null;
    private hoveredMesh: AbstractMesh | null = null;
    private currentMesh: AbstractMesh | null = null;

    static ALPHA_ANIMATION = new Animation("alphaAnimation", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.hoverCursor = "none";

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("starMapUI");
        document.body.appendChild(this.htmlRoot);

        this.selectedSystemCursorContainer = document.createElement("div");
        this.selectedSystemCursorContainer.classList.add("targetCursorRoot");
        this.htmlRoot.appendChild(this.selectedSystemCursorContainer);

        this.selectedSystemCursor = document.createElement("div");
        this.selectedSystemCursor.classList.add("targetCursor", "rounded");
        this.selectedSystemCursorContainer.appendChild(this.selectedSystemCursor);

        this.hoveredSystemCursorContainer = document.createElement("div");
        this.hoveredSystemCursorContainer.classList.add("targetCursorRoot");
        this.htmlRoot.appendChild(this.hoveredSystemCursorContainer);

        this.hoveredSystemCursor = document.createElement("div");
        this.hoveredSystemCursor.classList.add("targetCursor", "rounded");
        this.hoveredSystemCursorContainer.appendChild(this.hoveredSystemCursor);

        this.currentSystemCursorContainer = document.createElement("div");
        this.currentSystemCursorContainer.classList.add("targetCursorRoot");
        this.htmlRoot.appendChild(this.currentSystemCursorContainer);

        this.currentSystemCursor = document.createElement("div");
        this.currentSystemCursor.classList.add("targetCursor", "rounded", "target");
        this.currentSystemCursorContainer.appendChild(this.currentSystemCursor);

        this.cursor = document.createElement("div");
        this.cursor.classList.add("targetCursor");

        this.infoPanel = document.createElement("div");
        this.infoPanel.classList.add("starMapInfoPanel");
        this.htmlRoot.appendChild(this.infoPanel);

        this.infoPanelStarPreview = document.createElement("div");
        this.infoPanelStarPreview.classList.add("starMapInfoPanelStarPreview");
        this.infoPanel.appendChild(this.infoPanelStarPreview);

        this.infoPanelTitle = document.createElement("h1");
        this.infoPanelTitle.classList.add("starMapInfoPanelTitle");
        this.infoPanel.appendChild(this.infoPanelTitle);

        const hr = document.createElement("hr");
        this.infoPanel.appendChild(hr);

        this.starSector = document.createElement("p");
        this.starSector.classList.add("starMapInfoPanelStarSector");
        this.infoPanel.appendChild(this.starSector);

        const hr2 = document.createElement("hr");
        this.infoPanel.appendChild(hr2);

        const generalInfoTitle = document.createElement("h2");
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

        const humanPresenceTitle = document.createElement("h2");
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

        this.shortHandUISystemType = document.createElement("p");
        this.shortHandUI.appendChild(this.shortHandUISystemType);

        this.shortHandUIDistanceFromCurrent = document.createElement("p");
        this.shortHandUI.appendChild(this.shortHandUIDistanceFromCurrent);

        this.shortHandUIFactions = document.createElement("p");
        this.shortHandUI.appendChild(this.shortHandUIFactions);

        this.shortHandUIButtonContainer = document.createElement("div");
        this.shortHandUIButtonContainer.classList.add("buttonContainer");
        this.shortHandUI.appendChild(this.shortHandUIButtonContainer);

        this.shortHandUIPlotItineraryButton = document.createElement("button");
        this.shortHandUIPlotItineraryButton.classList.add("plotItineraryButton");
        this.shortHandUIPlotItineraryButton.textContent = i18n.t("starMap:plotItinerary");
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
        const width = this.scene.getEngine().getRenderWidth();
        const height = this.scene.getEngine().getRenderHeight();

        const camera = this.scene.activeCamera;
        if (camera === null) {
            throw new Error("No active camera found");
        }

        const scalingBase = 100;
        const minScale = 5.0;
        if (this.selectedMesh !== null) {
            const selectedMeshScreenCoordinates = Vector3.Project(this.selectedMesh.position, Matrix.IdentityReadOnly, camera.getTransformationMatrix(), camera.viewport);
            this.selectedSystemCursor.classList.toggle("transparent", selectedMeshScreenCoordinates.z < 0);
            this.selectedSystemCursorContainer.style.left = `${selectedMeshScreenCoordinates.x * 100}vw`;
            this.selectedSystemCursorContainer.style.top = `${selectedMeshScreenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(this.selectedMesh.getAbsolutePosition(), playerPosition);
            const scale = Math.max(minScale, scalingBase / distance);
            this.selectedSystemCursorContainer.style.setProperty("--dim", `${scale}vh`);

            const xOffsetBase = 500;
            const minXOffset = 25;
            const xOffset = Math.max(minXOffset, xOffsetBase / distance);
            this.shortHandUI.style.visibility = selectedMeshScreenCoordinates.z >= 0 ? "visible" : "hidden";
            this.shortHandUI.style.transform = `translate(calc(${(selectedMeshScreenCoordinates.x * width).toFixed(0)}px + ${xOffset}px), calc(${(selectedMeshScreenCoordinates.y * height).toFixed(0)}px - 50%))`;
        } else {
            this.shortHandUI.style.visibility = "hidden";
            this.selectedSystemCursor.classList.add("transparent");
        }

        if (this.hoveredMesh !== null) {
            const meshScreenCoordinates = Vector3.Project(this.hoveredMesh.position, Matrix.IdentityReadOnly, camera.getTransformationMatrix(), camera.viewport);
            this.hoveredSystemCursor.classList.toggle("transparent", meshScreenCoordinates.z < 0);
            this.hoveredSystemCursorContainer.style.left = `${meshScreenCoordinates.x * 100}vw`;
            this.hoveredSystemCursorContainer.style.top = `${meshScreenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(this.hoveredMesh.getAbsolutePosition(), playerPosition);
            const scale = Math.max(minScale, scalingBase / distance);
            this.hoveredSystemCursorContainer.style.setProperty("--dim", `${scale}vh`);
        } else {
            this.hoveredSystemCursor.classList.add("transparent");
        }

        if (this.currentMesh !== null) {
            const meshScreenCoordinates = Vector3.Project(this.currentMesh.position, Matrix.IdentityReadOnly, camera.getTransformationMatrix(), camera.viewport);
            this.currentSystemCursor.classList.toggle("transparent", meshScreenCoordinates.z < 0);
            this.currentSystemCursorContainer.style.left = `${meshScreenCoordinates.x * 100}vw`;
            this.currentSystemCursorContainer.style.top = `${meshScreenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(this.currentMesh.getAbsolutePosition(), playerPosition);
            const scale = Math.max(minScale, scalingBase / distance);
            this.currentSystemCursorContainer.style.setProperty("--dim", `${scale}vh`);
        } else {
            this.currentSystemCursor.classList.add("transparent");
        }
    }

    setSelectedMesh(mesh: AbstractMesh) {
        if (mesh === this.currentMesh) return;
        const camera = this.scene.activeCamera;
        if (camera === null) {
            throw new Error("No active camera found");
        }

        this.selectedMesh = mesh;
    }

    setHoveredMesh(mesh: AbstractMesh | null) {
        if (mesh === this.currentMesh || mesh === this.selectedMesh) return;
        this.hoveredMesh = mesh;
    }

    setCurrentMesh(mesh: AbstractMesh | null) {
        this.currentMesh = mesh;
    }

    getCurrentPickedMesh() {
        return this.selectedMesh;
    }

    getCurrentHoveredMesh() {
        return this.hoveredMesh;
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

        this.shortHandUISystemType.textContent = typeString;

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

            if(uniqueFactions.length > 0) {
                this.factions.textContent = `${i18n.t("starMap:factions")}: ${uniqueFactions.join(", ")}`;
                this.shortHandUIFactions.textContent = `${i18n.t("starMap:factions")}: ${uniqueFactions.join(", ")}`;
            } else {
                this.factions.textContent = `${i18n.t("starMap:factions")}: ${i18n.t("starMap:none")}`;
                this.shortHandUIFactions.textContent = `${i18n.t("starMap:factions")}: ${i18n.t("starMap:none")}`;
            }
        } else {
            this.nbSpaceStations.textContent = `${i18n.t("starMap:spaceStations")}: 0`;
            this.factions.textContent = `${i18n.t("starMap:factions")}: ${i18n.t("starMap:none")}`;
            this.shortHandUIFactions.textContent = `${i18n.t("starMap:factions")}: ${i18n.t("starMap:none")}`;
        }
    }

    detachUIFromMesh() {
        this.selectedMesh = null;
    }

    dispose() {
        this.scene.dispose();
        this.htmlRoot.remove();
    }
}
