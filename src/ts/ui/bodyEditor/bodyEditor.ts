import editorHTML from "../../../html/bodyEditor.html";
import { TelluricPlanemo } from "../../bodies/planemos/telluricPlanemo";
import { Star } from "../../bodies/stellarObjects/star";
import { AbstractBody } from "../../bodies/abstractBody";
import "handle-sliderjs/dist/css/style2.css";
import { ColorMode } from "../../materials/colorSettingsInterface";
import { hide, show } from "../../utils/html";
import { GasPlanet } from "../../bodies/planemos/gasPlanet";
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
import { UberScene } from "../../uberCore/uberScene";
import { BODY_TYPE } from "../../descriptors/common";

export enum EditorVisibility {
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

    private readonly generalPanel: EditorPanel;
    private readonly physicPanel: EditorPanel;
    private readonly oceanPanel: EditorPanel;
    private readonly surfacePanel: EditorPanel;
    private readonly gazCloudsPanel: EditorPanel;
    private readonly cloudsPanel: EditorPanel;
    private readonly atmospherePanel: EditorPanel;
    private readonly ringsPanel: EditorPanel;
    private readonly starPanel: EditorPanel;
    private readonly panels: EditorPanel[];

    constructor(visibility: EditorVisibility = EditorVisibility.FULL) {
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
        this.panels = [
            this.generalPanel,
            this.physicPanel,
            this.oceanPanel,
            this.surfacePanel,
            this.cloudsPanel,
            this.gazCloudsPanel,
            this.atmospherePanel,
            this.ringsPanel,
            this.starPanel
        ];

        this.setVisibility(visibility);

        this.currentPanel = this.generalPanel;
        for (const panel of this.panels) {
            panel.anchor.addEventListener("click", () => this.switchPanel(panel));
        }
    }

    public switchPanel(panel: EditorPanel): void {
        if (this.currentPanel == null) this.setVisibility(EditorVisibility.FULL);
        else {
            this.currentPanel.hide();
            if (this.currentPanel == panel) {
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

    public setBody(body: AbstractBody, postProcessManager: PostProcessManager, scene: UberScene) {
        this.currentBodyId = body.name;
        this.initNavBar(body);
        switch (body.descriptor.bodyType) {
            case BODY_TYPE.TELLURIC:
                this.setTelluricPlanet(body as TelluricPlanemo, postProcessManager, scene);
                break;
            case BODY_TYPE.STAR:
                this.setStar(body as Star, postProcessManager, scene);
                break;
            case BODY_TYPE.GAS:
                this.setGazPlanet(body as GasPlanet, postProcessManager, scene);
                break;
            default:
        }
        this.generalPanel.init(body, postProcessManager, scene);
        this.ringsPanel.init(body, postProcessManager, scene);
    }

    public setTelluricPlanet(planet: TelluricPlanemo, postProcessManager: PostProcessManager, scene: UberScene) {
        this.physicPanel.init(planet, postProcessManager, scene);
        this.surfacePanel.init(planet, postProcessManager, scene);
        this.atmospherePanel.init(planet, postProcessManager, scene);
        this.cloudsPanel.init(planet, postProcessManager, scene);
        this.oceanPanel.init(planet, postProcessManager, scene);

        this.initToolbar(planet);
    }

    public setGazPlanet(planet: GasPlanet, postProcessManager: PostProcessManager, scene: UberScene) {
        this.gazCloudsPanel.init(planet, postProcessManager, scene);
        this.atmospherePanel.init(planet, postProcessManager, scene);
    }

    public setStar(star: Star, postProcesManager: PostProcessManager, scene: UberScene) {
        this.starPanel.init(star, postProcesManager, scene);
    }

    public initNavBar(body: AbstractBody): void {
        for (const panel of this.panels) panel.disable();

        switch (body.descriptor.bodyType) {
            case BODY_TYPE.STAR:
                this.starPanel.enable();
                break;
            case BODY_TYPE.TELLURIC:
                this.physicPanel.enable();

                this.oceanPanel.enable();
                this.oceanPanel.setVisibility(this.currentPanel === this.oceanPanel && (body as TelluricPlanemo).postProcesses.ocean !== null);

                this.surfacePanel.enable();

                this.cloudsPanel.enable();
                this.cloudsPanel.setVisibility(this.currentPanel === this.cloudsPanel && (body as TelluricPlanemo).postProcesses.clouds !== null);

                this.atmospherePanel.enable();
                this.atmospherePanel.setVisibility(this.currentPanel === this.atmospherePanel && (body as TelluricPlanemo).postProcesses.atmosphere !== null);

                break;
            case BODY_TYPE.GAS:
                this.atmospherePanel.enable();
                this.atmospherePanel.setVisibility(this.currentPanel === this.atmospherePanel);

                this.gazCloudsPanel.enable();
                this.gazCloudsPanel.setVisibility(this.currentPanel === this.gazCloudsPanel);
                break;
        }
        if (this.currentPanel !== null) {
            const currentNavBarButton = this.currentPanel.anchor;
            if (currentNavBarButton.style.display === "none") this.setVisibility(EditorVisibility.NAVBAR);
            else this.currentPanel.show();
        }
    }

    public initToolbar(planet: TelluricPlanemo) {
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

    public update(nearestBody: AbstractBody, postProcessManager: PostProcessManager, scene: UberScene) {
        if (nearestBody.name !== this.currentBodyId) this.setBody(nearestBody, postProcessManager, scene);
    }
}
