import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import HavokPhysics from "@babylonjs/havok";
import { DefaultControls } from "../defaultControls/defaultControls";
import { Assets } from "../assets/assets";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HyperSpaceTunnel } from "../utils/hyperSpaceTunnel";
import { Axis } from "@babylonjs/core/Maths/math.axis";

export async function createHyperspaceTunnelDemo(engine: AbstractEngine) {
    const havokInstance = await HavokPhysics();

    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const havokPlugin = new HavokPlugin(true, havokInstance);
    scene.enablePhysics(new Vector3(0, 0, 0), havokPlugin);

    const defaultControls = new DefaultControls(scene);

    const camera = defaultControls.getActiveCamera();
    camera.attachControl();

    scene.enableDepthRenderer(camera, false, true);

    await Assets.Init(scene);

    const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
    directionalLight.intensity = 0.7;

    const hyperSpaceTunnel = new HyperSpaceTunnel(Axis.Z, scene);

    scene.onBeforeRenderObservable.add(() => {
        defaultControls.update(engine.getDeltaTime() / 1000);
        hyperSpaceTunnel.update(engine.getDeltaTime() / 1000);
    });

    return scene;
}
