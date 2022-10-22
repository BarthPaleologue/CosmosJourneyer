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
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { HelmetOverlay } from "./ui/helmetOverlay";
import { PlayerController } from "./controllers/playerController";
import { OverlayPostProcess } from "./postProcesses/overlayPostProcess";
import { isOrbiting, positionNearBody } from "./utils/positionNearBody";
import { nearestBody } from "./utils/nearestBody";

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

    const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
    const starSystem = new StarSystem(starSystemSeed, scene);

    starSystem.makeStars(1);
    starSystem.makePlanets(1);

    document.addEventListener("keydown", (e) => {
        if (e.key == "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, scene.getActiveController().getActiveCamera(), { precision: 4 });
        if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);

        if (e.key == "w" && isOrbiting(player, starSystem.getNearestBody()))
            (starSystem.getNearestBody() as TelluricPlanet).material.wireframe = !(starSystem.getNearestBody() as TelluricPlanet).material.wireframe;
    });

    const collisionWorker = new CollisionWorker(player, starSystem);

    starSystem.init();

    positionNearBody(player, starSystem.planets[0], starSystem);

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();

        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;

            const nearest = nearestBody(scene.getActiveController().transform, starSystem.getBodies());

            bodyEditor.update(scene.getActiveController());
            helmetOverlay.update(nearest);
            helmetOverlay.setVisibility(bodyEditor.getVisibility() != EditorVisibility.FULL);

            //FIXME: should address stars orbits
            for (const star of starSystem.stars) star.orbitalProperties.period = 0;

            scene.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);

            starSystem.translateAllBodies(player.update(deltaTime));

            if (!collisionWorker.isBusy() && isOrbiting(player, nearest)) {
                if (nearest.bodyType == BodyType.TELLURIC) {
                    collisionWorker.checkCollision(nearest as TelluricPlanet);
                }
            }
        });

        engine.runRenderLoop(() => scene.render());
    });
});

window.addEventListener("resize", () => {
    bodyEditor.resize();
    engine.resize();
});

bodyEditor.resize();
