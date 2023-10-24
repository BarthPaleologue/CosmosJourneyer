import lensFlareFragment from "../../../shaders/lensflare.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderSamplers, ShaderUniforms, UniformEnumType } from "../../controller/uberCore/postProcesses/types";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Star } from "../bodies/stellarObjects/star";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsEngineV2, PhysicsRaycastResult, Ray, RayHelper } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";

const shaderName = "lensflare";
Effect.ShadersStore[`${shaderName}FragmentShader`] = lensFlareFragment;

export type LensFlareSettings = {
    // empty for now
};

export class LensFlarePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: LensFlareSettings;
    readonly object: StellarObject;

    constructor(object: StellarObject, scene: UberScene) {
        const settings: LensFlareSettings = {};

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(object),
            ...getActiveCameraUniforms(scene),
            {
                name: "flareColor",
                type: UniformEnumType.Vector3,
                get: () => {
                    if (object instanceof Star) return object.model.surfaceColor;
                    else return new Vector3(1, 1, 1);
                }
            },
            /*{
          name: "occulted",
          type: UniformEnumType.Bool,
          get: () => {
              // send raycast from camera to object and check early intersections
              const raycastResult = new PhysicsRaycastResult();
              const start = scene.getActiveUberCamera().getAbsolutePosition();
              const end = object.transform.getAbsolutePosition();
              (scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, raycastResult);
              if (raycastResult.hasHit) {
                  //console.log(Vector3.Distance(raycastResult.body!.getObjectCenterWorld(), object.transform.getAbsolutePosition()));
                  //console.log(raycastResult.body?.transformNode.name);

                  const ray1 = new Ray(start, end.subtract(start).normalize(), Vector3.Distance(start, end));
      const ray1Helper = new RayHelper(ray1);
      ray1Helper.show(scene, new Color3(1, 1, 0));

                  return true;
              }

              return false;
          }
      },*/
            {
                name: "aspectRatio",
                type: UniformEnumType.Float,
                get: () => {
                    return scene.getEngine().getScreenAspectRatio();
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(object.name, shaderName, uniforms, samplers, scene);

        this.object = object;
        this.settings = settings;
    }
}
