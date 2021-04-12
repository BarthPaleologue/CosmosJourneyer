let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
//scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.attachControl(canvas);

let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, -10), scene);
freeCamera.attachControl(canvas);

scene.activeCamera = freeCamera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(100, 100, -150), scene);

let cube = BABYLON.Mesh.CreateSphere("tester", 32, 1, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.diffuseColor = BABYLON.Color3.Red();
cube.material = mat;
cube.visibility = 0.5;

let yolo = BABYLON.Mesh.CreateSphere("!!", 32, 1, scene);


/*let shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, "./shader",
    {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldView", "worldViewProjection", "view",
            "projection", "v3CameraPos", "v3LightPos",
            "v3InvWavelength", "fCameraHeight2", "fOuterRadius",
            "fOuterRadius2", "fInnerRadius", "fInnerRadius2",
            "fKrESun", "fKmESun", "fKr4PI", "fKm4PI",
            "fScale", "fScaleDepth", "fScaleOverScaleDepth",
            "g", "g2", "fExposure"
        ]
    });

let fOuterRadius = 100;
let fInnerRadius = 0;
let fScale = 1 / (fOuterRadius - fInnerRadius);
let fScaleDepth = 50000;
let Kr = 0.3;
let Km = 0.7;
let ESun = 10000;

shaderMaterial.setVector3("v3CameraPos", freeCamera.position);
shaderMaterial.setVector3("v3LightPos", light.position);
shaderMaterial.setFloat("fCameraHeight2", BABYLON.Vector3.Distance(freeCamera.position, cube.position));
shaderMaterial.setVector3("v3InvWavelength", new BABYLON.Vector3(1, 0.5, 0.3));
shaderMaterial.setFloat("fOuterRadius", fOuterRadius);
shaderMaterial.setFloat("fOuterRadius2", fOuterRadius ** 2);
shaderMaterial.setFloat("fInnerRadius", fInnerRadius);
shaderMaterial.setFloat("fInnerRadius2", fInnerRadius ** 2);
shaderMaterial.setFloat("fKrESun", Kr * ESun);
shaderMaterial.setFloat("fKmESun", Km * ESun);
shaderMaterial.setFloat("fKr4PI", Kr * 4 * Math.PI);
shaderMaterial.setFloat("fKm4PI", Km * 4 * Math.PI);
shaderMaterial.setFloat("fScale", 1 / (fOuterRadius - fInnerRadius));
shaderMaterial.setFloat("fScaleDepth", fScaleDepth);
shaderMaterial.setFloat("fScaleOverScaleDepth", fScale / fScaleDepth);
shaderMaterial.setFloat("g", 10.0);
shaderMaterial.setFloat("g2", 100.0);
shaderMaterial.setFloat("fExposure", 0.2);*/

let shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, "./shader2",
    {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldView", "worldViewProjection", "view",
            "projection", "v3CameraPos"]
    });

shaderMaterial.setVector3("v3CameraPos", freeCamera.position);

cube.material = shaderMaterial;



let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
});

document.addEventListener("keyup", e => {
    keyboard[e.key] = false;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    let t = 0;

    engine.runRenderLoop(() => {
        t += engine.getDeltaTime() / 1000;


        yolo.position = new BABYLON.Vector3(50 * Math.cos(t / 2), 0, 50 * Math.sin(t / 2));

        //shaderMaterial.setFloat("time", t);

        shaderMaterial.setVector3("v3CameraPos", freeCamera.position);
        shaderMaterial.setVector3("v3LightPos", light.position);



        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);

        let speed = 0.01;

        if (keyboard["z"]) freeCamera.position.addInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["s"]) freeCamera.position.subtractInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["q"]) freeCamera.position.subtractInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard["d"]) freeCamera.position.addInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard[" "]) freeCamera.position.addInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["Shift"]) freeCamera.position.subtractInPlace(upward.scale(speed * engine.getDeltaTime()));


        scene.render();
    });
});

