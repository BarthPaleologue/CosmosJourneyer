import { NullEngine, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { PlayerController } from "../../src/ts/player/playerController";

const engine = new NullEngine();
const scene = new Scene(engine);

describe("PlayerController", () => {
    const player = new PlayerController(scene);
    it("exists", () => expect(player).toBeDefined());
    it("has its position init at zero", () => {
        expect(player.getAbsolutePosition().equals(Vector3.Zero())).toBeTruthy();
    });
    it("has its quaternion init at identity", () => {
        expect(player.getRotationQuaternion().equals(Quaternion.Identity())).toBeTruthy();
    });
    it("sets its own camera to the scene active camera", () => {
        expect(player.camera).toBe(scene.activeCamera);
    });
    it("is oriented forward", () => {
        expect(player.getForwardDirection().equals(new Vector3(0, 0, 1))).toBeTruthy();
        expect(player.getBackwardDirection().equals(new Vector3(0, 0, -1))).toBeTruthy();
        expect(player.getLeftDirection().equals(new Vector3(-1, 0, 0))).toBeTruthy();
        expect(player.getRightDirection().equals(new Vector3(1, 0, 0))).toBeTruthy();
    });
    it("can move through space", () => {
        player.setAbsolutePosition(Vector3.Zero());
        expect(player.getAbsolutePosition().equals(Vector3.Zero())).toBeTruthy();
        player.translate(new Vector3(0, 1, 0));
        expect(player.getAbsolutePosition().equals(new Vector3(0, 1, 0))).toBeTruthy();
    });
});