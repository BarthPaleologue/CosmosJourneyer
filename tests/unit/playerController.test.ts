import { NullEngine, Scene } from "@babylonjs/core";
import { PlayerController } from "../../src/ts/player/playerController";

const engine = new NullEngine();
const scene = new Scene(engine);

describe("PlayerController", () => {
    const player = new PlayerController(scene)
    it("exists", () => {
        expect(player).toBeDefined()
    })
})