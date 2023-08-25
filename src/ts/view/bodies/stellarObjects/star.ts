import { AbstractBody } from "../abstractBody";

import { StarMaterial } from "../../materials/starMaterial";
import { UberScene } from "../../../controller/uberCore/uberScene";
import { getRgbFromTemperature } from "../../../utils/specrend";
import { StarModel } from "../../../model/stellarObjects/starModel";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Light } from "@babylonjs/core/Lights/light";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Assets } from "../../../controller/assets";
import { setRotationQuaternion } from "../../../controller/uberCore/transforms/basicTransform";

export class Star extends AbstractBody {
    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    readonly model: StarModel;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param parentBodies The bodies the star is orbiting
     * @param model The seed of the star in [-1, 1]
     */
    constructor(name: string, scene: UberScene, parentBodies: AbstractBody[], model: StarModel | number) {
        super(name, parentBodies, scene);

        this.model =
            model instanceof StarModel
                ? model
                : new StarModel(
                      model,
                      parentBodies.map((body) => body.model)
                  );

        this.mesh =
            this.model.rng(42) > 0.1
                ? MeshBuilder.CreateSphere(
                      `${name}Mesh`,
                      {
                          diameter: this.model.radius * 2,
                          segments: 32
                      },
                      scene
                  )
                : Assets.CreateBananaClone(this.model.radius * 2);
        this.mesh.parent = this.transform;

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.transform;

        this.material = new StarMaterial(this.transform, this.model, scene);
        this.mesh.material = this.material;

        // TODO: remove when rotation is transmitted to children
        setRotationQuaternion(this.transform, Quaternion.Identity());

        this.postProcesses.push(PostProcessType.OVERLAY, PostProcessType.VOLUMETRIC_LIGHT);

        if (this.model.hasRings) this.postProcesses.push(PostProcessType.RING);
    }

    public updateMaterial(): void {
        this.material.update(this.getInternalClock());
    }

    public override computeCulling(cameraPosition: Vector3): void {
        this.mesh.isVisible = true;
    }

    public override dispose(): void {
        this.mesh.dispose();
        this.light.dispose();
        this.material.dispose();
        super.dispose();
    }
}
