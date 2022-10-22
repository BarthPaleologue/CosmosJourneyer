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
import { ShipController } from "./controllers/shipController";
import { OverlayPostProcess } from "./postProcesses/overlayPostProcess";
import { isOrbiting, positionNearBody } from "./utils/positionNearBody";
import { nearestBody } from "./utils/nearestBody";

const helmetOverlay = new HelmetOverlay();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const [engine, scene] = await initEngineScene(canvas);

Assets.Init(scene).then(() => {
    const mouse = new Mouse(canvas, 1e5);

    const spaceshipController = new ShipController();
    spaceshipController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
    spaceshipController.inputs.push(new Keyboard(), mouse, new Gamepad());

    scene.setActiveController(spaceshipController);

    const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
    const starSystem = new StarSystem(starSystemSeed, scene);

    starSystem.makeStars(1);
    starSystem.makePlanets(1);

    document.addEventListener("keydown", (e) => {
        if (e.key == "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, scene.getActiveController().getActiveCamera(), { precision: 4 });
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);

        if (e.key == "w" && isOrbiting(spaceshipController, starSystem.getNearestBody()))
            (starSystem.getNearestBody() as TelluricPlanet).material.wireframe = !(starSystem.getNearestBody() as TelluricPlanet).material.wireframe;
        if (e.key == "f") spaceshipController.flightAssistEnabled = !spaceshipController.flightAssistEnabled;
    });

    const collisionWorker = new CollisionWorker(spaceshipController, starSystem);

    starSystem.init();

    positionNearBody(spaceshipController, starSystem.planets[0], starSystem);

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();

        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;

            const nearest = nearestBody(scene.getActiveController().transform, starSystem.getBodies());

            helmetOverlay.update(nearest);
            helmetOverlay.setVisibility(true);

            //FIXME: should address stars orbits
            for (const star of starSystem.stars) star.orbitalProperties.period = 0;

            scene.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
            starSystem.translateAllBodies(spaceshipController.update(deltaTime));

            if (!collisionWorker.isBusy() && isOrbiting(spaceshipController, nearest)) {
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
