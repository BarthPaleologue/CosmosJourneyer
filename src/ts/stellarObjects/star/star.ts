import { AbstractBody } from "../../bodies/abstractBody";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StarMaterial } from "./starMaterial";
import { StarModel } from "./starModel";
import { UberScene } from "../../uberCore/uberScene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Assets } from "../../assets";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getRgbFromTemperature } from "../../utils/specrend";
import { Light } from "@babylonjs/core/Lights/light";
import { setRotationQuaternion } from "../../uberCore/transforms/basicTransform";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { getStellarTypeString } from "../common";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";

export class Star extends AbstractBody {
    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    readonly model: StarModel;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param parentBody The bodies the star is orbiting
     * @param model The seed of the star in [-1, 1]
     */
    constructor(name: string, scene: UberScene, model: StarModel | number, parentBody?: AbstractBody) {
        super(name, scene, parentBody);

        this.model = model instanceof StarModel ? model : new StarModel(model, parentBody?.model);

        const isSphere = this.model.rng(42) > 0.1;

        this.mesh =
            isSphere
                ? MeshBuilder.CreateSphere(
                      `${name}Mesh`,
                      {
                          diameter: this.model.radius * 2,
                          segments: 32
                      },
                      scene
                  )
                : Assets.CreateBananaClone(2 * this.model.radius);
        this.mesh.parent = this.getTransform();

        //FIXME: the radius here is a dirty fix because bakeTransformIntoVertexData does not work for reasons unknown
        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), isSphere ? this.model.radius : 0.1, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();

        this.material = new StarMaterial(this.getTransform(), this.model, scene);
        this.mesh.material = this.material;

        setRotationQuaternion(this.getTransform(), Quaternion.Identity());

        this.postProcesses.push(PostProcessType.VOLUMETRIC_LIGHT, PostProcessType.LENS_FLARE);
        if (this.model.ringsUniforms !== null) this.postProcesses.push(PostProcessType.RING);
    }

    getTypeName(): string {
        return `${getStellarTypeString(this.model.stellarType)} star`;
    }

    public updateMaterial(): void {
        this.material.update(this.getInternalClock());
    }

    public override computeCulling(camera: Camera): void {
        //this.mesh.isVisible = true;
    }

    public override dispose(): void {
        this.aggregate.dispose();
        this.mesh.dispose();
        this.light.dispose();
        this.material.dispose();
        super.dispose();
    }
}
