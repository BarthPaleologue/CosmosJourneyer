import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { DefaultControls } from "../defaultControls/defaultControls";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { OrbitalObjectWrapper } from "../utils/orbitalObjectWrapper";
import { OrbitalObject, OrbitalObjectType, OrbitalObjectUtils } from "../architecture/orbitalObject";
import { Tools } from "@babylonjs/core/Misc/tools";
import { OrbitRenderer } from "../orbit/orbitRenderer";
import { AxisRenderer } from "../orbit/axisRenderer";
import { getPointOnOrbit } from "../orbit/orbit";
import { Axis } from "@babylonjs/core/Maths/math.axis";

export function createOrbitalDemoScene(engine: AbstractEngine): Scene {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const defaultControls = new DefaultControls(scene);

    const camera = defaultControls.getActiveCamera();
    camera.minZ = 0.1;
    camera.attachControl();

    scene.enableDepthRenderer(camera, false, true);

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 1.0;

    const sun = new OrbitalObjectWrapper(MeshBuilder.CreateSphere("sun", { diameter: 1 }, scene), {
        name: "Sun",
        orbit: {
            argumentOfPeriapsis: 0,
            semiMajorAxis: 0,
            initialMeanAnomaly: 0,
            longitudeOfAscendingNode: 0,
            inclination: 0,
            eccentricity: 0,
            p: 2
        },
        type: OrbitalObjectType.STAR,
        seed: 0,
        physics: {
            axialTilt: 0,
            mass: 1e12,
            siderealDaySeconds: 0
        }
    });

    const earth = new OrbitalObjectWrapper(MeshBuilder.CreateSphere("earth", { diameter: 0.5 }, scene), {
        name: "Earth",
        orbit: {
            argumentOfPeriapsis: 0,
            semiMajorAxis: 10,
            initialMeanAnomaly: 0,
            longitudeOfAscendingNode: 0,
            inclination: 0,
            eccentricity: 0.5,
            p: 2
        },
        type: OrbitalObjectType.TELLURIC_PLANET,
        seed: 0,
        physics: {
            axialTilt: Tools.ToRadians(23.5),
            mass: 1e11,
            siderealDaySeconds: 0
        }
    });

    const moon = new OrbitalObjectWrapper(MeshBuilder.CreateSphere("moon", { diameter: 0.2 }, scene), {
        name: "Moon",
        orbit: {
            argumentOfPeriapsis: 0,
            semiMajorAxis: 3,
            initialMeanAnomaly: 0,
            longitudeOfAscendingNode: 0,
            inclination: Tools.ToRadians(45),
            eccentricity: 0.7,
            p: 2
        },
        type: OrbitalObjectType.TELLURIC_SATELLITE,
        seed: 0,
        physics: {
            axialTilt: 0,
            mass: 1,
            siderealDaySeconds: 0
        }
    });

    const bodyToParents = new Map<OrbitalObject, OrbitalObject[]>();
    bodyToParents.set(earth, [sun]);
    bodyToParents.set(moon, [earth]);

    const orbitRenderer = new OrbitRenderer();
    orbitRenderer.setOrbitalObjects(bodyToParents, scene);
    orbitRenderer.setVisibility(true);

    const axisRenderer = new AxisRenderer();
    axisRenderer.setVisibility(true);
    axisRenderer.setOrbitalObjects([sun, earth, moon], scene);

    const referencePlaneRotation = Matrix.Identity();

    let elapsedSeconds = 0;

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        elapsedSeconds += deltaSeconds;
        defaultControls.update(deltaSeconds);

        const referencePlaneDeltaRotation = Matrix.RotationAxis(Axis.Y, deltaSeconds * 0.1);

        referencePlaneRotation.multiplyToRef(referencePlaneDeltaRotation, referencePlaneRotation);

        OrbitalObjectUtils.SetOrbitalPosition(earth, [sun], referencePlaneRotation, elapsedSeconds);
        OrbitalObjectUtils.UpdateRotation(earth, deltaSeconds);

        OrbitalObjectUtils.SetOrbitalPosition(moon, [earth], referencePlaneRotation, elapsedSeconds);
        OrbitalObjectUtils.UpdateRotation(moon, deltaSeconds);

        orbitRenderer.update(referencePlaneRotation);
    });

    return scene;
}
