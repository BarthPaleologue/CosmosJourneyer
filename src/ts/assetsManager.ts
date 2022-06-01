import { Texture } from "@babylonjs/core";

import rockNormalMap from "../asset/textures/rockn.png";
import bottomNormalMap from "../asset/textures/crackednormal.jpg";
import grassNormalMap from "../asset/textures/grassNormalMap.jpg";
import snowNormalMap1 from "../asset/textures/snowNormalMap.png";
import snowNormalMap2 from "../asset/textures/snowNormalMap2.png";
import sandNormalMap1 from "../asset/textures/sandNormalMap2.png";
import sandNormalMap2 from "../asset/textures/sandNormalMap2.jpg";

export class AssetsManager {
    static IS_READY = false;
    static RockNormalMap: Texture | null;
    static BottomNormalMap: Texture | null;
    static GrassNormalMap: Texture | null;
    static SnowNormalMap1: Texture | null;
    static SnowNormalMap2: Texture | null;
    static SandNormalMap1: Texture | null;
    static SandNormalMap2: Texture | null;
    static Init() {
        console.log("Initializing assets...");
        AssetsManager.RockNormalMap = new Texture(rockNormalMap);
        AssetsManager.BottomNormalMap = new Texture(bottomNormalMap);
        AssetsManager.GrassNormalMap = new Texture(grassNormalMap);
        AssetsManager.SnowNormalMap1 = new Texture(snowNormalMap1);
        AssetsManager.SnowNormalMap2 = new Texture(snowNormalMap2);
        AssetsManager.SandNormalMap1 = new Texture(sandNormalMap1);
        AssetsManager.SnowNormalMap2 = new Texture(sandNormalMap2);
        console.log("Assets initialized.");
        AssetsManager.IS_READY = true;
    }
}
