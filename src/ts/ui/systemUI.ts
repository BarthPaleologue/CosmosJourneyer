import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { AbstractObject } from "../view/bodies/abstractObject";
import { ObjectOverlay } from "./objectOverlay";
import { Camera } from "@babylonjs/core/Cameras/camera";

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

    public update(camera: Camera) {
        for (const overlay of this.objectOverlays) {
            overlay.update(camera);
        }
    }
}
