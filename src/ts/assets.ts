import { Scene, Texture } from "@babylonjs/core";

import rockNormalMap from "../asset/textures/rockn.png";
import bottomNormalMap from "../asset/textures/crackednormal.jpg";
import grassNormalMap from "../asset/textures/grassNormalMap.jpg";
import snowNormalMap1 from "../asset/textures/snowNormalMap.png";
import snowNormalMap2 from "../asset/textures/snowNormalMap2.png";
import sandNormalMap1 from "../asset/textures/sandNormalMap2.png";
import sandNormalMap2 from "../asset/textures/sandNormalMap2.jpg";

export class Assets {
    static IS_READY = false;
    static RockNormalMap: Texture | null;
    static BottomNormalMap: Texture | null;
    static GrassNormalMap: Texture | null;
    static SnowNormalMap1: Texture | null;
    static SnowNormalMap2: Texture | null;
    static SandNormalMap1: Texture | null;
    static SandNormalMap2: Texture | null;
    static Init(scene: Scene) {
        console.log("Initializing assets...");
        Assets.RockNormalMap = new Texture(rockNormalMap, scene);
        Assets.BottomNormalMap = new Texture(bottomNormalMap, scene);
        Assets.GrassNormalMap = new Texture(grassNormalMap, scene);
        Assets.SnowNormalMap1 = new Texture(snowNormalMap1, scene);
        Assets.SnowNormalMap2 = new Texture(snowNormalMap2, scene);
        Assets.SandNormalMap1 = new Texture(sandNormalMap1, scene);
        Assets.SandNormalMap2 = new Texture(sandNormalMap2, scene);
        console.log("Assets initialized.");
        Assets.IS_READY = true;
    }
}
