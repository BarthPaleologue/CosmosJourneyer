import { Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";

import "../styles/index.scss";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { HelmetOverlay } from "./ui/helmetOverlay";
import { ShipController } from "./controllers/shipController";
import { PlayerController } from "./controllers/playerController";
import { BlackHole } from "./bodies/blackHole";

const helmetOverlay = new HelmetOverlay();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const [engine, scene] = await initEngineScene(canvas);


Assets.Init(scene).then(() => {
    const mouse = new Mouse(canvas, 1e5);

    const playerController = new PlayerController(scene);
    playerController.speed = 0.2 * Settings.EARTH_RADIUS;
    playerController.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
    playerController.inputs.push(new Keyboard(), mouse, new Gamepad());

    scene.setActiveController(playerController);

    const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
    const starSystem = new StarSystem(starSystemSeed, scene);
    scene.setStarSystem(starSystem);

    new StarfieldPostProcess("starfield", playerController, scene);

    const BH = new BlackHole("gwo twou sanfon", 1000e3, starSystem, 0, starSystem.stars);
    BH.orbitalProperties.periapsis = BH.getRadius() * 4;
    BH.orbitalProperties.apoapsis = BH.getRadius() * 4;

    starSystem.makePlanets(1);

    starSystem.planets[0].orbitalProperties.periapsis /= 40;
    starSystem.planets[0].orbitalProperties.apoapsis /= 40;

    scene.initPostProcesses();

    document.addEventListener("keydown", (e) => {
        if (e.key == "o") scene.isOverlayEnabled = !scene.isOverlayEnabled;
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, scene.getActiveController().getActiveCamera(), { precision: 4 });
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
        if (e.key == "w" && playerController.nearestBody != null)
            (<TelluricPlanet>(<unknown>playerController.nearestBody)).material.wireframe = !(<TelluricPlanet>(<unknown>playerController.nearestBody)).material.wireframe;
    });

    const collisionWorker = new CollisionWorker(playerController, starSystem);


    starSystem.update(Date.now() / 1000);

    playerController.positionNearBody(BH, 20);

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();

        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;

            scene.getActiveController().nearestBody = starSystem.getNearestBody();

            helmetOverlay.update(scene.getActiveController().getNearestBody());
            helmetOverlay.setVisibility(true);

            //FIXME: should address stars orbits
            for (const star of starSystem.stars) star.orbitalProperties.period = 0;

            scene.update(Settings.TIME_MULTIPLIER * deltaTime);

            starSystem.translateAllBodies(playerController.update(deltaTime));

            if (!collisionWorker.isBusy() && playerController.isOrbiting()) {
                if (playerController.nearestBody?.bodyType == BodyType.TELLURIC) {
                    collisionWorker.checkCollision(playerController.nearestBody as TelluricPlanet);
                }
            }
        });

        engine.runRenderLoop(() => scene.render());
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});