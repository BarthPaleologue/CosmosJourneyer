import { NullEngine, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { PlayerController } from "../../src/ts/player/playerController";
import { BasicTransform } from "../../src/ts/transforms/basicTransform";

const engine = new NullEngine();
const scene = new Scene(engine);

describe("BasicTransform", () => {
    const basicTransform = new BasicTransform("transform");
    it("exists", () => expect(basicTransform).toBeDefined());
    it("has its position init at zero", () => {
        expect(basicTransform.getAbsolutePosition().equals(Vector3.Zero())).toBeTruthy();
    });
    it("has its quaternion init at identity", () => {
        expect(basicTransform.getRotationQuaternion().equals(Quaternion.Identity())).toBeTruthy();
    });
    it("is oriented forward", () => {
        expect(basicTransform.getForwardDirection().equals(new Vector3(0, 0, 1))).toBeTruthy();
        expect(basicTransform.getBackwardDirection().equals(new Vector3(0, 0, -1))).toBeTruthy();
        expect(basicTransform.getLeftDirection().equals(new Vector3(-1, 0, 0))).toBeTruthy();
        expect(basicTransform.getRightDirection().equals(new Vector3(1, 0, 0))).toBeTruthy();
    });
    it("can move through space", () => {
        basicTransform.setAbsolutePosition(Vector3.Zero());
        expect(basicTransform.getAbsolutePosition().equals(Vector3.Zero())).toBeTruthy();
        basicTransform.translate(new Vector3(0, 1, 0));
        expect(basicTransform.getAbsolutePosition().equals(new Vector3(0, 1, 0))).toBeTruthy();
    });
    it("can rotate around a pivot", () => {
        basicTransform.setAbsolutePosition(new Vector3(1, 0, 0));
        basicTransform.rotateAround(new Vector3(0, 0, 0), new Vector3(0, 1, 0), Math.PI / 2);
        expect(basicTransform.getAbsolutePosition().equals(new Vector3(0, 0, -1))).toBeTruthy();
    });
});