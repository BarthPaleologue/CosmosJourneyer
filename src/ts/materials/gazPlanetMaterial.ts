import { Color3, Effect, MaterialHelper, Scene, ShaderMaterial, Vector3 } from "@babylonjs/core";
import { PlayerController } from "../player/playerController";

import surfaceMaterialFragment from "../../shaders/gazPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/gazPlanetMaterial/vertex.glsl";
import { GazPlanet } from "../celestialBodies/planets/gazPlanet";
import { GazColorSettings } from "./colorSettingsInterface";
import { randRangeInt } from "extended-random";

const shaderName = "gazPlanetMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class GazPlanetMaterial extends ShaderMaterial {
    readonly planet: GazPlanet;
    readonly colorSettings: GazColorSettings;

    constructor(planet: GazPlanet, scene: Scene) {
        super(`${planet.name}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",

                "textureSampler",
                "depthSampler",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",
                "sunPosition",

                "color1",
                "color2",
                "colorSharpness",

                "time",

                "planetInverseRotationQuaternion",

                "playerPosition",

                "logarithmicDepthConstant"
            ],
            defines: ["#define LOGARITHMICDEPTH"]
        });

        this.planet = planet;
        this.colorSettings = {
            color1: new Color3(this.planet.rng(), this.planet.rng(), this.planet.rng()),
            color2: new Color3(this.planet.rng(), this.planet.rng(), this.planet.rng()),
            colorSharpness: randRangeInt(6, 20, this.planet.rng)
        }

        this.onBindObservable.add(() => {
            let effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", this.planet.seed);

        this.setVector3("playerPosition", Vector3.Zero());
        this.setVector3("sunPosition", Vector3.Zero());
        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
        this.setFloat("planetRadius", this.planet.getRadius());

        this.setColor3("color1", this.colorSettings.color1);
        this.setColor3("color2", this.colorSettings.color2);

        this.updateManual();
    }

    public updateManual(): void {
        this.setFloat("colorSharpness", this.colorSettings.colorSharpness);
    }

    public update(player: PlayerController, starPosition: Vector3) {
        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setVector3("playerPosition", player.getAbsolutePosition());
        this.setVector3("sunPosition", starPosition);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());

        this.setFloat("time", this.planet.starSystem.getTime() % 100000);
    }
}
