import editorHTML from "../../html/bodyEditor.html";
import {ColorMode, SolidPlanet} from "../celestialBodies/planets/solidPlanet";
import {Star} from "../celestialBodies/stars/star";
import {Slider} from "handle-sliderjs";
import {CelestialBodyType} from "../celestialBodies/interfaces";
import {Settings} from "../settings";
import {Axis, Color3, Vector3} from "@babylonjs/core";
import {PlayerController} from "../player/playerController";
import {CelestialBody} from "../celestialBodies/celestialBody";

export enum EditorVisibility {
    HIDDEN,
    NAVBAR,
    FULL
}

export class BodyEditor {
    visibility: EditorVisibility = EditorVisibility.HIDDEN

    navBar: HTMLElement;
    currentPanel: HTMLElement | null;

    currentBodyId: string | null = null;

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
        this.navBar = document.getElementById("navBar")!;

        this.setVisibility(visibility);

        this.currentPanel = document.getElementById("generalUI");
        for (const link of this.navBar.children) {
            link.addEventListener("click", () => {
                let id = link.id.substring(0, link.id.length - 4) + "UI";
                this.switchPanel(id);
            });
        }
    }

    public switchPanel(panelId: string): void {
        let newPanel = document.getElementById(panelId);
        if(newPanel == null) throw new Error(`The panel you requested does not exist : ${panelId}`);

        if(this.currentPanel == null) this.setVisibility(EditorVisibility.FULL);
        else {
            this.currentPanel.hidden = true;
            if (this.currentPanel.id == panelId) {
                this.currentPanel = null;
                this.setVisibility(EditorVisibility.NAVBAR);
                return;
            }
        }
        this.currentPanel = newPanel;
        this.currentPanel.hidden = false;
        this.updateAllSliders();
    }

    public setVisibility(visibility: EditorVisibility): void {
        this.visibility = visibility;
        switch (this.visibility) {
            case EditorVisibility.HIDDEN:
                document.getElementById("navBar")!.style.visibility = "hidden";
                document.getElementById("editorPanelContainer")!.style.visibility = "hidden";
                document.getElementById("toolbar")!.style.visibility = "hidden";
                break;
            case EditorVisibility.NAVBAR:
                document.getElementById("navBar")!.style.visibility = "visible";
                document.getElementById("editorPanelContainer")!.style.visibility = "hidden";
                document.getElementById("toolbar")!.style.visibility = "hidden";
                break;
            case EditorVisibility.FULL:
                document.getElementById("navBar")!.style.visibility = "visible";
                document.getElementById("editorPanelContainer")!.style.visibility = "visible";
                document.getElementById("toolbar")!.style.visibility = "visible";
                break;
            default:
                throw new Error("BodyEditor received an unusual visibility state");
        }
        window.dispatchEvent(new Event("resize"));
    }

    public getVisibility(): EditorVisibility {
        return this.visibility;
    }

    public setBody(body: CelestialBody, star: Star, player: PlayerController) {
        this.currentBodyId = body.getName();
        this.initNavBar(body);
        switch (body.getBodyType()) {
            case CelestialBodyType.SOLID:
                this.setPlanet(body as SolidPlanet, star, player);
                break;
            case CelestialBodyType.STAR:
                this.setStar(body as Star);
                break;
            case CelestialBodyType.GAZ:
                break;
            default:
        }
    }

    public setPlanet(planet: SolidPlanet, star: Star, player: PlayerController) {
        this.initGeneralSliders(planet, star, player);
        this.initPhysicSliders(planet);
        this.initSurfaceSliders(planet);
        this.initAtmosphereSliders(planet);
        this.initCloudsSliders(planet);
        this.initRingsSliders(planet);
        this.initOceanSliders(planet);

        this.initToolbar(planet);
    }

    public setStar(star: Star) {
        this.initStarSliders(star);
    }

    //TODO: make it maintainable
    public initNavBar(body: CelestialBody): void {
        switch (body.getBodyType()) {
            case CelestialBodyType.STAR:
                document.getElementById("generalLink")!.hidden = false;
                document.getElementById("starPhysicLink")!.hidden = false;
                document.getElementById("physicLink")!.hidden = true;
                document.getElementById("oceanLink")!.hidden = true;
                document.getElementById("surfaceLink")!.hidden = true;
                document.getElementById("cloudsLink")!.hidden = true;
                document.getElementById("atmosphereLink")!.hidden = true;
                document.getElementById("ringsLink")!.hidden = true;
                break;
            case CelestialBodyType.SOLID:
                document.getElementById("generalLink")!.hidden = false;
                document.getElementById("starPhysicLink")!.hidden = true;
                document.getElementById("physicLink")!.hidden = false;
                document.getElementById("oceanLink")!.hidden = (body as SolidPlanet).postProcesses.ocean == null;
                document.getElementById("surfaceLink")!.hidden = false;
                document.getElementById("cloudsLink")!.hidden = (body as SolidPlanet).postProcesses.clouds == null;
                document.getElementById("atmosphereLink")!.hidden = (body as SolidPlanet).postProcesses.atmosphere == null;
                document.getElementById("ringsLink")!.hidden = (body as SolidPlanet).postProcesses.rings == null;
                break;
            default:
                document.getElementById("generalLink")!.hidden = false;
                document.getElementById("starPhysicLink")!.hidden = true;
                document.getElementById("physicLink")!.hidden = true;
                document.getElementById("oceanLink")!.hidden = true;
                document.getElementById("surfaceLink")!.hidden = true;
                document.getElementById("cloudsLink")!.hidden = true;
                document.getElementById("atmosphereLink")!.hidden = true;
                document.getElementById("ringsLink")!.hidden = true;
        }
        if(this.currentPanel != null) {
            //TODO: this is messed up
            let currentNavBarButton = document.getElementById(this.currentPanel.id.substring(0, this.currentPanel.id.length - 2) + "Link")
            if (currentNavBarButton!.hidden) this.setVisibility(EditorVisibility.NAVBAR);
        }
    }

    public initStarSliders(star: Star): void {
        for (const slider of this.starSliders) slider.remove();
        this.starSliders.length = 0;

        this.starSliders.push(new Slider("temperature", document.getElementById("temperature")!, 3000, 15000, star.physicalProperties.temperature, (val: number) => {
            star.physicalProperties.temperature = val;
        }));

        this.starSliders.push(new Slider("exposure", document.getElementById("exposure")!, 0, 200, star.postProcesses.volumetricLight!.exposure * 100, (val: number) => {
            star.postProcesses.volumetricLight!.exposure = val / 100;
        }));

        this.starSliders.push(new Slider("decay", document.getElementById("decay")!, 0, 200, star.postProcesses.volumetricLight!.decay * 100, (val: number) => {
            star.postProcesses.volumetricLight!.decay = val / 100;
        }));
    }

    public initGeneralSliders(planet: SolidPlanet, star: Star, player: PlayerController) {
        for (const slider of this.generalSliders) slider.remove();
        this.generalSliders.length = 0;

        this.generalSliders.push(new Slider("zoom", document.getElementById("zoom")!, 0, 100, 100 * planet._radius / planet.attachNode.position.z, (value: number) => {
            let playerDir = planet.getAbsolutePosition().normalizeToNew();
            planet.setAbsolutePosition(playerDir.scale(100 * planet.getRadius() / value));
        }));

        let sunOrientation = 220;
        this.generalSliders.push(new Slider("sunOrientation", document.getElementById("sunOrientation")!, 1, 360, sunOrientation, (val: number) => {
            star.mesh.rotateAround(planet.getAbsolutePosition(), new Vector3(0, 1, 0), -2 * Math.PI * (val - sunOrientation) / 360);
            sunOrientation = val;
        }));

        let axialTilt = 0.2;
        this.generalSliders.push(new Slider("axialTilt", document.getElementById("axialTilt")!, -180, 180, Math.round(180 * axialTilt / Math.PI), (val: number) => {
            let newAxialTilt = val * Math.PI / 180;
            planet.rotate(Axis.X, newAxialTilt - axialTilt);
            if (player.isOrbiting()) player.rotateAround(planet.getAbsolutePosition(), Axis.X, newAxialTilt - axialTilt);
            axialTilt = newAxialTilt;
        }));

        this.generalSliders.push(new Slider("cameraFOV", document.getElementById("cameraFOV")!, 0, 360, player.camera.fov * 360 / Math.PI, (val: number) => {
            player.camera.fov = val * Math.PI / 360;
        }));
        this.generalSliders.push(new Slider("timeModifier", document.getElementById("timeModifier")!, 0, 200, Settings.TIME_MULTIPLIER, (val: number) => {
            Settings.TIME_MULTIPLIER = val;
        }));
    }

    public initPhysicSliders(planet: SolidPlanet) {
        for (const slider of this.physicSliders) slider.remove();
        this.physicSliders.length = 0;

        this.physicSliders.push(new Slider("minTemperature", document.getElementById("minTemperature")!, -273, 300, planet.physicalProperties.minTemperature, (val: number) => {
            planet.physicalProperties.minTemperature = val;
            planet.updateMaterial();
        }));
        this.physicSliders.push(new Slider("maxTemperature", document.getElementById("maxTemperature")!, -273, 300, planet.physicalProperties.maxTemperature, (val: number) => {
            planet.physicalProperties.maxTemperature = val;
            planet.updateMaterial();
        }));
    }

    public initSurfaceSliders(planet: SolidPlanet) {
        for (const slider of this.surfaceSliders) slider.remove();
        this.surfaceSliders.length = 0;

        let snowColorPicker = document.getElementById("snowColor") as HTMLInputElement;
        snowColorPicker.value = planet.colorSettings.snowColor.toHexString();
        snowColorPicker.addEventListener("input", () => {
            planet.colorSettings.snowColor = Color3.FromHexString(snowColorPicker.value);
            planet.updateMaterial();
        });

        let plainColorPicker = document.getElementById("plainColor") as HTMLInputElement;
        plainColorPicker.value = planet.colorSettings.plainColor.toHexString();
        plainColorPicker.addEventListener("input", () => {
            planet.colorSettings.plainColor = Color3.FromHexString(plainColorPicker.value);
            planet.updateMaterial();
        });

        let steepColorPicker = document.getElementById("steepColor") as HTMLInputElement;
        steepColorPicker.value = planet.colorSettings.steepColor.toHexString();
        steepColorPicker.addEventListener("input", () => {
            planet.colorSettings.steepColor = Color3.FromHexString(steepColorPicker.value);
            planet.updateMaterial();
        });

        let sandColorPicker = document.getElementById("sandColor") as HTMLInputElement;
        sandColorPicker.value = planet.colorSettings.beachColor.toHexString();
        sandColorPicker.addEventListener("input", () => {
            planet.colorSettings.beachColor = Color3.FromHexString(sandColorPicker.value);
            planet.updateMaterial();
        });

        let desertColorPicker = document.getElementById("desertColor") as HTMLInputElement;
        desertColorPicker.value = planet.colorSettings.desertColor.toHexString();
        desertColorPicker.addEventListener("input", () => {
            planet.colorSettings.desertColor = Color3.FromHexString(desertColorPicker.value);
            planet.updateMaterial();
        });

        this.surfaceSliders.push(new Slider("sandSize", document.getElementById("sandSize")!, 0, 300, planet.colorSettings.beachSize / 10, (val: number) => {
            planet.colorSettings.beachSize = val * 10;
            planet.updateMaterial();
        }));

        this.surfaceSliders.push(new Slider("steepSharpness", document.getElementById("steepSharpness")!, 0, 100, planet.colorSettings.steepSharpness * 10, (val: number) => {
            planet.colorSettings.steepSharpness = val / 10;
            planet.updateMaterial();
        }));

        this.surfaceSliders.push(new Slider("normalSharpness", document.getElementById("normalSharpness")!, 0, 100, planet.colorSettings.normalSharpness * 100, (val: number) => {
            planet.colorSettings.normalSharpness = val / 100;
            planet.updateMaterial();
        }));
    }

    public initAtmosphereSliders(planet: SolidPlanet) {
        for (const slider of this.atmosphereSliders) slider.remove();
        this.atmosphereSliders.length = 0;

        if (planet.postProcesses.atmosphere != null) {
            let atmosphere = planet.postProcesses.atmosphere;

            document.getElementById("atmosphereToggler")?.addEventListener("click", () => {
                let checkbox = document.querySelectorAll("input[type='checkbox']")[2] as HTMLInputElement;
                checkbox.checked = !checkbox.checked;
                atmosphere.settings.atmosphereRadius = checkbox.checked ? Settings.PLANET_RADIUS + Settings.ATMOSPHERE_HEIGHT : 0;
            });

            this.atmosphereSliders.push(new Slider("intensity", document.getElementById("intensity")!, 0, 40, atmosphere.settings.intensity, (val: number) => {
                atmosphere.settings.intensity = val;
            }));

            this.atmosphereSliders.push(new Slider("density", document.getElementById("density")!, 0, 40, atmosphere.settings.densityModifier * 10, (val: number) => {
                atmosphere.settings.densityModifier = val / 10;
            }));

            this.atmosphereSliders.push(new Slider("atmosphereRadius", document.getElementById("atmosphereRadius")!, 0, 100, (atmosphere.settings.atmosphereRadius - planet.getRadius()) / 10000, (val: number) => {
                atmosphere.settings.atmosphereRadius = planet.getRadius() + val * 10000;
            }));

            this.atmosphereSliders.push(new Slider("rayleighStrength", document.getElementById("rayleighStrength")!, 0, 40, atmosphere.settings.rayleighStrength * 10, (val: number) => {
                atmosphere.settings.rayleighStrength = val / 10;
            }));

            this.atmosphereSliders.push(new Slider("mieStrength", document.getElementById("mieStrength")!, 0, 40, atmosphere.settings.mieStrength * 10, (val: number) => {
                atmosphere.settings.mieStrength = val / 10;
            }));

            this.atmosphereSliders.push(new Slider("falloff", document.getElementById("falloff")!, -10, 200, atmosphere.settings.falloffFactor, (val: number) => {
                atmosphere.settings.falloffFactor = val;
            }));

            this.atmosphereSliders.push(new Slider("redWaveLength", document.getElementById("redWaveLength")!, 0, 1000, atmosphere.settings.redWaveLength, (val: number) => {
                atmosphere.settings.redWaveLength = val;
            }));

            this.atmosphereSliders.push(new Slider("greenWaveLength", document.getElementById("greenWaveLength")!, 0, 1000, atmosphere.settings.greenWaveLength, (val: number) => {
                atmosphere.settings.greenWaveLength = val;
            }));

            this.atmosphereSliders.push(new Slider("blueWaveLength", document.getElementById("blueWaveLength")!, 0, 1000, atmosphere.settings.blueWaveLength, (val: number) => {
                atmosphere.settings.blueWaveLength = val;
            }));

            this.atmosphereSliders.push(new Slider("mieHaloRadius", document.getElementById("mieHaloRadius")!, 0, 200, atmosphere.settings.mieHaloRadius * 100, (val: number) => {
                atmosphere.settings.mieHaloRadius = val / 100;
            }));
        }
    }

    public initCloudsSliders(planet: SolidPlanet) {
        for (const slider of this.cloudsSliders) slider.remove();
        this.cloudsSliders.length = 0;

        if (planet.postProcesses.clouds != null) {
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

        if (planet.postProcesses.ocean != null) {
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

    public initToolbar(planet: SolidPlanet) {
        document.getElementById("defaultMapButton")!.addEventListener("click", () => {
            planet.colorSettings.mode = ColorMode.DEFAULT;
            planet.updateMaterial();
        });
        document.getElementById("moistureMapButton")!.addEventListener("click", () => {
            planet.colorSettings.mode = (planet.colorSettings.mode != ColorMode.MOISTURE) ? ColorMode.MOISTURE : ColorMode.DEFAULT;
            planet.updateMaterial();
        });
        document.getElementById("temperatureMapButton")!.addEventListener("click", () => {
            planet.colorSettings.mode = (planet.colorSettings.mode != ColorMode.TEMPERATURE) ? ColorMode.TEMPERATURE : ColorMode.DEFAULT;
            planet.updateMaterial();
        });
        document.getElementById("normalMapButton")!.addEventListener("click", () => {
            planet.colorSettings.mode = (planet.colorSettings.mode != ColorMode.NORMAL) ? ColorMode.NORMAL : ColorMode.DEFAULT;
            planet.updateMaterial();
        });
        document.getElementById("heightMapButton")!.addEventListener("click", () => {
            planet.colorSettings.mode = (planet.colorSettings.mode != ColorMode.HEIGHT) ? ColorMode.HEIGHT : ColorMode.DEFAULT;
            planet.colorSettings.mode = (planet.colorSettings.mode != ColorMode.HEIGHT) ? ColorMode.HEIGHT : ColorMode.DEFAULT;
            planet.updateMaterial();
        });
    }

    public updateAllSliders() {
        for (const sliderGroup of this.sliders) {
            for (const slider of sliderGroup) slider.update(false);
        }
    }
}