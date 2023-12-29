import { Engine } from "@babylonjs/core/Engines/engine";
import { UberScene } from "../uberCore/uberScene";
import { DefaultControls } from "../defaultController/defaultControls";
import { StarSystemView } from "../starSystem/StarSystemView";
import { StarSystemController } from "../starSystem/starSystemController";
import { positionNearObject } from "../utils/positionNearObject";
import { BODY_TYPE } from "../model/common";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import { Settings } from "../settings";

export class MainMenu {
  readonly controls: DefaultControls;
  readonly scene: UberScene;

  readonly starSystemView: StarSystemView;
  readonly starSystemController: StarSystemController;

  constructor(engine: Engine, havokInstance: HavokPhysicsWithBindings) {
    this.starSystemView = new StarSystemView(engine, havokInstance);

    this.scene = this.starSystemView.scene;
    this.controls = new DefaultControls(this.scene);
    this.controls.getActiveCamera().maxZ = Settings.EARTH_RADIUS * 1e5;
    this.scene.setActiveController(this.controls);

    this.starSystemController = new StarSystemController(2e3, this.scene);
  }

  init() {
    this.starSystemView.setStarSystem(this.starSystemController, true);

    this.starSystemView.init();

    this.starSystemView.ui.setEnabled(false);

    const nbRadius = this.starSystemController.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 3;
    positionNearObject(this.controls, this.starSystemController.planets.length > 0 ? this.starSystemController.getBodies()[1] : this.starSystemController.stellarObjects[0], this.starSystemController, nbRadius);

    this.starSystemView.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
  }
}