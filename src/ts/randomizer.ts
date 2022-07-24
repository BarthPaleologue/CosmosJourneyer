import { Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";

import "../styles/index.scss";
import { PlayerController } from "./player/playerController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./bodies/starSystemManager";

import { centeredRand, normalRandom, randRange, randRangeInt, uniformRandBool } from "extended-random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Star } from "./bodies/stars/star";
import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { clamp } from "./utils/math";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";

import { alea } from "seedrandom";
import { getOrbitalPeriod } from "./orbits/kepler";
import { AbstractBody } from "./bodies/abstractBody";
import { GasPlanet } from "./bodies/planets/gasPlanet";
import { computeMeanTemperature } from "./utils/temperatureComputation";

const bodyEditor = new BodyEditor();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

bodyEditor.setCanvas(canvas);

const [engine, scene] = initEngineScene(canvas);

Assets.Init(scene);
Assets.onFinish = () => {
    const mouse = new Mouse(canvas, 1e5);

    const player = new PlayerController(scene);
    player.speed = 0.2 * Settings.EARTH_RADIUS;
    player.camera.maxZ = Settings.EARTH_RADIUS * 100000;
    player.inputs.push(new Keyboard(), mouse, new Gamepad());

    const starSystemManager = new StarSystemManager(scene, Settings.VERTEX_RESOLUTION);

    const starfield = new StarfieldPostProcess("starfield", player, starSystemManager);

    const starSystemSeed = randRangeInt(0, Number.MAX_SAFE_INTEGER);
    const starSystemRand = alea(starSystemSeed.toString());

    const starSeed = randRange(-10, 10, starSystemRand);
    console.log("Star seed : ", starSeed);

    const star1 = new Star("Weierstrass", starSystemManager, starSeed, []);
    //star1.orbitalProperties.periapsis = star1.getRadius();
    //star1.orbitalProperties.apoapsis = star1.getRadius();
    //star1.orbitalProperties.period = 60 * 60;

    /*const star2 = new Star("Hilbert", starSystemManager, randRange(-10, 10, starSystemRand), [star1]);
    star2.orbitalProperties.periapsis = (star1.getRadius() + star2.getRadius()) * 2;
    star2.orbitalProperties.apoapsis = (star1.getRadius() + star2.getRadius()) * 2;
    star2.orbitalProperties.period = 60 * 60;

    const star3 = new Star("Pythagoras", starSystemManager, randRange(-10, 10, starSystemRand), [star2]);
    star3.orbitalProperties.periapsis = (star3.getRadius() + star2.getRadius()) * 2;
    star3.orbitalProperties.apoapsis = (star3.getRadius() + star2.getRadius()) * 2;
    star3.orbitalProperties.period = 60 * 60 * 1.5;*/

    const planetSeed = randRange(-10, 10, starSystemRand);
    console.log("Planet seed : ", planetSeed);

    let planet: AbstractBody;

    if (uniformRandBool(0.5)) planet = new TelluricPlanet("Hécate", starSystemManager, planetSeed, starSystemManager.stars);
    else planet = new GasPlanet("Andromaque", starSystemManager, planetSeed, starSystemManager.stars);

    console.table(planet.orbitalProperties);

    planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;

    if (planet.bodyType == BodyType.TELLURIC) {
        const telluricPlanet = planet as TelluricPlanet;

        //TODO: use formula
        telluricPlanet.physicalProperties.minTemperature = randRangeInt(-50, 5, planet.rng);
        telluricPlanet.physicalProperties.maxTemperature = randRangeInt(10, 50, planet.rng);

        telluricPlanet.material.colorSettings.plainColor.copyFromFloats(
            0.22 + centeredRand(planet.rng) / 10,
            0.37 + centeredRand(planet.rng) / 10,
            0.024 + centeredRand(planet.rng) / 10
        );
        telluricPlanet.material.colorSettings.beachSize = 250 + 100 * centeredRand(planet.rng);
        telluricPlanet.material.updateManual();

        console.table(telluricPlanet.terrainSettings);
    }

    for (let i = 0; i < randRangeInt(0, 4, planet.rng); i++) {
        const satellite = new TelluricPlanet(`${planet.name}Sattelite${i}`, starSystemManager, planet.rng(), [planet]);
        const periapsis = 5 * planet.getRadius() + i * clamp(normalRandom(1, 0.1, satellite.rng), 0.9, 1.0) * planet.getRadius() * 2;
        const apoapsis = periapsis * clamp(normalRandom(1, 0.05, satellite.rng), 1, 1.5);
        satellite.physicalProperties.mass = 1;
        satellite.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, satellite.parentBodies),
            orientationQuaternion: satellite.getRotationQuaternion()
        };
    }

    starSystemManager.init();

    document.addEventListener("keydown", (e) => {
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
        if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
        if (e.key == "w" && player.nearestBody != null)
            (<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe;
    });

    const collisionWorker = new CollisionWorker(player, starSystemManager);

    starSystemManager.update(player, 0);
    starSystemManager.update(player, Date.now());
    starSystemManager.update(player, 0);
    starSystemManager.update(player, 0);
    starSystemManager.update(player, 0);

    player.positionNearBody(planet);

    console.log(
        "Average Temperature : ",
        computeMeanTemperature(
            star1.physicalProperties.temperature,
            star1.getApparentRadius(),
            (planet.orbitalProperties.periapsis + planet.orbitalProperties.apoapsis) / 2,
            0.3,
            0.3
        ) - 273,
        "°C"
    );

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();

        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;

            player.nearestBody = starSystemManager.getNearestBody();

            bodyEditor.update(player);

            //FIXME: should address stars orbits
            for (const star of starSystemManager.stars) {
                star.orbitalProperties.period = 0;
            }
            starSystemManager.update(player, Settings.TIME_MULTIPLIER * deltaTime);

            starSystemManager.translateAllBodies(player.update(deltaTime));

            if (!collisionWorker.isBusy() && player.isOrbiting()) {
                if (player.nearestBody?.bodyType == BodyType.TELLURIC) {
                    collisionWorker.checkCollision(player.nearestBody as TelluricPlanet);
                }
            }
        });

        engine.runRenderLoop(() => scene.render());
    });
};

window.addEventListener("resize", () => {
    bodyEditor.resize();
    engine.resize();
});

bodyEditor.resize();
