import { Engine } from "@babylonjs/core/Engines/engine";
import { UberScene } from "../uberCore/uberScene";
import { DefaultControls } from "../defaultController/defaultControls";
import { StarSystemView } from "../starSystem/StarSystemView";
import { StarSystemController } from "../starSystem/starSystemController";
import { positionNearObjectWithStarVisible } from "../utils/positionNearObject";
import { BODY_TYPE } from "../model/common";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import { Settings } from "../settings";
import mainMenuHTML from "../../html/mainMenu.html";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { TransformTranslationAnimation } from "../uberCore/transforms/animations/translation";
import { Observable } from "@babylonjs/core/Misc/observable";
import { SystemSeed } from "../utils/systemSeed";

export class MainMenu {
    readonly controls: DefaultControls;
    readonly scene: UberScene;

    readonly starSystemView: StarSystemView;
    readonly starSystemController: StarSystemController;

    readonly onStartObservable = new Observable<void>();
    readonly onContributeObservable = new Observable<void>();
    readonly onCreditsObservable = new Observable<void>();

    private htmlRoot: HTMLElement | null = null;
    private title: HTMLElement | null = null;

    private activeRightPanel: HTMLElement | null = null;
    private contributePanel: HTMLElement | null = null;
    private creditsPanel: HTMLElement | null = null;

    constructor(engine: Engine, havokInstance: HavokPhysicsWithBindings) {
        this.starSystemView = new StarSystemView(engine, havokInstance);

        this.scene = this.starSystemView.scene;
        this.controls = new DefaultControls(this.scene);
        this.controls.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 1e5;
        this.scene.setActiveController(this.controls);

        this.controls.getActiveCamera().detachControl();

        const allowedSeeds = [
          new SystemSeed(new Vector3(-4030557626489595, -5311991039371311, 6300166560550159), 0),
          new SystemSeed(new Vector3(-2580282252593743, -688526648963167, 464658922001219), 0),
          new SystemSeed(new Vector3(3935150661125235, 4680257902545175, 4968241436399943), 0),
          new SystemSeed(new Vector3(1942125733379075, -3862794543036899, 2212860146496827), 0),
          new SystemSeed(new Vector3(3641602661119511, 91206409140523, 1081626828903715), 0),
          new SystemSeed(new Vector3(6987489365968175, 5899214087953411, -482678543564899), 0),
          new SystemSeed(new Vector3(-5117383081251883, 4942502095020231, -8855350792299879), 0),
          new SystemSeed(new Vector3(-1628959327636315, 38204247336039, 7047545368534403), 0),
          new SystemSeed(new Vector3(1129053200580283, 6028754782535763, 562090442882903), 0),
          new SystemSeed(new Vector3(8775426616432815, -969201051835051, 1718356477669207), 0),
          new SystemSeed(new Vector3(6934195322427891, 3329119907117327, -114138322638523), 0),
          new SystemSeed(new Vector3(-5408989890290555, -5686219213385011, 6555487514235607), 0),
          new SystemSeed(new Vector3(3132497034982239, 7543003914077319, -6084670653643795), 0),
          new SystemSeed(new Vector3(-7292809030413071, -3635511197742219, -2218904218845895), 0),
          new SystemSeed(new Vector3(2542436462572791, 7347121178237787, 4238060996268067), 0),
          new SystemSeed(new Vector3(5428493874753067, -8923724700575275, 7237046022809219), 0),
          new SystemSeed(new Vector3(-3899216056009119, -7848080162041851, 8925190396180339), 0)
        ];

        /*const randomSeed = new SystemSeed(
            new Vector3(
                Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER),
                Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER),
                Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER)
            ),
            0
        );

        console.log(randomSeed.starSectorCoordinates.x, randomSeed.starSectorCoordinates.y, randomSeed.starSectorCoordinates.z, randomSeed.index);*/

        const seed = allowedSeeds[Math.floor(Math.random() * allowedSeeds.length)];
        this.starSystemController = new StarSystemController(seed, this.scene);
    }

    init() {
        this.starSystemView.setStarSystem(this.starSystemController, true);

        this.starSystemView.init();

        this.starSystemView.ui.setEnabled(false);

        const nbRadius = this.starSystemController.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 2;
        positionNearObjectWithStarVisible(
            this.controls,
            this.starSystemController.planets.length > 0 ? this.starSystemController.getBodies()[1] : this.starSystemController.stellarObjects[0],
            this.starSystemController,
            nbRadius
        );

        this.starSystemView.bodyEditor.setVisibility(EditorVisibility.HIDDEN);

        document.body.insertAdjacentHTML("beforeend", mainMenuHTML);

        const htmlRoot = document.getElementById("mainMenu");
        if (htmlRoot === null) throw new Error("#mainMenu does not exist!");
        this.htmlRoot = htmlRoot;

        const title = document.querySelector("#mainMenu h1");
        if (title === null) throw new Error("#mainMenu h1 does not exist!");
        this.title = title as HTMLElement;

        document.getElementById("startButton")?.addEventListener("click", () => {
            this.startAnimation();
        });

        const contributeButton = document.getElementById("contributeButton");
        if (contributeButton === null) throw new Error("#contributeButton does not exist!");

        const contributePanel = document.getElementById("contribute");
        if(contributePanel === null) throw new Error("#contribute does not exist!");
        this.contributePanel = contributePanel;

        contributeButton.addEventListener("click", () => {
            this.toggleActivePanel(contributePanel);
            this.onContributeObservable.notifyObservers();
        });

        const creditsButton = document.getElementById("creditsButton");
        if (creditsButton === null) throw new Error("#creditsButton does not exist!");
        const creditsPanel = document.getElementById("credits");
        if(creditsPanel === null) throw new Error("#credits does not exist!");
        this.creditsPanel = creditsPanel;

        creditsButton.addEventListener("click", () => {
            this.toggleActivePanel(creditsPanel);
            this.onCreditsObservable.notifyObservers();
        });
    }

    private startAnimation() {
        const currentForward = getForwardDirection(this.controls.getTransform());

        const planet = this.starSystemController.planets[0];
        const newForward = planet.getTransform().getAbsolutePosition().subtract(this.controls.getTransform().getAbsolutePosition()).normalize();
        const axis = Vector3.Cross(currentForward, newForward);
        const angle = Vector3.GetAngleBetweenVectors(currentForward, newForward, axis);
        const duration = 2;

        const rotationAnimation = new TransformRotationAnimation(this.controls.getTransform(), axis, angle, duration);
        const translationAnimation = new TransformTranslationAnimation(
            this.controls.getTransform(),
            this.controls
                .getTransform()
                .getAbsolutePosition()
                .add(newForward.scale(-planet.model.radius * 2)),
            duration
        );

        if (this.title === null) throw new Error("Title is null");

        this.title.animate(
            [
                {
                    marginTop: this.title.style.marginTop
                },
                {
                    marginTop: "30vh"
                }
            ],
            {
                duration: duration * 1000,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );

        const animationCallback = () => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (!translationAnimation.isFinished()) translationAnimation.update(deltaTime);
            if (!rotationAnimation.isFinished()) rotationAnimation.update(deltaTime);
            else {
                this.scene.onBeforePhysicsObservable.removeCallback(animationCallback);
                if (this.htmlRoot === null) throw new Error("MainMenu is null");
                this.htmlRoot.style.display = "none";
                this.onStartObservable.notifyObservers();
            }

            this.controls.getActiveCamera().getViewMatrix();

            this.starSystemController.applyFloatingOrigin();
            this.starSystemController.updateShaders(0.0);
        };

        this.scene.onBeforePhysicsObservable.add(animationCallback);

        this.hideMenu();
    }

    private toggleActivePanel(newPanel: HTMLElement) {
        if(this.activeRightPanel === newPanel) {
            this.activeRightPanel = null;
            newPanel.classList.remove("visible");
            return;
        }

        if(this.activeRightPanel !== null) {
            this.activeRightPanel.classList.remove("visible");
        }

        this.activeRightPanel = newPanel;
        newPanel.classList.add("visible");
    }

    private hideMenu() {
        const menuItems = document.getElementById("menuItems");
        if (menuItems === null) throw new Error("#menuItems does not exist!");
        menuItems.style.left = "-20%";
    }
}
