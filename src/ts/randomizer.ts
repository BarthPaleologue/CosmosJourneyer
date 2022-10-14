import { Tools } from "@babylonjs/core";

import { TelluricPlanet } from "./bodies/planets/telluricPlanet";

import "../styles/index.scss";
import { AbstractController } from "./controllers/abstractController";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { Gamepad } from "./inputs/gamepad";
import { CollisionWorker } from "./workers/collisionWorker";
import { StarSystem } from "./bodies/starSystem";

import { randRange } from "extended-random";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { Settings } from "./settings";
import { BodyType } from "./bodies/interfaces";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { HelmetOverlay } from "./ui/helmetOverlay";
import { PlayerController } from "./controllers/playerController";

const helmetOverlay = new HelmetOverlay();
const bodyEditor = new BodyEditor();

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

bodyEditor.setCanvas(canvas);

const [engine, scene] = await initEngineScene(canvas);

Assets.Init(scene).then(() => {
    const mouse = new Mouse(canvas, 1e5);

    const player = new PlayerController(scene);
    player.speed = 0.2 * Settings.EARTH_RADIUS;
    player.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 100000;
    player.inputs.push(new Keyboard(), mouse, new Gamepad());

    scene.setActiveController(player);

    const starSystemSeed = randRange(-1, 1, (step: number) => Math.random(), 0);
    const starSystem = new StarSystem(starSystemSeed, scene);
    scene.setStarSystem(starSystem);

    new StarfieldPostProcess("starfield", player, scene);

    starSystem.makeStars(1);
    starSystem.makePlanets(1);

    document.addEventListener("keydown", (e) => {
        if (e.key == "o") scene.isOverlayEnabled = !scene.isOverlayEnabled;
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, scene.getActiveController().getActiveCamera(), { precision: 4 });
        if (e.key == "u") bodyEditor.setVisibility(bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
        if (e.key == "w" && player.nearestBody != null)
            (<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe = !(<TelluricPlanet>(<unknown>player.nearestBody)).material.wireframe;
    });

    const collisionWorker = new CollisionWorker(player, starSystem);

    starSystem.update(Date.now() / 1000);

    player.positionNearBody(starSystem.planets[0]);

    scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();

        scene.registerBeforeRender(() => {
            const deltaTime = engine.getDeltaTime() / 1000;

            scene.getActiveController().nearestBody = starSystem.getNearestBody();

            bodyEditor.update(scene.getActiveController());
            helmetOverlay.update(scene.getActiveController().getNearestBody());
            helmetOverlay.setVisibility(bodyEditor.getVisibility() != EditorVisibility.FULL);

            //FIXME: should address stars orbits
            for (const star of starSystem.stars) star.orbitalProperties.period = 0;

            scene.update(Settings.TIME_MULTIPLIER * deltaTime);

            starSystem.translateAllBodies(player.update(deltaTime));

            if (!collisionWorker.isBusy() && player.isOrbiting()) {
                if (player.nearestBody?.bodyType == BodyType.TELLURIC) {
                    collisionWorker.checkCollision(player.nearestBody as TelluricPlanet);
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
