import editorHTML from "../../html/bodyEditor.html";
import {SolidPlanet} from "../celestialBodies/planets/solidPlanet";
import {Star} from "../celestialBodies/stars/star";
import {Slider} from "handle-sliderjs";
import {CelestialBodyType} from "../celestialBodies/interfaces";
import {Settings} from "../settings";
import {Color3} from "@babylonjs/core";

export enum EditorVisibility {
    HIDDEN,
    NAVBAR,
    FULL
}

export class BodyEditor {
    visibility: EditorVisibility = EditorVisibility.HIDDEN

    currentPlanet: SolidPlanet | null = null;
    currentStar: Star | null = null;

    generalSliders: Slider[] = [];
    physicSliders: Slider[] = [];
    oceanSliders: Slider[] = [];
    surfaceSliders: Slider[] = [];
    cloudsSliders: Slider[] = [];
    atmosphereSliders: Slider[] = [];
    ringsSliders: Slider[] = [];
    starSliders: Slider[] = [];
    sliders: Slider[][] = [this.generalSliders, this.physicSliders, this.oceanSliders,
        this.surfaceSliders, this.cloudsSliders, this.atmosphereSliders, this.ringsSliders,
        this.starSliders];

    constructor(visibility: EditorVisibility) {
        document.body.innerHTML += editorHTML;
        this.setVisibility(visibility);
    }

    public setVisibility(visibility: EditorVisibility): void {
        this.visibility = visibility;
        switch (this.visibility) {
            case EditorVisibility.HIDDEN:
                document.getElementById("navBar")!.style.visibility = "hidden";
                document.getElementById("editorPanelContainer")!.style.visibility = "hidden";
                break;
            case EditorVisibility.NAVBAR:
                document.getElementById("navBar")!.style.visibility = "visible";
                document.getElementById("editorPanelContainer")!.style.visibility = "hidden";
                break;
            case EditorVisibility.FULL:
                document.getElementById("navBar")!.style.visibility = "visible";
                document.getElementById("editorPanelContainer")!.style.visibility = "visible";
                break;
            default:
                throw new Error("BodyEditor received an unusual visibility state");
        }
    }

    public getVisibility(): EditorVisibility {
        return this.visibility;
    }

    public setBody(body: SolidPlanet | Star) {
        switch (body.getBodyType()) {
            case CelestialBodyType.SOLID:
                this.setPlanet(body as SolidPlanet);
                break;
            case CelestialBodyType.STAR:
                this.setStar(body as Star);
                break;
            case CelestialBodyType.GAZ:
                break;
            default:
        }
    }

    public setPlanet(planet: SolidPlanet) {
        this.currentPlanet = planet;
        this.currentStar = null;

        this.initGeneralSliders(planet);
        this.initPhysicSliders(planet);
        this.initCloudsSliders(planet);
        this.initRingsSliders(planet);
        this.initOceanSliders(planet);
    }

    public setStar(star: Star) {

    }

    public initGeneralSliders(planet: SolidPlanet) {
        this.generalSliders.push(new Slider("timeModifier", document.getElementById("timeModifier")!, 0, 200, Settings.TIME_MULTIPLIER, (val: number) => {
            Settings.TIME_MULTIPLIER = val;
        }));
    }

    public initPhysicSliders(planet: SolidPlanet) {
        for (const slider of this.physicSliders) slider.remove();
        this.physicSliders.length = 0;

        this.physicSliders.push(new Slider("minTemperature", document.getElementById("minTemperature")!, -273, 300, planet.physicalProperties.minTemperature, (val: number) => {
            planet.physicalProperties.minTemperature = val;
        }));
        this.physicSliders.push(new Slider("maxTemperature", document.getElementById("maxTemperature")!, -273, 300, planet.physicalProperties.maxTemperature, (val: number) => {
            planet.physicalProperties.maxTemperature = val;
        }));
    }

    public initCloudsSliders(planet: SolidPlanet) {
        for (const slider of this.cloudsSliders) slider.remove();
        this.cloudsSliders.length = 0;

        if(planet.postProcesses.clouds != null) {
            let flatClouds = planet.postProcesses.clouds!;

            document.getElementById("cloudsToggler")?.addEventListener("click", () => {
                let checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
                checkbox.checked = !checkbox.checked;
                flatClouds.settings.cloudLayerRadius = checkbox.checked ? Settings.PLANET_RADIUS + Settings.CLOUD_LAYER_HEIGHT : 0;
            });

            let cloudColorPicker = document.getElementById("cloudColor") as HTMLInputElement;
            cloudColorPicker.value = flatClouds.settings.cloudColor.toHexString();
            cloudColorPicker.addEventListener("input", () => {
                flatClouds.settings.cloudColor = Color3.FromHexString(cloudColorPicker.value);
            });


            this.cloudsSliders.push(new Slider("cloudFrequency", document.getElementById("cloudFrequency")!, 0, 20, flatClouds.settings.cloudFrequency, (val: number) => {
                flatClouds.settings.cloudFrequency = val;
            }));

            this.cloudsSliders.push(new Slider("cloudDetailFrequency", document.getElementById("cloudDetailFrequency")!, 0, 50, flatClouds.settings.cloudDetailFrequency, (val: number) => {
                flatClouds.settings.cloudDetailFrequency = val;
            }));

            this.cloudsSliders.push(new Slider("cloudPower", document.getElementById("cloudPower")!, 0, 100, flatClouds.settings.cloudPower * 10, (val: number) => {
                flatClouds.settings.cloudPower = val / 10;
            }));

            this.cloudsSliders.push(new Slider("cloudSharpness", document.getElementById("cloudSharpness")!, 0, 100, flatClouds.settings.cloudSharpness, (val: number) => {
                flatClouds.settings.cloudSharpness = val;
            }));

            this.cloudsSliders.push(new Slider("worleySpeed", document.getElementById("worleySpeed")!, 0.0, 200.0, flatClouds.settings.worleySpeed * 10000, (val: number) => {
                flatClouds.settings.worleySpeed = val / 10000;
            }));

            this.cloudsSliders.push(new Slider("detailSpeed", document.getElementById("detailSpeed")!, 0, 200, flatClouds.settings.detailSpeed * 10000, (val: number) => {
                flatClouds.settings.detailSpeed = val / 10000;
            }));
        }
    }

    public initRingsSliders(planet: SolidPlanet) {
        for (const slider of this.ringsSliders) slider.remove();
        this.ringsSliders.length = 0;

        if (planet.postProcesses.rings != null) {
            let rings = planet.postProcesses.rings!;
            document.getElementById("ringsToggler")?.addEventListener("click", () => {
                let checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
                checkbox.checked = !checkbox.checked;
                rings.settings.ringFrequency = checkbox.checked ? 30 : 0;
            });

            this.ringsSliders.push(new Slider("ringsMinRadius", document.getElementById("ringsMinRadius")!, 100, 200, rings.settings.ringStart * 100, (val: number) => {
                rings.settings.ringStart = val / 100;
            }));

            this.ringsSliders.push(new Slider("ringsMaxRadius", document.getElementById("ringsMaxRadius")!, 150, 400, rings.settings.ringEnd * 100, (val: number) => {
                rings.settings.ringEnd = val / 100;
            }));

            this.ringsSliders.push(new Slider("ringsFrequency", document.getElementById("ringsFrequency")!, 10, 100, rings.settings.ringFrequency, (val: number) => {
                rings.settings.ringFrequency = val;
            }));

            this.ringsSliders.push(new Slider("ringsOpacity", document.getElementById("ringsOpacity")!, 0, 100, rings.settings.ringOpacity * 100, (val: number) => {
                rings.settings.ringOpacity = val / 100;
            }));
        }
    }

    public initOceanSliders(planet: SolidPlanet) {
        for (const slider of this.oceanSliders) slider.remove();
        this.oceanSliders.length = 0;

        if(planet.postProcesses.ocean != null) {
            let ocean = planet.postProcesses.ocean;

            document.getElementById("oceanToggler")?.addEventListener("click", () => {
                let checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
                checkbox.checked = !checkbox.checked;
                ocean.settings.oceanRadius = checkbox.checked ? planet.getApparentRadius() : 0;
            });

            this.oceanSliders.push(new Slider("alphaModifier", document.getElementById("alphaModifier")!, 0, 200, ocean.settings.alphaModifier * 10000, (val: number) => {
                ocean.settings.alphaModifier = val / 10000;
            }));

            this.oceanSliders.push(new Slider("depthModifier", document.getElementById("depthModifier")!, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
                ocean.settings.depthModifier = val / 10000;
            }));

            this.oceanSliders.push(new Slider("specularPower", document.getElementById("specularPower")!, 0, 100, ocean.settings.specularPower * 10, (val: number) => {
                ocean.settings.specularPower = val / 10;
            }));

            this.oceanSliders.push(new Slider("smoothness", document.getElementById("smoothness")!, 0, 100, ocean.settings.smoothness * 100, (val: number) => {
                ocean.settings.smoothness = val / 100;
            }));

            this.oceanSliders.push(new Slider("waveBlendingSharpness", document.getElementById("waveBlendingSharpness")!, 0, 100, ocean.settings.waveBlendingSharpness * 100, (val: number) => {
                ocean.settings.waveBlendingSharpness = val / 100;
            }));
        }
    }

    public updateAllSliders() {
        for (const sliderGroup of this.sliders) {
            for (const slider of sliderGroup) slider.update(false);
        }
    }
}