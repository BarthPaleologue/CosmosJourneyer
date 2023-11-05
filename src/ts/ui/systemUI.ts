import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { AbstractObject } from "../view/bodies/abstractObject";
import { ObjectOverlay } from "./objectOverlay";
import { UberCamera } from "../controller/uberCore/uberCamera";

export class SystemUI {
    private readonly gui: AdvancedDynamicTexture;
    private objectOverlays: ObjectOverlay[] = [];

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("SystemUI", true, scene);
    }

    public setEnabled(enabled: boolean) {
        this.gui.rootContainer.isEnabled = enabled;
    }

    public isEnabled() {
        return this.gui.rootContainer.isEnabled;
    }

    public createObjectOverlays(objects: AbstractObject[]) {
        this.removeObjectOverlays();

        for (const object of objects) {
            const overlay = new ObjectOverlay(object);
            this.gui.addControl(overlay.textRoot);
            this.gui.addControl(overlay.cursor);
            this.objectOverlays.push(overlay);
        }

        for (const overlay of this.objectOverlays) {
            overlay.init();
        }
    }

    public removeObjectOverlays() {
        for (const overlay of this.objectOverlays) {
            overlay.dispose();
        }
        this.objectOverlays = [];
    }

    public update(camera: UberCamera) {
        for (const overlay of this.objectOverlays) {
            overlay.update(camera);
        }
    }
}
