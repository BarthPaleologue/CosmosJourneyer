import { Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";

import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { HelmetOverlay } from "./ui/helmetOverlay";
import { PlayerController } from "./controllers/playerController";
import { OverlayPostProcess } from "./postProcesses/overlayPostProcess";
import { positionNearBody } from "./utils/positionNearBody";
import { isOrbiting } from "./bodies/abstractBody";

const helmetOverlay = new HelmetOverlay();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const [engine, scene] = await initEngineScene(canvas);

Assets.Init(scene).then(() => {
    const mouse = new Mouse(canvas, 1e5);

    const playerController = new PlayerController();
    playerController.speed = 0.2 * Settings.EARTH_RADIUS;
    playerController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
    playerController.inputs.push(new Keyboard(), mouse, new Gamepad());

    scene.setActiveController(playerController);

    const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
    const starSystem = new StarSystem(starSystemSeed, scene);

    const BH = starSystem.makeBlackHole(0);
    BH.orbitalProperties.periapsis = BH.getRadius() * 4;
    BH.orbitalProperties.apoapsis = BH.getRadius() * 4;

    const planet = starSystem.makeTelluricPlanet();
    planet.orbitalProperties.periapsis = 10000e3;
    planet.orbitalProperties.apoapsis = 10000e3;

    starSystem.makePlanets(1);

    document.addEventListener("keydown", (e) => {
        if (e.key == "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, scene.getActiveController().getActiveCamera(), { precision: 4 });
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
        if (e.key == "w" && isOrbiting(playerController, starSystem.getNearestBody()))
            (starSystem.getNearestBody() as TelluricPlanet).material.wireframe = !(starSystem.getNearestBody() as TelluricPlanet).material.wireframe;
    });

    const collisionWorker = new CollisionWorker(playerController, starSystem);

    starSystem.init();

    positionNearBody(playerController, BH, starSystem, 20);

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();

        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;

            const nearest = starSystem.getNearestBody(scene.getActiveUberCamera().position);

            helmetOverlay.update(nearest);
            helmetOverlay.setVisibility(true);

            //FIXME: should address stars orbits
            for (const star of starSystem.stars) star.orbitalProperties.period = 0;

            scene.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
            starSystem.translateAllBodies(playerController.update(deltaTime));

            if (!collisionWorker.isBusy() && isOrbiting(playerController, nearest)) {
                if (nearest.bodyType == BodyType.TELLURIC) {
                    collisionWorker.checkCollision(nearest as TelluricPlanet);
                }
            }
        });

        engine.runRenderLoop(() => scene.render());
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});
