import editorHTML from "../../html/bodyEditor.html";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { Star } from "../bodies/stars/star";
import { Slider } from "handle-sliderjs";
import { BodyType } from "../bodies/interfaces";
import { Settings } from "../settings";
import { Axis, Color3 } from "@babylonjs/core";
import { PlayerController } from "../player/playerController";
import { AbstractBody } from "../bodies/abstractBody";
import "handle-sliderjs/dist/css/style2.css";
import { ColorMode } from "../materials/colorSettingsInterface";
import { clearAllEventListenersById, hide, hidePanel, show, showPanel } from "../utils/html";
import { stripAxisFromQuaternion } from "../utils/algebra";
import { GasPlanet } from "../bodies/planets/gasPlanet";
import { Planet } from "../bodies/planets/planet";
import { UberScene } from "../core/uberScene";

export enum EditorVisibility {
    HIDDEN,
    NAVBAR,
    FULL
}

export class BodyEditor {
    canvas: HTMLCanvasElement | null = null;

    visibility: EditorVisibility = EditorVisibility.HIDDEN;

    navBar: HTMLElement;
    currentPanel: HTMLElement | null;

    currentBodyId: string | null = null;

    generalSliders: Slider[] = [];
    physicSliders: Slider[] = [];
    oceanSliders: Slider[] = [];
    surfaceSliders: Slider[] = [];
    gazCloudsSliders: Slider[] = [];
    cloudsSliders: Slider[] = [];
    atmosphereSliders: Slider[] = [];
    ringsSliders: Slider[] = [];
    starSliders: Slider[] = [];
    sliders: Slider[][] = [
        this.generalSliders,
        this.physicSliders,
        this.oceanSliders,
        this.surfaceSliders,
        this.cloudsSliders,
        this.atmosphereSliders,
        this.ringsSliders,
        this.starSliders
    ];

    constructor(visibility: EditorVisibility = EditorVisibility.FULL) {
        document.body.innerHTML += editorHTML;
        this.navBar = document.getElementById("navBar")!;

        this.setVisibility(visibility);

        this.currentPanel = document.getElementById("generalUI");
        for (const link of this.navBar.children) {
            link.addEventListener("click", () => {
                const id = link.id.substring(0, link.id.length - 4) + "UI";
                this.switchPanel(id);
            });
        }
    }

    public switchPanel(panelId: string): void {
        const newPanel = document.getElementById(panelId);
        if (newPanel == null) throw new Error(`The panel you requested does not exist : ${panelId}`);

        if (this.currentPanel == null) this.setVisibility(EditorVisibility.FULL);
        else {
            hidePanel(this.currentPanel.id);
            if (this.currentPanel.id == panelId) {
                this.currentPanel = null;
                this.setVisibility(EditorVisibility.NAVBAR);
                return;
            }
        }
        this.currentPanel = newPanel;
        showPanel(this.currentPanel.id);
        setTimeout(() => this.updateAllSliders(), 500);
    }

    public setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public resize() {
        if (this.canvas == null) throw new Error("BodyEditor has no canvas");

        if (this.visibility != EditorVisibility.FULL) this.canvas.width = window.innerWidth;
        else this.canvas.width = window.innerWidth - 300;
        this.canvas.height = window.innerHeight;
    }

    public setVisibility(visibility: EditorVisibility): void {
        this.visibility = visibility;
        switch (this.visibility) {
            case EditorVisibility.HIDDEN:
                document.getElementById("navBar")!.style.display = "none";
                hide("editorPanelContainer");
                hide("toolbar");
                this.currentPanel = null;
                break;
            case EditorVisibility.NAVBAR:
                document.getElementById("navBar")!.style.display = "flex";
                hide("editorPanelContainer");
                hide("toolbar");
                break;
            case EditorVisibility.FULL:
                document.getElementById("navBar")!.style.display = "flex";
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

    public setBody(body: AbstractBody) {
        this.currentBodyId = body.name;
        this.initNavBar(body);
        switch (body.bodyType) {
            case BodyType.TELLURIC:
                this.setTelluricPlanet(body as TelluricPlanet);
                break;
            case BodyType.STAR:
                this.setStar(body as Star);
                break;
            case BodyType.GAZ:
                this.setGazPlanet(body as GasPlanet);
                break;
            default:
        }
        this.initGeneralSliders(body, body.starSystem.scene);
        this.initRingsSliders(body);
    }

    public setTelluricPlanet(planet: TelluricPlanet) {
        this.initPhysicSliders(planet);
        this.initSurfaceSliders(planet);
        this.initAtmosphereSliders(planet);
        this.initCloudsSliders(planet);
        this.initOceanSliders(planet);

        this.initToolbar(planet);
    }

    public setGazPlanet(planet: GasPlanet) {
        this.initGazCloudsSliders(planet);
        this.initAtmosphereSliders(planet);
    }

    public setStar(star: Star) {
        this.initStarSliders(star);
    }

    public initNavBar(body: AbstractBody): void {
        hide("generalLink");
        hidePanel("generalUI");

        hide("starPhysicLink");
        hidePanel("starPhysicUI");

        hide("starPhysicLink");
        hidePanel("starPhysicUI");

        hide("physicLink");
        hidePanel("physicUI");

        hide("oceanLink");
        hidePanel("oceanUI");

        hide("surfaceLink");
        hidePanel("surfaceUI");

        hide("gazCloudsLink");
        hidePanel("gazCloudsUI");

        hide("cloudsLink");
        hidePanel("cloudsUI");

        hide("atmosphereLink");
        hidePanel("atmosphereUI");

        switch (body.bodyType) {
            case BodyType.STAR:
                show("starPhysicLink");
                break;
            case BodyType.TELLURIC:
                show("physicLink");

                show("oceanLink", (body as TelluricPlanet).postProcesses.ocean != null);
                showPanel("oceanUI", this.currentPanel?.id == "oceanUI" && (body as TelluricPlanet).postProcesses.ocean != null);

                show("surfaceLink");

                show("cloudsLink", (body as TelluricPlanet).postProcesses.clouds != null);
                showPanel("cloudsUI", this.currentPanel?.id == "cloudsUI" && (body as TelluricPlanet).postProcesses.clouds != null);

                show("atmosphereLink", (body as TelluricPlanet).postProcesses.atmosphere != null);
                showPanel("atmosphereUI", this.currentPanel?.id == "atmosphereUI" && (body as TelluricPlanet).postProcesses.atmosphere != null);
                break;
            case BodyType.GAZ:
                show("atmosphereLink");
                showPanel("atmosphereUI", this.currentPanel?.id == "atmosphereUI");

                show("gazCloudsLink");
                showPanel("gazCloudsUI", this.currentPanel?.id == "gazCloudsUI");
                break;
        }
        if (this.currentPanel != null) {
            //TODO: this is messed up
            const currentNavBarButton = document.getElementById(this.currentPanel.id.substring(0, this.currentPanel.id.length - 2) + "Link");
            if (currentNavBarButton!.style.display == "none") this.setVisibility(EditorVisibility.NAVBAR);
            else showPanel(this.currentPanel.id);
        }
    }

    public initStarSliders(star: Star): void {
        for (const slider of this.starSliders) slider.remove();
        this.starSliders = [];

        this.starSliders.push(
            new Slider("temperature", document.getElementById("temperature") as HTMLElement, 3000, 15000, star.physicalProperties.temperature, (val: number) => {
                star.physicalProperties.temperature = val;
            })
        );

        this.starSliders.push(
            new Slider("starExposure", document.getElementById("starExposure") as HTMLElement, 0, 200, star.postProcesses.volumetricLight.exposure * 100, (val: number) => {
                star.postProcesses.volumetricLight.exposure = val / 100;
            })
        );

        this.starSliders.push(
            new Slider("decay", document.getElementById("decay") as HTMLElement, 0, 200, star.postProcesses.volumetricLight.decay * 100, (val: number) => {
                star.postProcesses.volumetricLight.decay = val / 100;
            })
        );
    }

    public initGeneralSliders(planet: AbstractBody, scene: UberScene) {
        show("generalLink");

        for (const slider of this.generalSliders) slider.remove();
        this.generalSliders = [];

        this.generalSliders.push(
            new Slider("zoom", document.getElementById("zoom") as HTMLElement, 0, 100, (100 * planet.radius) / planet.transform.position.z, (value: number) => {
                const playerDir = planet.getAbsolutePosition().normalizeToNew();
                planet.setAbsolutePosition(playerDir.scale((100 * planet.getRadius()) / value));
            })
        );

        let axialTiltX = stripAxisFromQuaternion(planet.getRotationQuaternion(), Axis.Y).toEulerAngles().x;
        this.generalSliders.push(
            new Slider("axialTiltX", document.getElementById("axialTiltX") as HTMLElement, -180, 180, Math.round((180 * axialTiltX) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                planet.rotate(Axis.X, newAxialTilt - axialTiltX);
                if (scene.getPlayer().isOrbiting()) scene.getPlayer().rotateAround(planet.getAbsolutePosition(), Axis.X, newAxialTilt - axialTiltX);
                axialTiltX = newAxialTilt;
            })
        );

        let axialTiltZ = stripAxisFromQuaternion(planet.getRotationQuaternion(), Axis.Y).toEulerAngles().z;
        this.generalSliders.push(
            new Slider("axialTiltZ", document.getElementById("axialTiltZ") as HTMLElement, -180, 180, Math.round((180 * axialTiltZ) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                planet.rotate(Axis.Z, newAxialTilt - axialTiltZ);
                if (scene.getPlayer().isOrbiting()) scene.getPlayer().rotateAround(planet.getAbsolutePosition(), Axis.Z, newAxialTilt - axialTiltZ);
                axialTiltZ = newAxialTilt;
            })
        );

        this.generalSliders.push(
            new Slider("cameraFOV", document.getElementById("cameraFOV") as HTMLElement, 0, 360, (scene.getPlayer().camera.fov * 360) / Math.PI, (val: number) => {
                scene.getPlayer().camera.fov = (val * Math.PI) / 360;
            })
        );
        //TODO: do not hardcode here
        const power = 1.4;
        this.generalSliders.push(
            new Slider("timeModifier", document.getElementById("timeModifier") as HTMLElement, -200, 400, Math.pow(Settings.TIME_MULTIPLIER, 1 / power), (val: number) => {
                Settings.TIME_MULTIPLIER = Math.sign(val) * Math.pow(Math.abs(val), power);
            })
        );

        this.generalSliders.push(
            new Slider("exposure", document.getElementById("exposure") as HTMLElement, 0, 200, scene.colorCorrection.settings.exposure * 100, (val: number) => {
                scene.colorCorrection.settings.exposure = val / 100;
            })
        );

        this.generalSliders.push(
            new Slider("contrast", document.getElementById("contrast") as HTMLElement, 0, 200, scene.colorCorrection.settings.contrast * 100, (val: number) => {
                scene.colorCorrection.settings.contrast = val / 100;
            })
        );

        this.generalSliders.push(
            new Slider("brightness", document.getElementById("brightness") as HTMLElement, -100, 100, scene.colorCorrection.settings.brightness * 100, (val: number) => {
                scene.colorCorrection.settings.brightness = val / 100;
            })
        );

        this.generalSliders.push(
            new Slider("saturation", document.getElementById("saturation") as HTMLElement, 0, 200, scene.colorCorrection.settings.saturation * 100, (val: number) => {
                scene.colorCorrection.settings.saturation = val / 100;
            })
        );

        this.generalSliders.push(
            new Slider("gamma", document.getElementById("gamma") as HTMLElement, 0, 200, scene.colorCorrection.settings.gamma * 100, (val: number) => {
                scene.colorCorrection.settings.gamma = val / 100;
            })
        );
    }

    public initPhysicSliders(planet: TelluricPlanet) {
        for (const slider of this.physicSliders) slider.remove();
        this.physicSliders = [];

        this.physicSliders.push(
            new Slider("minTemperature", document.getElementById("minTemperature") as HTMLElement, -273, 300, planet.physicalProperties.minTemperature, (val: number) => {
                planet.physicalProperties.minTemperature = val;
                planet.material.updateConstants();
            })
        );
        this.physicSliders.push(
            new Slider("maxTemperature", document.getElementById("maxTemperature") as HTMLElement, -273, 300, planet.physicalProperties.maxTemperature, (val: number) => {
                planet.physicalProperties.maxTemperature = val;
                planet.material.updateConstants();
            })
        );
    }

    public initSurfaceSliders(planet: TelluricPlanet) {
        for (const slider of this.surfaceSliders) slider.remove();
        this.surfaceSliders.length = 0;

        const material = planet.material;
        const colorSettings = material.colorSettings;

        const snowColorPicker = clearAllEventListenersById("snowColor") as HTMLInputElement;
        snowColorPicker.value = colorSettings.snowColor.toHexString();
        snowColorPicker.addEventListener("input", () => {
            colorSettings.snowColor.copyFrom(Color3.FromHexString(snowColorPicker.value));
        });

        const plainColorPicker = clearAllEventListenersById("plainColor") as HTMLInputElement;
        plainColorPicker.value = colorSettings.plainColor.toHexString();
        plainColorPicker.addEventListener("input", () => {
            colorSettings.plainColor.copyFrom(Color3.FromHexString(plainColorPicker.value));
        });

        const steepColorPicker = clearAllEventListenersById("steepColor") as HTMLInputElement;
        steepColorPicker.value = colorSettings.steepColor.toHexString();
        steepColorPicker.addEventListener("input", () => {
            colorSettings.steepColor.copyFrom(Color3.FromHexString(steepColorPicker.value));
        });

        const sandColorPicker = clearAllEventListenersById("sandColor") as HTMLInputElement;
        sandColorPicker.value = colorSettings.beachColor.toHexString();
        sandColorPicker.addEventListener("input", () => {
            colorSettings.beachColor.copyFrom(Color3.FromHexString(sandColorPicker.value));
        });

        const desertColorPicker = clearAllEventListenersById("desertColor") as HTMLInputElement;
        desertColorPicker.value = colorSettings.desertColor.toHexString();
        desertColorPicker.addEventListener("input", () => {
            colorSettings.desertColor.copyFrom(Color3.FromHexString(desertColorPicker.value));
        });

        const bottomColorPicker = clearAllEventListenersById("bottomColor") as HTMLInputElement;
        bottomColorPicker.value = colorSettings.bottomColor.toHexString();
        bottomColorPicker.addEventListener("input", () => {
            colorSettings.bottomColor.copyFrom(Color3.FromHexString(bottomColorPicker.value));
        });

        this.surfaceSliders.push(
            new Slider("sandSize", document.getElementById("sandSize") as HTMLElement, 0, 300, planet.material.colorSettings.beachSize / 10, (val: number) => {
                colorSettings.beachSize = val * 10;
                material.updateConstants();
            })
        );

        this.surfaceSliders.push(
            new Slider("steepSharpness", document.getElementById("steepSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.steepSharpness * 10, (val: number) => {
                colorSettings.steepSharpness = val / 10;
                material.updateConstants();
            })
        );

        this.surfaceSliders.push(
            new Slider("normalSharpness", document.getElementById("normalSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.normalSharpness * 100, (val: number) => {
                colorSettings.normalSharpness = val / 100;
                material.updateConstants();
            })
        );
    }

    public initGazCloudsSliders(planet: GasPlanet) {
        for (const slider of this.gazCloudsSliders) slider.remove();
        this.gazCloudsSliders.length = 0;

        const material = planet.material;
        const colorSettings = material.colorSettings;

        const gazColor1Picker = clearAllEventListenersById("gazColor1") as HTMLInputElement;
        gazColor1Picker.value = colorSettings.color1.toHexString();
        gazColor1Picker.addEventListener("input", () => {
            colorSettings.color1.copyFrom(Color3.FromHexString(gazColor1Picker.value));
        });

        const gazColor2Picker = clearAllEventListenersById("gazColor2") as HTMLInputElement;
        gazColor2Picker.value = colorSettings.color2.toHexString();
        gazColor2Picker.addEventListener("input", () => {
            colorSettings.color2.copyFrom(Color3.FromHexString(gazColor2Picker.value));
        });

        const gazColor3Picker = clearAllEventListenersById("gazColor3") as HTMLInputElement;
        gazColor3Picker.value = colorSettings.color3.toHexString();
        gazColor3Picker.addEventListener("input", () => {
            colorSettings.color3.copyFrom(Color3.FromHexString(gazColor3Picker.value));
        });

        const gazColor4Picker = clearAllEventListenersById("gazColor4") as HTMLInputElement;
        gazColor4Picker.value = colorSettings.color4.toHexString();
        gazColor4Picker.addEventListener("input", () => {
            colorSettings.color4.copyFrom(Color3.FromHexString(gazColor4Picker.value));
        });

        this.gazCloudsSliders.push(
            new Slider("colorSharpness", document.getElementById("colorSharpness") as HTMLElement, 0, 100, planet.material.colorSettings.colorSharpness * 10, (val: number) => {
                colorSettings.colorSharpness = val / 10;
                material.updateManual();
            })
        );
    }

    public initAtmosphereSliders(planet: Planet) {
        for (const slider of this.atmosphereSliders) slider.remove();
        this.atmosphereSliders = [];

        if (planet.postProcesses.atmosphere == null) return;

        const atmosphere = planet.postProcesses.atmosphere;
        const atmosphereToggler = clearAllEventListenersById("atmosphereToggler");
        atmosphereToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            atmosphere.settings.atmosphereRadius = checkbox.checked ? Settings.EARTH_RADIUS + Settings.ATMOSPHERE_HEIGHT : 0;
        });
        this.atmosphereSliders.push(
            new Slider("intensity", document.getElementById("intensity") as HTMLElement, 0, 40, atmosphere.settings.intensity, (val: number) => {
                atmosphere.settings.intensity = val;
            })
        );
        this.atmosphereSliders.push(
            new Slider("density", document.getElementById("density") as HTMLElement, 0, 40, atmosphere.settings.densityModifier * 10, (val: number) => {
                atmosphere.settings.densityModifier = val / 10;
            })
        );
        this.atmosphereSliders.push(
            new Slider(
                "atmosphereRadius",
                document.getElementById("atmosphereRadius")!,
                0,
                100,
                (atmosphere.settings.atmosphereRadius - planet.getRadius()) / 10000,
                (val: number) => {
                    atmosphere.settings.atmosphereRadius = planet.getRadius() + val * 10000;
                }
            )
        );
        this.atmosphereSliders.push(
            new Slider("rayleighStrength", document.getElementById("rayleighStrength") as HTMLElement, 0, 40, atmosphere.settings.rayleighStrength * 10, (val: number) => {
                atmosphere.settings.rayleighStrength = val / 10;
            })
        );
        this.atmosphereSliders.push(
            new Slider("mieStrength", document.getElementById("mieStrength") as HTMLElement, 0, 40, atmosphere.settings.mieStrength * 10, (val: number) => {
                atmosphere.settings.mieStrength = val / 10;
            })
        );
        this.atmosphereSliders.push(
            new Slider("falloff", document.getElementById("falloff") as HTMLElement, -10, 200, atmosphere.settings.falloffFactor, (val: number) => {
                atmosphere.settings.falloffFactor = val;
            })
        );
        this.atmosphereSliders.push(
            new Slider("redWaveLength", document.getElementById("redWaveLength") as HTMLElement, 0, 1000, atmosphere.settings.redWaveLength, (val: number) => {
                atmosphere.settings.redWaveLength = val;
            })
        );
        this.atmosphereSliders.push(
            new Slider("greenWaveLength", document.getElementById("greenWaveLength") as HTMLElement, 0, 1000, atmosphere.settings.greenWaveLength, (val: number) => {
                atmosphere.settings.greenWaveLength = val;
            })
        );
        this.atmosphereSliders.push(
            new Slider("blueWaveLength", document.getElementById("blueWaveLength") as HTMLElement, 0, 1000, atmosphere.settings.blueWaveLength, (val: number) => {
                atmosphere.settings.blueWaveLength = val;
            })
        );
        this.atmosphereSliders.push(
            new Slider("mieHaloRadius", document.getElementById("mieHaloRadius") as HTMLElement, 0, 200, atmosphere.settings.mieHaloRadius * 100, (val: number) => {
                atmosphere.settings.mieHaloRadius = val / 100;
            })
        );
    }

    public initCloudsSliders(planet: TelluricPlanet) {
        for (const slider of this.cloudsSliders) slider.remove();
        this.cloudsSliders = [];

        if (planet.postProcesses.clouds == null) return;

        const flatClouds = planet.postProcesses.clouds!;
        const cloudsToggler = clearAllEventListenersById("cloudsToggler");
        cloudsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[1] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            flatClouds.settings.cloudLayerRadius = checkbox.checked ? Settings.EARTH_RADIUS + Settings.CLOUD_LAYER_HEIGHT : 0;
        });
        const cloudColorPicker = clearAllEventListenersById("cloudColor") as HTMLInputElement;
        cloudColorPicker.value = flatClouds.settings.cloudColor.toHexString();
        cloudColorPicker.addEventListener("input", () => {
            flatClouds.settings.cloudColor = Color3.FromHexString(cloudColorPicker.value);
        });
        this.cloudsSliders.push(
            new Slider("cloudFrequency", document.getElementById("cloudFrequency") as HTMLElement, 0, 20, flatClouds.settings.cloudFrequency, (val: number) => {
                flatClouds.settings.cloudFrequency = val;
            })
        );
        this.cloudsSliders.push(
            new Slider("cloudDetailFrequency", document.getElementById("cloudDetailFrequency") as HTMLElement, 0, 50, flatClouds.settings.cloudDetailFrequency, (val: number) => {
                flatClouds.settings.cloudDetailFrequency = val;
            })
        );
        this.cloudsSliders.push(
            new Slider("cloudCoverage", document.getElementById("cloudCoverage") as HTMLElement, 0, 200, 100 + flatClouds.settings.cloudCoverage * 100, (val: number) => {
                flatClouds.settings.cloudCoverage = (val - 100) / 100;
            })
        );
        this.cloudsSliders.push(
            new Slider("cloudSharpness", document.getElementById("cloudSharpness") as HTMLElement, 1, 100, flatClouds.settings.cloudSharpness * 10, (val: number) => {
                flatClouds.settings.cloudSharpness = val / 10;
            })
        );
        this.cloudsSliders.push(
            new Slider("worleySpeed", document.getElementById("worleySpeed") as HTMLElement, 0.0, 200.0, flatClouds.settings.worleySpeed * 10000, (val: number) => {
                flatClouds.settings.worleySpeed = val / 10000;
            })
        );
        this.cloudsSliders.push(
            new Slider("detailSpeed", document.getElementById("detailSpeed") as HTMLElement, 0, 200, flatClouds.settings.detailSpeed * 10000, (val: number) => {
                flatClouds.settings.detailSpeed = val / 10000;
            })
        );
    }

    public initRingsSliders(planet: AbstractBody) {
        for (const slider of this.ringsSliders) slider.remove();
        this.ringsSliders = [];

        if (planet.postProcesses.rings == null) return;

        showPanel("ringsLink");
        showPanel("ringsUI", this.currentPanel?.id == "ringsUI");

        const rings = planet.postProcesses.rings;
        const ringsToggler = clearAllEventListenersById("ringsToggler");
        ringsToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[3] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            rings.settings.ringFrequency = checkbox.checked ? 30 : 0;
        });
        this.ringsSliders.push(
            new Slider("ringsMinRadius", document.getElementById("ringsMinRadius") as HTMLElement, 100, 200, rings.settings.ringStart * 100, (val: number) => {
                rings.settings.ringStart = val / 100;
            })
        );
        this.ringsSliders.push(
            new Slider("ringsMaxRadius", document.getElementById("ringsMaxRadius") as HTMLElement, 150, 400, rings.settings.ringEnd * 100, (val: number) => {
                rings.settings.ringEnd = val / 100;
            })
        );
        this.ringsSliders.push(
            new Slider("ringsFrequency", document.getElementById("ringsFrequency") as HTMLElement, 10, 100, rings.settings.ringFrequency, (val: number) => {
                rings.settings.ringFrequency = val;
            })
        );
        this.ringsSliders.push(
            new Slider("ringsOpacity", document.getElementById("ringsOpacity") as HTMLElement, 0, 100, rings.settings.ringOpacity * 100, (val: number) => {
                rings.settings.ringOpacity = val / 100;
            })
        );
    }

    public initOceanSliders(planet: TelluricPlanet) {
        for (const slider of this.oceanSliders) slider.remove();
        this.oceanSliders.length = 0;

        if (planet.postProcesses.ocean == null) return;

        const ocean = planet.postProcesses.ocean;
        const oceanToggler = clearAllEventListenersById("oceanToggler");
        oceanToggler.addEventListener("click", () => {
            const checkbox = document.querySelectorAll("input[type='checkbox']")[0] as HTMLInputElement;
            checkbox.checked = !checkbox.checked;
            ocean.settings.oceanRadius = checkbox.checked ? planet.getApparentRadius() : 0;
        });
        this.oceanSliders.push(
            new Slider("alphaModifier", document.getElementById("alphaModifier") as HTMLElement, 0, 200, ocean.settings.alphaModifier * 10000, (val: number) => {
                ocean.settings.alphaModifier = val / 10000;
            })
        );
        this.oceanSliders.push(
            new Slider("depthModifier", document.getElementById("depthModifier") as HTMLElement, 0, 70, ocean.settings.depthModifier * 10000, (val: number) => {
                ocean.settings.depthModifier = val / 10000;
            })
        );
        this.oceanSliders.push(
            new Slider("specularPower", document.getElementById("specularPower") as HTMLElement, 0, 100, ocean.settings.specularPower * 10, (val: number) => {
                ocean.settings.specularPower = val / 10;
            })
        );
        this.oceanSliders.push(
            new Slider("smoothness", document.getElementById("smoothness") as HTMLElement, 0, 100, ocean.settings.smoothness * 100, (val: number) => {
                ocean.settings.smoothness = val / 100;
            })
        );
        this.oceanSliders.push(
            new Slider(
                "waveBlendingSharpness",
                document.getElementById("waveBlendingSharpness") as HTMLElement,
                0,
                100,
                ocean.settings.waveBlendingSharpness * 100,
                (val: number) => {
                    ocean.settings.waveBlendingSharpness = val / 100;
                }
            )
        );
    }

    public initToolbar(planet: TelluricPlanet) {
        const material = planet.material;
        const colorSettings = material.colorSettings;
        document.getElementById("defaultMapButton")!.addEventListener("click", () => {
            colorSettings.mode = ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("moistureMapButton")!.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode != ColorMode.MOISTURE ? ColorMode.MOISTURE : ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("temperatureMapButton")!.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode != ColorMode.TEMPERATURE ? ColorMode.TEMPERATURE : ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("normalMapButton")!.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode != ColorMode.NORMAL ? ColorMode.NORMAL : ColorMode.DEFAULT;
            material.updateConstants();
        });
        document.getElementById("heightMapButton")!.addEventListener("click", () => {
            colorSettings.mode = colorSettings.mode != ColorMode.HEIGHT ? ColorMode.HEIGHT : ColorMode.DEFAULT;
            material.updateConstants();
        });
    }

    public updateAllSliders() {
        for (const sliderGroup of this.sliders) {
            for (const slider of sliderGroup) slider.update(false);
        }
    }

    public update(player: PlayerController) {
        if (player.nearestBody == null) return;
        if (player.nearestBody.name != this.currentBodyId) this.setBody(player.nearestBody);
    }
}
