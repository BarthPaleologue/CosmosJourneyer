//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import editorHTML from "../../../html/bodyEditor.html";
import { TelluricPlanet } from "../../planets/telluricPlanet/telluricPlanet";
import "handle-sliderjs/dist/css/style2.css";
import { ColorMode } from "../../planets/telluricPlanet/colorSettingsInterface";
import { hide, show } from "../../utils/html";
import { GasPlanet } from "../../planets/gasPlanet/gasPlanet";
import { EditorPanel } from "./editorPanel";
import { GeneralPanel } from "./panels/generalPanel";
import { PhysicPanel } from "./panels/physicPanel";
import { StarPanel } from "./panels/starPanel";
import { SurfacePanel } from "./panels/surfacePanel";
import { GasCloudsPanel } from "./panels/gasCloudsPanel";
import { AtmospherePanel } from "./panels/atmospherePanel";
import { CloudsPanel } from "./panels/cloudsPanel";
import { RingsPanel } from "./panels/ringsPanel";
import { OceanPanel } from "./panels/oceanPanel";
import { PostProcessManager } from "../../postProcesses/postProcessManager";
import { BlackholePanel } from "./panels/blackholePanel";
import { Star } from "../../stellarObjects/star/star";
import { BlackHole } from "../../stellarObjects/blackHole/blackHole";
import { CelestialBody } from "../../architecture/celestialBody";
import { Scene } from "@babylonjs/core/scene";

export const enum EditorVisibility {
    HIDDEN,
    NAVBAR,
    FULL
}

export class BodyEditor {
    private canvas: HTMLCanvasElement | null = null;

    private visibility: EditorVisibility = EditorVisibility.HIDDEN;

    private readonly navBar: HTMLElement;
    private currentPanel: EditorPanel | null;

    private currentBodyId: string | null = null;

    private readonly generalPanel: GeneralPanel;
    private readonly physicPanel: PhysicPanel;
    private readonly oceanPanel: OceanPanel;
    private readonly surfacePanel: SurfacePanel;
    private readonly gazCloudsPanel: GasCloudsPanel;
    private readonly cloudsPanel: CloudsPanel;
    private readonly atmospherePanel: AtmospherePanel;
    private readonly ringsPanel: RingsPanel;
    private readonly starPanel: StarPanel;
    private readonly blackHolePanel: BlackholePanel;
    private readonly panels: EditorPanel[];

    constructor(visibility: EditorVisibility = EditorVisibility.FULL) {
        if (document.querySelector("#editorPanelContainer") !== null) {
            document.querySelector("#editorPanelContainer")?.remove();
        }
        if (document.querySelector("#toolbar") !== null) {
            document.querySelector("#toolbar")?.remove();
        }
        if (document.querySelector("#navBar") !== null) {
            document.querySelector("#navBar")?.remove();
        }

        document.body.insertAdjacentHTML("beforeend", editorHTML);
        this.navBar = document.getElementById("navBar") as HTMLElement;

        this.generalPanel = new GeneralPanel();
        this.physicPanel = new PhysicPanel();
        this.oceanPanel = new OceanPanel();
        this.surfacePanel = new SurfacePanel();
        this.gazCloudsPanel = new GasCloudsPanel();
        this.cloudsPanel = new CloudsPanel();
        this.atmospherePanel = new AtmospherePanel();
        this.ringsPanel = new RingsPanel();
        this.starPanel = new StarPanel();
        this.blackHolePanel = new BlackholePanel();
        this.panels = [
            this.generalPanel,
            this.physicPanel,
            this.oceanPanel,
            this.surfacePanel,
            this.cloudsPanel,
            this.gazCloudsPanel,
            this.atmospherePanel,
            this.ringsPanel,
            this.starPanel,
            this.blackHolePanel
        ];

        this.setVisibility(visibility);

        this.currentPanel = this.generalPanel;
        for (const panel of this.panels) {
            panel.anchor.addEventListener("click", () => this.switchPanel(panel));
        }
    }

    public switchPanel(panel: EditorPanel): void {
        if (this.currentPanel === null) this.setVisibility(EditorVisibility.FULL);
        else {
            this.currentPanel.hide();
            if (this.currentPanel === panel) {
                this.currentPanel = null;
                this.setVisibility(EditorVisibility.NAVBAR);
                return;
            }
        }
        this.currentPanel = panel;
        this.currentPanel.show();
        setTimeout(() => this.updateAllSliders(), 500);
    }

    public setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.resize();
    }

    public resize() {
        if (this.canvas === null) throw new Error("BodyEditor has no canvas");

        if (this.visibility !== EditorVisibility.FULL) this.canvas.width = window.innerWidth;
        else this.canvas.width = window.innerWidth - 300;
        this.canvas.height = window.innerHeight;
    }

    public setVisibility(visibility: EditorVisibility): void {
        this.visibility = visibility;
        switch (this.visibility) {
            case EditorVisibility.HIDDEN:
                this.navBar.style.display = "none";
                hide("editorPanelContainer");
                hide("toolbar");
                this.currentPanel = null;
                break;
            case EditorVisibility.NAVBAR:
                this.navBar.style.display = "flex";
                hide("editorPanelContainer");
                hide("toolbar");
                break;
            case EditorVisibility.FULL:
                this.navBar.style.display = "flex";
                show("editorPanelContainer");
                show("toolbar");
                break;
            default:
                throw new Error("BodyEditor received an unusual visibility state");
        }
        window.dispatchEvent(new Event("resize"));
    }

    public getVisibility(): EditorVisibility {
        return this.visibility;
    }

    public setBody(body: CelestialBody, postProcessManager: PostProcessManager, scene: Scene) {
        this.currentBodyId = body.name;

        for (const panel of this.panels) panel.disable();

        this.generalPanel.enable();
        this.generalPanel.setVisibility(this.currentPanel === this.generalPanel);
        this.generalPanel.init(body, postProcessManager.colorCorrection, scene);

        const rings = postProcessManager.getRings(body);
        if (rings) {
            this.ringsPanel.enable();
            this.ringsPanel.setVisibility(this.currentPanel === this.ringsPanel);
            this.ringsPanel.init(body, rings);
        }

        if (body instanceof TelluricPlanet || body instanceof GasPlanet) {
            const atmosphere = postProcessManager.getAtmosphere(body as TelluricPlanet);
            if (atmosphere) {
                this.atmospherePanel.enable();
                this.atmospherePanel.setVisibility(this.currentPanel === this.atmospherePanel);
                this.atmospherePanel.init(body, atmosphere);
            }

            if (body instanceof TelluricPlanet) {
                this.initToolbar(body);

                this.surfacePanel.enable();
                this.surfacePanel.setVisibility(this.currentPanel === this.surfacePanel);
                this.surfacePanel.init(body);

                this.physicPanel.enable();
                this.physicPanel.setVisibility(this.currentPanel === this.physicPanel);
                this.physicPanel.init(body);

                const clouds = postProcessManager.getClouds(body as TelluricPlanet);
                if (clouds) {
                    this.cloudsPanel.enable();
                    this.cloudsPanel.setVisibility(this.currentPanel === this.cloudsPanel);
                    this.cloudsPanel.init(body, clouds);
                }

                const ocean = postProcessManager.getOcean(body as TelluricPlanet);
                if (ocean) {
                    this.oceanPanel.enable();
                    this.oceanPanel.setVisibility(this.currentPanel === this.oceanPanel);
                    this.oceanPanel.init(body, ocean);
                }
            } else {
                this.gazCloudsPanel.enable();
                this.gazCloudsPanel.setVisibility(this.currentPanel === this.gazCloudsPanel);
                this.gazCloudsPanel.init(body);
            }
        } else if (body instanceof Star) {
            const volumetricLight = postProcessManager.getVolumetricLight(body as Star);
            if (volumetricLight) {
                this.starPanel.enable();
                this.starPanel.setVisibility(this.currentPanel === this.starPanel);
                this.starPanel.init(body, volumetricLight);
            }
        } else if (body instanceof BlackHole) {
            const blackHole = postProcessManager.getBlackHole(body as BlackHole);
            if (blackHole) {
                this.blackHolePanel.enable();
                this.blackHolePanel.setVisibility(this.currentPanel === this.blackHolePanel);
                this.blackHolePanel.init(body, blackHole);
            }
        }

        if (this.currentPanel !== null) {
            const currentNavBarButton = this.currentPanel.anchor;
            if (currentNavBarButton.style.display === "none") this.setVisibility(EditorVisibility.NAVBAR);
            else this.currentPanel.show();
        }
    }

    public initToolbar(planet: TelluricPlanet) {
        const material = planet.material;
        const colorSettings = material.colorSettings;
        document.getElementById("defaultMapButton")?.addEventListener("click", () => {
            colorSettings.mode = ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("moistureMapButton")?.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode !== ColorMode.MOISTURE ? ColorMode.MOISTURE : ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("temperatureMapButton")?.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode !== ColorMode.TEMPERATURE ? ColorMode.TEMPERATURE : ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("normalMapButton")?.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode !== ColorMode.NORMAL ? ColorMode.NORMAL : ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("heightMapButton")?.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode !== ColorMode.HEIGHT ? ColorMode.HEIGHT : ColorMode.DEFAULT;
            material.updateConstants();
        });
    }

    public updateAllSliders() {
        for (const panel of this.panels) panel.updateAllSliders();
    }

    public update(nearestBody: CelestialBody, postProcessManager: PostProcessManager, scene: Scene) {
        if (nearestBody.name !== this.currentBodyId) this.setBody(nearestBody, postProcessManager, scene);
    }
}
