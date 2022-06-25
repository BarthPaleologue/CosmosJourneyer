import { NullEngine, Scene } from "@babylonjs/core";
import { SolidPlanet } from "../../src/ts/celestialBodies/planets/solidPlanet";
import { Settings } from "../../src/ts/settings";
import { StarSystemManager } from "../../src/ts/celestialBodies/starSystemManager";
import { BodyType } from "../../src/ts/celestialBodies/interfaces";

const engine = new NullEngine();
const scene = new Scene(engine);
const starSystemManager = new StarSystemManager();

describe("SolidPlanet", () => {
    const planet = new SolidPlanet("Ares", Settings.PLANET_RADIUS, starSystemManager, scene, 153, []);
    it("is a solid planet", () => {
        expect(planet.getBodyType()).toBe(BodyType.SOLID);
    });
    it("has 6 sides", () => {
        expect(planet.sides.length).toBe(6);
    });
});