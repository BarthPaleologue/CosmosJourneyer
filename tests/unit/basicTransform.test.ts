import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getBackwardDirection, getForwardDirection, getLeftDirection, getRightDirection, translate } from "../../src/ts/uberCore/transforms/basicTransform";

const engine = new NullEngine();
const scene = new Scene(engine);

describe("BasicTransform", () => {
    const transform = new TransformNode("transform", scene);
    it("exists", () => expect(transform).toBeDefined());
    it("has its position init at zero", () => {
        expect(transform.getAbsolutePosition().equals(Vector3.Zero())).toBeTruthy();
    });
    it("is oriented forward", () => {
        expect(getForwardDirection(transform).equals(new Vector3(0, 0, 1))).toBeTruthy();
        expect(getBackwardDirection(transform).equals(new Vector3(0, 0, -1))).toBeTruthy();
        expect(getLeftDirection(transform).equals(new Vector3(1, 0, 0))).toBeTruthy();
        expect(getRightDirection(transform).equals(new Vector3(-1, 0, 0))).toBeTruthy();
    });
    it("can move through space", () => {
        transform.setAbsolutePosition(Vector3.Zero());
        expect(transform.getAbsolutePosition().equals(Vector3.Zero())).toBeTruthy();
        translate(transform, new Vector3(0, 1, 0));
        expect(transform.getAbsolutePosition().equals(new Vector3(0, 1, 0))).toBeTruthy();
    });
    it("can rotate around a pivot", () => {
        transform.setAbsolutePosition(new Vector3(1, 0, 0));
        transform.rotateAround(new Vector3(0, 0, 0), new Vector3(0, 1, 0), Math.PI / 2);
        expect(transform.getAbsolutePosition().equals(new Vector3(0, 0, -1))).toBeTruthy();
    });
});