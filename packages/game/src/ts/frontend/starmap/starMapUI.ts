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

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";
import { type Scene } from "@babylonjs/core/scene";

import { factionToString } from "@/backend/society/factions";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";
import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { wrapVector3 } from "@/frontend/helpers/algebra";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";

import { getRgbFromTemperature } from "@/utils/specrend";
import { type DeepReadonly } from "@/utils/types";

import i18n from "@/i18n";

import { type Player } from "../player/player";
import { StarMapBookmarkButton } from "./starMapBookmarkButton";
import { SystemIcons } from "./systemIcons";

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
    readonly shortHandUIBookmarkButton: StarMapBookmarkButton;

    private selectedSystem: StarSystemCoordinates | null = null;
    private hoveredSystem: StarSystemCoordinates | null = null;
    private currentSystem: StarSystemCoordinates | null = null;

    private systemIcons: SystemIcons[] = [];

    private readonly scene: Scene;

    private readonly player: Player;

    private readonly universeBackend: UniverseBackend;

    readonly onSystemFocusObservable = new Observable<StarSystemCoordinates>();

    private formatLyDistance(distanceInLy: number): string {
        return distanceInLy.toLocaleString(i18n.resolvedLanguage, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
    }

    constructor(scene: Scene, player: Player, universeBackend: UniverseBackend, soundPlayer: ISoundPlayer) {
        this.scene = scene;
        this.scene.hoverCursor = "none";

        this.player = player;

        this.universeBackend = universeBackend;

        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("starMapUI");
        document.body.appendChild(this.htmlRoot);

        this.selectedSystemCursorContainer = document.createElement("div");
        this.selectedSystemCursorContainer.classList.add("targetCursorRoot");
        this.htmlRoot.appendChild(this.selectedSystemCursorContainer);

        this.selectedSystemCursor = document.createElement("div");
        this.selectedSystemCursor.classList.add("targetCursor", "rounded");
        this.selectedSystemCursorContainer.appendChild(this.selectedSystemCursor);
        this.selectedSystemCursor.addEventListener("click", () => {
            if (this.selectedSystem === null) return;
            this.onSystemFocusObservable.notifyObservers(this.selectedSystem);
        });

        this.hoveredSystemCursorContainer = document.createElement("div");
        this.hoveredSystemCursorContainer.classList.add("targetCursorRoot");
        this.htmlRoot.appendChild(this.hoveredSystemCursorContainer);

        this.hoveredSystemCursor = document.createElement("div");
        this.hoveredSystemCursor.classList.add("targetCursor", "rounded");
        this.hoveredSystemCursorContainer.appendChild(this.hoveredSystemCursor);
        this.hoveredSystemCursor.addEventListener("click", () => {
            if (this.hoveredSystem === null) return;
            this.onSystemFocusObservable.notifyObservers(this.hoveredSystem);
        });

        this.currentSystemCursorContainer = document.createElement("div");
        this.currentSystemCursorContainer.classList.add("targetCursorRoot");
        this.htmlRoot.appendChild(this.currentSystemCursorContainer);

        this.currentSystemCursor = document.createElement("div");
        this.currentSystemCursor.classList.add("targetCursor", "rounded", "target");
        this.currentSystemCursorContainer.appendChild(this.currentSystemCursor);
        this.currentSystemCursor.addEventListener("click", () => {
            if (this.currentSystem === null) return;
            this.onSystemFocusObservable.notifyObservers(this.currentSystem);
        });

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

        this.factions = document.createElement("p");
        this.factions.classList.add("starMapInfoPanelFactions");
        this.humanPresence.appendChild(this.factions);

        this.cursor = document.createElement("div");
        this.cursor.classList.add("virtualCursor");
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

        this.shortHandUIBookmarkButton = new StarMapBookmarkButton(player, soundPlayer);
        this.shortHandUIButtonContainer.appendChild(this.shortHandUIBookmarkButton.rootNode);

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

        this.rebuildSystemIcons();

        this.systemIcons.forEach((systemIcons) => {
            const systemPosition = wrapVector3(
                this.universeBackend.getSystemGalacticPosition(systemIcons.getSystemCoordinates()),
            );

            const screenCoordinates = Vector3.Project(
                systemPosition,
                Matrix.IdentityReadOnly,
                camera.getTransformationMatrix(),
                camera.viewport,
            );
            systemIcons.htmlRoot.classList.toggle("transparent", screenCoordinates.z < 0);
            systemIcons.htmlRoot.style.left = `${screenCoordinates.x * 100}vw`;
            systemIcons.htmlRoot.style.top = `${screenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(systemPosition, playerPosition);
            const offsetX = Math.max(40.0 / distance, 3);
            systemIcons.htmlRoot.style.transform = `translate(calc(-50% - ${offsetX}vw), -50%)`;
        });

        // disable the plot itinerary button if the selected mesh is the current mesh
        this.shortHandUIPlotItineraryButton.disabled =
            this.selectedSystem !== null &&
            this.currentSystem !== null &&
            starSystemCoordinatesEquals(this.selectedSystem, this.currentSystem);

        const scalingBase = 100;
        const minScale = 5.0;
        if (this.selectedSystem !== null) {
            const selectedSystemPosition = wrapVector3(
                this.universeBackend.getSystemGalacticPosition(this.selectedSystem),
            );
            const selectedMeshScreenCoordinates = Vector3.Project(
                selectedSystemPosition,
                Matrix.IdentityReadOnly,
                camera.getTransformationMatrix(),
                camera.viewport,
            );
            this.selectedSystemCursorContainer.classList.toggle(
                "transparent",
                selectedMeshScreenCoordinates.z < 0 ||
                    (this.currentSystem !== null &&
                        starSystemCoordinatesEquals(this.selectedSystem, this.currentSystem)),
            );
            this.selectedSystemCursorContainer.style.left = `${selectedMeshScreenCoordinates.x * 100}vw`;
            this.selectedSystemCursorContainer.style.top = `${selectedMeshScreenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(selectedSystemPosition, playerPosition);
            const scale = Math.max(minScale, scalingBase / distance);
            this.selectedSystemCursorContainer.style.setProperty("--dim", `${scale}vh`);

            const xOffsetBase = 500;
            const minXOffset = 25;
            const xOffset = Math.max(minXOffset, xOffsetBase / distance);
            this.shortHandUI.style.visibility = selectedMeshScreenCoordinates.z >= 0 ? "visible" : "hidden";
            this.shortHandUI.style.transform = `translate(calc(${(selectedMeshScreenCoordinates.x * width).toFixed(0)}px + ${xOffset}px), calc(${(selectedMeshScreenCoordinates.y * height).toFixed(0)}px - 50%))`;
        } else {
            this.shortHandUI.style.visibility = "hidden";
            this.selectedSystemCursorContainer.classList.add("transparent");
        }

        if (
            this.hoveredSystem !== null &&
            this.currentSystem !== null &&
            !starSystemCoordinatesEquals(this.hoveredSystem, this.currentSystem)
        ) {
            const hoveredSystemPosition = wrapVector3(
                this.universeBackend.getSystemGalacticPosition(this.hoveredSystem),
            );
            const meshScreenCoordinates = Vector3.Project(
                hoveredSystemPosition,
                Matrix.IdentityReadOnly,
                camera.getTransformationMatrix(),
                camera.viewport,
            );
            this.hoveredSystemCursorContainer.classList.toggle("transparent", meshScreenCoordinates.z < 0);
            this.hoveredSystemCursorContainer.style.left = `${meshScreenCoordinates.x * 100}vw`;
            this.hoveredSystemCursorContainer.style.top = `${meshScreenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(hoveredSystemPosition, playerPosition);
            const scale = Math.max(minScale, scalingBase / distance);
            this.hoveredSystemCursorContainer.style.setProperty("--dim", `${scale}vh`);
        } else {
            this.hoveredSystemCursorContainer.classList.add("transparent");
        }

        if (this.currentSystem !== null) {
            const currentSystemPosition = wrapVector3(
                this.universeBackend.getSystemGalacticPosition(this.currentSystem),
            );
            const meshScreenCoordinates = Vector3.Project(
                currentSystemPosition,
                Matrix.IdentityReadOnly,
                camera.getTransformationMatrix(),
                camera.viewport,
            );
            this.currentSystemCursorContainer.classList.toggle("transparent", meshScreenCoordinates.z < 0);
            this.currentSystemCursorContainer.style.left = `${meshScreenCoordinates.x * 100}vw`;
            this.currentSystemCursorContainer.style.top = `${meshScreenCoordinates.y * 100}vh`;

            const distance = Vector3.Distance(currentSystemPosition, playerPosition);
            const scale = Math.max(minScale, scalingBase / distance);
            this.currentSystemCursorContainer.style.setProperty("--dim", `${scale}vh`);
        } else {
            this.currentSystemCursorContainer.classList.add("transparent");
        }
    }

    setHoveredSystem(system: StarSystemCoordinates | null) {
        if (system === this.currentSystem || system === this.selectedSystem) return;
        this.hoveredSystem = system;
    }

    setCurrentSystem(systemCoordinates: StarSystemCoordinates) {
        this.currentSystem = systemCoordinates;
    }

    setSelectedSystem(
        targetSystemModel: DeepReadonly<StarSystemModel>,
        currentSystemCoordinates: StarSystemCoordinates | null,
    ) {
        this.selectedSystem = targetSystemModel.coordinates;

        const targetPosition = wrapVector3(
            this.universeBackend.getSystemGalacticPosition(targetSystemModel.coordinates),
        );

        if (currentSystemCoordinates !== null) {
            const currentPosition = wrapVector3(
                this.universeBackend.getSystemGalacticPosition(currentSystemCoordinates),
            );
            this.shortHandUIDistanceFromCurrent.textContent = `${i18n.t("starMap:distanceFromCurrent")}: ${i18n.t(
                "units:shortLy",
                {
                    value: this.formatLyDistance(Vector3.Distance(currentPosition, targetPosition)),
                },
            )}`;
        }

        //TODO: when implementing binary star systems, this will need to be updated to display all stellar objects and not just the first one
        const starModel = targetSystemModel.stellarObjects[0];

        this.shortHandUISystemType.textContent = getOrbitalObjectTypeToI18nString(starModel);
        this.shortHandUIBookmarkButton.setSelectedSystemSeed(targetSystemModel.coordinates);

        const objectColor = getRgbFromTemperature(starModel.blackBodyTemperature);
        const objectColorHexString = new Color3(objectColor.r, objectColor.g, objectColor.b).toHexString();
        this.infoPanelStarPreview.style.background = objectColorHexString;
        this.infoPanelStarPreview.style.boxShadow = `0 0 20px ${objectColorHexString}`;

        this.infoPanelTitle.textContent = targetSystemModel.name;
        this.shortHandUITitle.textContent = targetSystemModel.name;

        this.starSector.innerText = `X:${targetSystemModel.coordinates.starSectorX} Y:${targetSystemModel.coordinates.starSectorY} Z:${targetSystemModel.coordinates.starSectorZ}
            x:${targetSystemModel.coordinates.localX.toFixed(2)} y:${targetSystemModel.coordinates.localY.toFixed(2)} z:${targetSystemModel.coordinates.localZ.toFixed(2)}`;

        this.nbPlanets.textContent = `${i18n.t("starMap:planets")}: ${targetSystemModel.planets.length}`;

        this.distanceToSol.textContent = `${i18n.t("starMap:distanceToSol")}: ${i18n.t("units:shortLy", {
            value: this.formatLyDistance(Vector3.Distance(targetPosition, Vector3.Zero())),
        })}`;

        if (this.universeBackend.isSystemInHumanBubble(targetSystemModel.coordinates)) {
            const spaceStations = targetSystemModel.orbitalFacilities;

            this.nbSpaceStations.textContent = `${i18n.t("starMap:spaceStations")}: ${spaceStations.length}`;

            const factionNames = spaceStations.map((station) => factionToString(station.faction));
            const uniqueFactions = Array.from(new Set(factionNames));

            if (uniqueFactions.length > 0) {
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

    rebuildSystemIcons() {
        const bookmarkedSystems = this.player.systemBookmarks;
        const targetSystems = this.player.currentMissions.flatMap((mission) => mission.getTargetSystems());

        const systemsWithIcons = bookmarkedSystems
            // add target systems to the list of systems with icons
            .concat(targetSystems)
            // remove duplicates
            .filter((value, index, self) => self.findIndex((v) => starSystemCoordinatesEquals(v, value)) === index);

        const systemIconsToKeep: SystemIcons[] = [];

        this.systemIcons.forEach((systemIcons) => {
            const system = systemIcons.getSystemCoordinates();
            if (!systemsWithIcons.includes(system)) {
                systemIcons.dispose();
                return;
            }

            systemIcons.update(system, SystemIcons.IconMaskForSystem(system, bookmarkedSystems, targetSystems));

            systemIconsToKeep.push(systemIcons);
            systemsWithIcons.splice(systemsWithIcons.indexOf(system), 1);
        });

        this.systemIcons = systemIconsToKeep;

        systemsWithIcons.forEach((system) => {
            const icon = new SystemIcons(
                system,
                SystemIcons.IconMaskForSystem(system, bookmarkedSystems, targetSystems),
            );
            icon.htmlRoot.addEventListener("click", () => {
                this.onSystemFocusObservable.notifyObservers(icon.getSystemCoordinates());
            });

            this.htmlRoot.appendChild(icon.htmlRoot);
            this.systemIcons.push(icon);
        });
    }

    dispose() {
        this.scene.dispose();
        this.htmlRoot.remove();
    }
}
