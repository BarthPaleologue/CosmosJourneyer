import { Color3, Quaternion, Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";
import { Star } from "./bodies/stars/star";

import { PlayerController } from "./player/playerController";

import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";

import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystemManager } from "./bodies/starSystemManager";

import "../styles/index.scss";

import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const [engine, scene] = initEngineScene(canvas);

Assets.Init(scene);
Assets.onFinish = () => {
    const mouse = new Mouse(canvas, 1e5);

    const player = new PlayerController(scene);
    player.speed = 0.2 * Settings.EARTH_RADIUS;
    player.camera.maxZ = Settings.EARTH_RADIUS * 100000;
    player.inputs.push(new Keyboard(), mouse, new Gamepad());

    console.log(`Time is going ${Settings.TIME_MULTIPLIER} time${Settings.TIME_MULTIPLIER > 1 ? "s" : ""} faster than in reality`);

    const starSystem = new StarSystemManager(scene, Settings.VERTEX_RESOLUTION);

    const sun = new Star("Weierstrass", starSystem, 22, []);
    sun.orbitalProperties.period = 60 * 60 * 24;

    const planet = new TelluricPlanet("Hécate", starSystem, -2.994, starSystem.stars);

    planet.physicalProperties.rotationPeriod /= 20;

    planet.orbitalProperties = {
        period: 60 * 60 * 24 * 365.25,
        apoapsis: 4000 * planet.getRadius(),
        periapsis: 4000 * planet.getRadius(),
        orientationQuaternion: Quaternion.Identity()
    };

    planet.postProcesses.ocean?.dispose();
    starSystem.spaceRenderingPipeline.oceans.splice(starSystem.spaceRenderingPipeline.oceans.indexOf(planet.postProcesses.ocean!), 1);
    starSystem.surfaceRenderingPipeline.oceans.splice(starSystem.surfaceRenderingPipeline.oceans.indexOf(planet.postProcesses.ocean!), 1);

    planet.postProcesses.clouds?.dispose();
    starSystem.spaceRenderingPipeline.clouds.splice(starSystem.spaceRenderingPipeline.clouds.indexOf(planet.postProcesses.clouds!), 1);
    starSystem.surfaceRenderingPipeline.clouds.splice(starSystem.surfaceRenderingPipeline.clouds.indexOf(planet.postProcesses.clouds!), 1);

    planet.postProcesses.rings?.dispose();
    starSystem.spaceRenderingPipeline.rings.splice(starSystem.spaceRenderingPipeline.rings.indexOf(planet.postProcesses.rings!), 1);
    starSystem.surfaceRenderingPipeline.rings.splice(starSystem.surfaceRenderingPipeline.rings.indexOf(planet.postProcesses.rings!), 1);


    starSystem.init();

    const collisionWorker = new CollisionWorker(player, starSystem);

    // update to current date
    starSystem.update(player, Date.now() / 1000);

    player.positionNearBody(planet);

    function updateScene() {
        const deltaTime = engine.getDeltaTime() / 1000;

        player.nearestBody = planet;

        starSystem.translateAllBodies(player.update(deltaTime));

        //FIXME: should address stars orbits
        for (const star of starSystem.stars) {
            star.orbitalProperties.period = 0;
        }
        starSystem.update(player, deltaTime * Settings.TIME_MULTIPLIER);

        if (!collisionWorker.isBusy() && player.isOrbiting()) {
            if (player.nearestBody?.bodyType == BodyType.TELLURIC) {
                collisionWorker.checkCollision(player.nearestBody as TelluricPlanet);
            }
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, player.camera, { precision: 4 });
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
        if (e.key == "w" && player.isOrbiting())
            (<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe;
    });

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();
        scene.registerBeforeRender(() => updateScene());
        engine.runRenderLoop(() => scene.render());
    });
};

window.addEventListener("resize", () => {
    engine.resize();
});