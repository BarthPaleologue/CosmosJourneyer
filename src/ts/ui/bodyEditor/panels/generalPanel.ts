import { EditorPanel } from "../editorPanel";
import { AbstractBody } from "../../../bodies/abstractBody";
import { stripAxisFromQuaternion } from "../../../utils/algebra";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Slider } from "handle-sliderjs";
import { Settings } from "../../../settings";
import { UberScene } from "../../../uberCore/uberScene";
import { isOrbiting } from "../../../utils/nearestBody";
import { ColorCorrection } from "../../../uberCore/postProcesses/colorCorrection";

export class GeneralPanel extends EditorPanel {
    constructor() {
        super("general");
    }
    init(body: AbstractBody, colorCorrection: ColorCorrection, scene: UberScene) {
        this.enable();

        for (const slider of this.sliders) slider.remove();

        let axialTiltX = stripAxisFromQuaternion(body.transform.getRotationQuaternion(), Axis.Y).toEulerAngles().x;
        let axialTiltZ = stripAxisFromQuaternion(body.transform.getRotationQuaternion(), Axis.Y).toEulerAngles().z;
        //TODO: do not hardcode here
        const power = 1.4;

        this.sliders = [
            new Slider("axialTiltX", document.getElementById("axialTiltX") as HTMLElement, -180, 180, Math.round((180 * axialTiltX) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                body.transform.rotate(Axis.X, newAxialTilt - axialTiltX);
                if (isOrbiting(scene.getActiveController(), body))
                    scene.getActiveController().transform.rotateAround(body.transform.getAbsolutePosition(), Axis.X, newAxialTilt - axialTiltX);
                axialTiltX = newAxialTilt;
            }),
            new Slider("axialTiltZ", document.getElementById("axialTiltZ") as HTMLElement, -180, 180, Math.round((180 * axialTiltZ) / Math.PI), (val: number) => {
                const newAxialTilt = (val * Math.PI) / 180;
                body.transform.rotate(Axis.Z, newAxialTilt - axialTiltZ);
                if (isOrbiting(scene.getActiveController(), body))
                    scene.getActiveController().transform.rotateAround(body.transform.getAbsolutePosition(), Axis.Z, newAxialTilt - axialTiltZ);
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
                    Settings.FOV = (val * Math.PI) / 360;
                }
            ),
            new Slider("timeModifier", document.getElementById("timeModifier") as HTMLElement, -200, 400, Math.pow(Settings.TIME_MULTIPLIER, 1 / power), (val: number) => {
                Settings.TIME_MULTIPLIER = Math.sign(val) * Math.pow(Math.abs(val), power);
            }),
            new Slider("exposure", document.getElementById("exposure") as HTMLElement, 0, 200, colorCorrection.exposure * 100, (val: number) => {
                colorCorrection.exposure = val / 100;
            }),
            new Slider("contrast", document.getElementById("contrast") as HTMLElement, 0, 200, colorCorrection.contrast * 100, (val: number) => {
                colorCorrection.contrast = val / 100;
            }),
            new Slider("brightness", document.getElementById("brightness") as HTMLElement, -100, 100, colorCorrection.brightness * 100, (val: number) => {
                colorCorrection.brightness = val / 100;
            }),
            new Slider("saturation", document.getElementById("saturation") as HTMLElement, 0, 200, colorCorrection.saturation * 100, (val: number) => {
                colorCorrection.saturation = val / 100;
            }),
            new Slider("gamma", document.getElementById("gamma") as HTMLElement, 0, 200, colorCorrection.gamma * 100, (val: number) => {
                colorCorrection.gamma = val / 100;
            })
        ];
    }
}
