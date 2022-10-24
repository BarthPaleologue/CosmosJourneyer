import { EditorPanel } from "../editorPanel";
import { AbstractBody, isOrbiting } from "../../../bodies/abstractBody";
import { stripAxisFromQuaternion } from "../../../utils/algebra";
import { Axis } from "@babylonjs/core";
import { Slider } from "handle-sliderjs";
import { Settings } from "../../../settings";
import { PostProcessManager } from "../../../postProcesses/postProcessManager";
import { UberScene } from "../../../core/uberScene";

export class GeneralPanel extends EditorPanel {
    constructor() {
        super("general");
    }
    init(body: AbstractBody, postProcessManager: PostProcessManager, scene: UberScene) {
        this.enable();

        for (const slider of this.sliders) slider.remove();

        let axialTiltX = stripAxisFromQuaternion(body.getRotationQuaternion(), Axis.Y).toEulerAngles().x;
        let axialTiltZ = stripAxisFromQuaternion(body.getRotationQuaternion(), Axis.Y).toEulerAngles().z;
        //TODO: do not hardcode here
        const power = 1.4;

        this.sliders = [
            new Slider("zoom", document.getElementById("zoom") as HTMLElement, 0, 100, (100 * body.radius) / body.node.position.z, (value: number) => {
                const playerDir = body.getAbsolutePosition().normalizeToNew();
                body.setAbsolutePosition(playerDir.scale((100 * body.getRadius()) / value));
            }),
            new Slider("axialTiltX", document.getElementById("axialTiltX") as HTMLElement, -180, 180, Math.round((180 * axialTiltX) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                body.rotate(Axis.X, newAxialTilt - axialTiltX);
                if (isOrbiting(scene.getActiveController(), body))
                    scene.getActiveController().transform.rotateAround(body.getAbsolutePosition(), Axis.X, newAxialTilt - axialTiltX);
                axialTiltX = newAxialTilt;
            }),
            new Slider("axialTiltZ", document.getElementById("axialTiltZ") as HTMLElement, -180, 180, Math.round((180 * axialTiltZ) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                body.rotate(Axis.Z, newAxialTilt - axialTiltZ);
                if (isOrbiting(scene.getActiveController(), body))
                    scene.getActiveController().transform.rotateAround(body.getAbsolutePosition(), Axis.Z, newAxialTilt - axialTiltZ);
                axialTiltZ = newAxialTilt;
            }),
            new Slider(
                "cameraFOV",
                document.getElementById("cameraFOV") as HTMLElement,
                0,
                360,
                (scene.getActiveController().getActiveCamera().fov * 360) / Math.PI,
                (val: number) => {
                    scene.getActiveController().getActiveCamera().fov = (val * Math.PI) / 360;
                }
            ),
            new Slider("timeModifier", document.getElementById("timeModifier") as HTMLElement, -200, 400, Math.pow(Settings.TIME_MULTIPLIER, 1 / power), (val: number) => {
                Settings.TIME_MULTIPLIER = Math.sign(val) * Math.pow(Math.abs(val), power);
            }),
            new Slider("exposure", document.getElementById("exposure") as HTMLElement, 0, 200, postProcessManager.colorCorrection.exposure * 100, (val: number) => {
                postProcessManager.colorCorrection.exposure = val / 100;
            }),
            new Slider("contrast", document.getElementById("contrast") as HTMLElement, 0, 200, postProcessManager.colorCorrection.contrast * 100, (val: number) => {
                postProcessManager.colorCorrection.contrast = val / 100;
            }),
            new Slider("brightness", document.getElementById("brightness") as HTMLElement, -100, 100, postProcessManager.colorCorrection.brightness * 100, (val: number) => {
                postProcessManager.colorCorrection.brightness = val / 100;
            }),
            new Slider("saturation", document.getElementById("saturation") as HTMLElement, 0, 200, postProcessManager.colorCorrection.saturation * 100, (val: number) => {
                postProcessManager.colorCorrection.saturation = val / 100;
            }),
            new Slider("gamma", document.getElementById("gamma") as HTMLElement, 0, 200, postProcessManager.uberRenderingPipeline.colorCorrection.gamma * 100, (val: number) => {
                postProcessManager.colorCorrection.gamma = val / 100;
            })
        ];
    }
}
