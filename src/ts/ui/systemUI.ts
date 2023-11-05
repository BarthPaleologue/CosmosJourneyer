import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { AbstractObject } from "../view/bodies/abstractObject";
import { ObjectOverlay } from "./objectOverlay";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class SystemUI {
    private readonly gui: AdvancedDynamicTexture;
    private objectOverlays: ObjectOverlay[] = [];

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("SystemUI", true, scene);
    }

    public setEnabled(enabled: boolean) {
        this.gui.rootContainer.alpha = enabled ? 1 : 0;
    }

    public isEnabled() {
        return this.gui.rootContainer.alpha > 0;
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

    public update(cameraPosition: Vector3) {
        for (const overlay of this.objectOverlays) {
            overlay.update(cameraPosition);
        }
    }
}
