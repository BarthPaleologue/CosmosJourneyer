import { Engine, MeshBuilder, Scene } from "@babylonjs/core";
import { PlayerController } from "../controllers/playerController";
import { Keyboard } from "../inputs/keyboard";
import { Assets } from "../assets";

export class StarMap extends Scene {
    //readonly controller: PlayerController;
    constructor(engine: Engine) {
        super(engine);
        //this.controller = new PlayerController(this);
        //this.controller.getActiveCamera()._scene = this;
        //this.activeCamera = this.controller.getActiveCamera();
        //this.controller.inputs.push(new Keyboard());

        /*const defaultSphere = MeshBuilder.CreateSphere("sphere", {diameter: 1}, this);
        defaultSphere.material = Assets.DebugMaterial("debugSphere");*/

        /*this.registerBeforeRender(() => {
            const deltaTime = this.getEngine().getDeltaTime() / 1000;
            //defaultSphere.position.subtractInPlace(this.controller.update(deltaTime));
        });*/
    }
}