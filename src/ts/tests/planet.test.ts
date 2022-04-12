import {Engine, Scene, Vector3} from "@babylonjs/core";

import { JSDOM } from "jsdom"
const dom = new JSDOM();
global.document = dom.window.document;
//@ts-ignore
global.window = dom.window;
global.navigator = dom.window.navigator

//import {SolidPlanet} from "../components/celestialBodies/planets/solid/solidPlanet";

let canvas = dom.window.document.createElement("canvas");
let engine = new Engine(canvas);
let scene = new Scene(engine);

describe("planet", () => {
    //let planet = new SolidPlanet("planet", 10, Vector3.Zero(), 1, scene);
    it('is correctly initialized', () => {
        expect(Vector3.Zero()).toBe(Vector3.Zero());
    });
});