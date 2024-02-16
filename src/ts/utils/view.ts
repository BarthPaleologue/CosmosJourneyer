import { Scene } from "@babylonjs/core/scene";

export interface View {
    render(): void;

    detachControl(): void;
    attachControl(): void;

    getMainScene(): Scene;
}
