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

import { TelluricPlanet } from "../../planets/telluricPlanet/telluricPlanet";
import "handle-sliderjs/dist/css/style2.css";
import { ColorMode } from "../../planets/telluricPlanet/colorSettingsInterface";
import { hide, show } from "../../utils/html";
import { GasPlanet } from "../../planets/gasPlanet/gasPlanet";
import { EditorPanel } from "./editorPanel";
import { GeneralPanel } from "./panels/generalPanel";
import { StarPanel } from "./panels/starPanel";
import { SurfacePanel } from "./panels/surfacePanel";
import { GasCloudsPanel } from "./panels/gasCloudsPanel";
import { AtmospherePanel } from "./panels/atmospherePanel";
import { OceanPanel } from "./panels/oceanPanel";
import { PostProcessManager } from "../../postProcesses/postProcessManager";
import { BlackholePanel } from "./panels/blackholePanel";
import { Star } from "../../stellarObjects/star/star";
import { BlackHole } from "../../stellarObjects/blackHole/blackHole";
import { Scene } from "@babylonjs/core/scene";
import { TelluricPlanetMaterial } from "../../planets/telluricPlanet/telluricPlanetMaterial";
import { CelestialBody } from "../../architecture/orbitalObject";

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
    private readonly oceanPanel: OceanPanel;
    private readonly surfacePanel: SurfacePanel;
    private readonly gazCloudsPanel: GasCloudsPanel;
    private readonly atmospherePanel: AtmospherePanel;
    private readonly starPanel: StarPanel;
    private readonly blackHolePanel: BlackholePanel;
    private readonly panels: EditorPanel[];

    constructor(visibility: EditorVisibility = EditorVisibility.FULL) {
        this.navBar = document.getElementById("navBar") as HTMLElement;

        this.generalPanel = new GeneralPanel();
        this.oceanPanel = new OceanPanel();
        this.surfacePanel = new SurfacePanel();
        this.gazCloudsPanel = new GasCloudsPanel();
        this.atmospherePanel = new AtmospherePanel();
        this.starPanel = new StarPanel();
        this.blackHolePanel = new BlackholePanel();
        this.panels = [
            this.generalPanel,
            this.oceanPanel,
            this.surfacePanel,
            this.gazCloudsPanel,
            this.atmospherePanel,
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
        this.currentBodyId = body.model.name;

        for (const panel of this.panels) panel.disable();

        this.generalPanel.enable();
        this.generalPanel.setVisibility(this.currentPanel === this.generalPanel);
        this.generalPanel.init(body, postProcessManager.colorCorrection, postProcessManager.bloomRenderEffect, scene);

        if (body instanceof TelluricPlanet || body instanceof GasPlanet) {
            if (body.atmosphereUniforms !== null) {
                this.atmospherePanel.enable();
                this.atmospherePanel.setVisibility(this.currentPanel === this.atmospherePanel);
                this.atmospherePanel.init(body.getRadius(), body.atmosphereUniforms);
            }

            if (body instanceof TelluricPlanet) {
                this.initToolbar(body.material);

                this.surfacePanel.enable();
                this.surfacePanel.setVisibility(this.currentPanel === this.surfacePanel);
                this.surfacePanel.init(body.material);

                if (body.oceanUniforms !== null) {
                    this.oceanPanel.enable();
                    this.oceanPanel.setVisibility(this.currentPanel === this.oceanPanel);
                    this.oceanPanel.init(body.oceanUniforms);
                }
            } else {
                this.gazCloudsPanel.enable();
                this.gazCloudsPanel.setVisibility(this.currentPanel === this.gazCloudsPanel);
                this.gazCloudsPanel.init(body.material);
            }
        } else if (body instanceof Star) {
            this.starPanel.enable();
            this.starPanel.setVisibility(this.currentPanel === this.starPanel);
            this.starPanel.init(body.volumetricLightUniforms);
        } else if (body instanceof BlackHole) {
            this.blackHolePanel.enable();
            this.blackHolePanel.setVisibility(this.currentPanel === this.blackHolePanel);
            this.blackHolePanel.init(body.blackHoleUniforms);
        }

        if (this.currentPanel !== null) {
            const currentNavBarButton = this.currentPanel.anchor;
            if (currentNavBarButton.style.display === "none") this.setVisibility(EditorVisibility.NAVBAR);
            else this.currentPanel.show();
        }
    }

    public initToolbar(planetMaterial: TelluricPlanetMaterial) {
        document.getElementById("defaultMapButton")?.addEventListener("click", () => {
            planetMaterial.setColorMode(ColorMode.DEFAULT);
        });
        document.getElementById("moistureMapButton")?.addEventListener("click", () => {
            planetMaterial.setColorMode(
                planetMaterial.getColorMode() !== ColorMode.MOISTURE ? ColorMode.MOISTURE : ColorMode.DEFAULT
            );
        });
        document.getElementById("temperatureMapButton")?.addEventListener("click", () => {
            planetMaterial.setColorMode(
                planetMaterial.getColorMode() !== ColorMode.TEMPERATURE ? ColorMode.TEMPERATURE : ColorMode.DEFAULT
            );
        });
        document.getElementById("normalMapButton")?.addEventListener("click", () => {
            planetMaterial.setColorMode(
                planetMaterial.getColorMode() !== ColorMode.NORMAL ? ColorMode.NORMAL : ColorMode.DEFAULT
            );
        });
        document.getElementById("heightMapButton")?.addEventListener("click", () => {
            planetMaterial.setColorMode(
                planetMaterial.getColorMode() !== ColorMode.HEIGHT ? ColorMode.HEIGHT : ColorMode.DEFAULT
            );
        });
    }

    public updateAllSliders() {
        for (const panel of this.panels) panel.updateAllSliders();
    }

    public update(nearestBody: CelestialBody, postProcessManager: PostProcessManager, scene: Scene) {
        if (nearestBody.model.name !== this.currentBodyId) this.setBody(nearestBody, postProcessManager, scene);
    }
}
