import { Color3, Quaternion, Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";

import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";

import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystem } from "./bodies/starSystem";

import "../styles/index.scss";

import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { HelmetOverlay } from "./ui/helmetOverlay";
import { PlayerController } from "./controllers/playerController";
import { OverlayPostProcess } from "./postProcesses/overlayPostProcess";
import { positionNearBody } from "./utils/positionNearBody";
import { nearestBody } from "./utils/nearestBody";
import { isOrbiting } from "./bodies/abstractBody";

const helmetOverlay = new HelmetOverlay();
const bodyEditor = new BodyEditor();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

bodyEditor.setCanvas(canvas);

const [engine, scene] = await initEngineScene(canvas);

Assets.Init(scene).then(() => {
    const mouse = new Mouse(canvas, 1e5);

    const player = new PlayerController();
    player.speed = 0.2 * Settings.EARTH_RADIUS;
    player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
    player.inputs.push(new Keyboard(), mouse, new Gamepad());

    scene.setActiveController(player);

    console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

    const starSystemSeed = 0;
    const starSystem = new StarSystem(starSystemSeed, scene);

    const sun = starSystem.makeStar(0.51);
    sun.orbitalProperties.period = 60 * 60 * 24;

    const planet = starSystem.makeTelluricPlanet(0.4233609183800225);

    planet.physicalProperties.minTemperature = -37;
    planet.physicalProperties.maxTemperature = 40;
    planet.material.updateConstants();

    planet.orbitalProperties = {
        period: 60 * 60 * 24 * 365.25,
        apoapsis: 4000 * planet.getRadius(),
        periapsis: 4000 * planet.getRadius(),
        orientationQuaternion: Quaternion.Identity()
    };

    const moon = starSystem.makeSatellite(planet, 0.4);

    moon.physicalProperties.mass = 2;
    moon.physicalProperties.rotationPeriod = 7 * 60 * 60;
    moon.physicalProperties.minTemperature = -180;
    moon.physicalProperties.maxTemperature = 200;
    moon.physicalProperties.waterAmount = 0.9;

    moon.orbitalProperties = {
        period: moon.physicalProperties.rotationPeriod,
        apoapsis: 8 * planet.getRadius(),
        periapsis: 8 * planet.getRadius(),
        orientationQuaternion: Quaternion.Identity()
    };

    moon.terrainSettings.continentsFragmentation = 0.0;
    moon.terrainSettings.maxMountainHeight = 5e3;
    moon.material.colorSettings.plainColor.copyFromFloats(0.67, 0.67, 0.67);
    moon.material.colorSettings.desertColor.copyFrom(new Color3(116, 134, 121).scale(1 / 255));
    moon.material.colorSettings.steepColor.copyFrom(new Color3(92, 92, 92).scale(1 / 255));

    moon.material.setTexture("plainNormalMap", Assets.DirtNormalMap);
    moon.material.setTexture("bottomNormalMap", Assets.DirtNormalMap);
    moon.material.updateConstants();

    const ares = starSystem.makeTelluricPlanet(0.3725);
    ares.postProcesses.ocean = false;
    ares.postProcesses.clouds = false;

    ares.physicalProperties.mass = 7;
    ares.physicalProperties.rotationPeriod = (24 * 60 * 60) / 30;
    ares.physicalProperties.minTemperature = -48;
    ares.physicalProperties.maxTemperature = 20;
    ares.physicalProperties.pressure = 0.5;
    ares.physicalProperties.waterAmount = 0.2;

    ares.orbitalProperties = {
        period: 60 * 60 * 24 * 365.24,
        periapsis: 4020 * planet.getRadius(),
        apoapsis: 4020 * planet.getRadius(),
        orientationQuaternion: Quaternion.Identity()
    };

    ares.terrainSettings.continentsFragmentation = 0.35;
    ares.terrainSettings.continentBaseHeight = 2e3;
    ares.terrainSettings.maxMountainHeight = 12e3;

    ares.material.colorSettings.plainColor.copyFromFloats(0.4, 0.3, 0.3);
    ares.material.colorSettings.desertColor.copyFromFloats(178 / 255, 107 / 255, 42 / 255);
    ares.material.colorSettings.steepColor.copyFrom(ares.material.colorSettings.desertColor.scale(0.9));
    ares.material.colorSettings.beachColor.copyFromFloats(0.3, 0.15, 0.1);
    ares.material.colorSettings.bottomColor.copyFromFloats(0.05, 0.1, 0.15);

    ares.physicalProperties.oceanLevel = Settings.OCEAN_DEPTH * ares.physicalProperties.waterAmount * ares.physicalProperties.pressure;

    ares.material.updateConstants();

    const andromaque = starSystem.makeGasPlanet(0.28711440474126226);
    andromaque.orbitalProperties = {
        period: 60 * 60 * 24 * 365.29,
        periapsis: 4300 * ares.getRadius(),
        apoapsis: 4300 * ares.getRadius(),
        orientationQuaternion: Quaternion.Identity()
    };

    const collisionWorker = new CollisionWorker(player, starSystem);

    starSystem.init();

    const aresAtmosphere = starSystem.postProcessManager.getAtmosphere(ares);
    aresAtmosphere.settings.redWaveLength = 500;
    aresAtmosphere.settings.greenWaveLength = 680;
    aresAtmosphere.settings.blueWaveLength = 670;

    positionNearBody(player, planet, starSystem);

    function updateScene() {
        const deltaTime = engine.getDeltaTime() / 1000;

        const nearest = nearestBody(scene.getActiveController().transform, starSystem.getBodies())


        bodyEditor.update(scene.getActiveController());
        helmetOverlay.update(nearest);
        helmetOverlay.setVisibility(bodyEditor.getVisibility() != EditorVisibility.FULL);

        starSystem.translateAllBodies(player.update(deltaTime));

        if (!collisionWorker.isBusy() && isOrbiting(player, nearest)) {
            if (nearest.bodyType == BodyType.TELLURIC) {
                collisionWorker.checkCollision(nearest as TelluricPlanet);
            }
        }

        //FIXME: should address stars orbits
        for (const star of starSystem.stars) star.orbitalProperties.period = 0;

        scene.update();
        starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
    }

    document.addEventListener("keydown", (e) => {
        if (e.key == "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, scene.getActiveController().getActiveCamera(), { precision: 4 });
        if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
        if (e.key == "w" && isOrbiting(player, starSystem.getNearestBody()))
            (starSystem.getNearestBody() as TelluricPlanet).material.wireframe = !(starSystem.getNearestBody() as TelluricPlanet).material.wireframe;
    });

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();
        scene.registerBeforeRender(() => updateScene());
        engine.runRenderLoop(() => scene.render());
    });
});

window.addEventListener("resize", () => {
    bodyEditor.resize();
    engine.resize();
});

bodyEditor.resize();
