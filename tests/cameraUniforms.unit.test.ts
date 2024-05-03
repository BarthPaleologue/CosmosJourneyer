import { NullEngine, Scene } from "@babylonjs/core";
import { UberPostProcess } from "../src/ts/uberCore/postProcesses/uberPostProcess";
import { CAMERA_UNIFORM_NAMES, getCameraUniforms } from "../src/ts/postProcesses/cameraUniforms";
import { Effect } from "@babylonjs/core/Materials/effect";

// this could be any shader, it is necessary to initialize the UberPostProcess
import blackHoleFragment from "../src/shaders/blackhole.glsl";

test("Camera uniforms", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    const shaderName = "blackhole";
    Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

    const postProcess = new UberPostProcess("TestPostProcess", shaderName, [], [], scene);

    const uniformBindings = getCameraUniforms(postProcess);

    // check we have the same number of elements
    expect(CAMERA_UNIFORM_NAMES.length).toEqual(uniformBindings.length);

    // check that all camera uniform name has a binding
    CAMERA_UNIFORM_NAMES.forEach(name => {
        expect(uniformBindings.find((uniformBinding) => uniformBinding.name === name)).toBeDefined();
    });

    // conversly, check that every binding corresponds to a valid camera uniform name
    uniformBindings.forEach(uniformBinding => {
        expect(CAMERA_UNIFORM_NAMES.find(name => name === uniformBinding.name)).toBeDefined();
    });
});