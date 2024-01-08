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

export class MainMenu {
    readonly controls: DefaultControls;
    readonly scene: UberScene;

    readonly starSystemView: StarSystemView;
    readonly starSystemController: StarSystemController;

    readonly onStartObservable = new Observable<void>();

    private title: HTMLElement | null = null;

    constructor(engine: Engine, havokInstance: HavokPhysicsWithBindings) {
        this.starSystemView = new StarSystemView(engine, havokInstance);

        this.scene = this.starSystemView.scene;
        this.controls = new DefaultControls(this.scene);
        this.controls.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 1e5;
        this.scene.setActiveController(this.controls);

        this.controls.getActiveCamera().detachControl();

        const allowedSeeds = [
            339.71738141753696, 699.6298526409856, 636.5370404923914, 905.9022866058482, 131.2407412548735, 496.18890481597776, 540.7112951378157, 796.7959333496561,
            296.7276774698002, 523.9123323780545, 993.179364592667, 649.2861236690691, 28.197193558682887, 742.8403332894349, 226.71622361745025, 115.8460802506951,
            709.7364687709704, 482.3140197875797
        ];

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

        const title = document.querySelector("#mainMenu h1");
        if (title === null) throw new Error("#mainMenu h1 does not exist!");
        this.title = title as HTMLElement;

        document.getElementById("startButton")?.addEventListener("click", () => {
            this.startAnimation();
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

        this.title.animate([
            {
                marginTop: this.title.style.marginTop
            },
            {
                marginTop: "30vh"
            }
        ], {
            duration: duration * 1000,
            easing: "ease-in-out",
            fill: "forwards"
        });

        const animationCallback = () => {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

            if (!translationAnimation.isFinished()) translationAnimation.update(deltaTime);
            if (!rotationAnimation.isFinished()) rotationAnimation.update(deltaTime);
            else {
                this.scene.onBeforePhysicsObservable.removeCallback(animationCallback);
                if(this.title === null) throw new Error("Title is null");
                this.title.style.opacity = "0";
                this.onStartObservable.notifyObservers();
            }

            this.controls.getActiveCamera().getViewMatrix();

            this.starSystemController.applyFloatingOrigin();
            this.starSystemController.updateShaders(0.0);
        };

        this.scene.onBeforePhysicsObservable.add(animationCallback);

        this.hideMenu();
    }

    private hideMenu() {
        const menuItems = document.getElementById("menuItems");
        if (menuItems === null) throw new Error("#menuItems does not exist!");
        menuItems.style.left = "-20%";
    }
}
