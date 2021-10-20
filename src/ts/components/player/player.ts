export class Player {

    firstPersonCamera: BABYLON.FreeCamera;
    thirdPersonCamera: BABYLON.ArcRotateCamera;

    activeCamera: BABYLON.Camera;

    speed: number = 1;
    rotationSpeed: number = Math.PI / 6;

    readonly controls = {
        upKeys: [" "],
        downKeys: ["Shift"],
        forwardKeys: ["z", "Z"],
        leftKeys: ["q", "Q"],
        backwardKeys: ["s", "S"],
        rightKeys: ["d", "D"],

        rollLeftKey: "a",
        rollRightKey: "e",

        pitchUpKey: "i",
        picthDownKey: "k",

        yawLeftKey: "j",
        yawRightKey: "l",
    };

    readonly mesh: BABYLON.Mesh;

    constructor(scene: BABYLON.Scene) {
        this.mesh = BABYLON.Mesh.CreateBox("player", 1, scene);
        let mat = new BABYLON.StandardMaterial("mat", scene);
        mat.emissiveColor = BABYLON.Color3.White();
        this.mesh.material = mat;

        this.firstPersonCamera = new BABYLON.FreeCamera("firstPersonCamera", BABYLON.Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.mesh;

        this.thirdPersonCamera = new BABYLON.ArcRotateCamera("thirdPersonCamera", 0, 0, 5, this.mesh.position, scene);
        this.thirdPersonCamera.parent = this.mesh;
        this.thirdPersonCamera.attachControl(scene.getEngine().getRenderingCanvas());

        this.activeCamera = this.firstPersonCamera;
    }

    public getForwardDirection(): BABYLON.Vector3 {
        return this.mesh.getDirection(BABYLON.Axis.Z);
    }

    public getUpwardDirection(): BABYLON.Vector3 {
        return this.mesh.getDirection(BABYLON.Axis.Y);
    }

    public getRightDirection(): BABYLON.Vector3 {
        return this.mesh.getDirection(BABYLON.Axis.X);
    }

    private isAnyOfKeysPressed(keys: string[], keyboard: { [key: string]: boolean; }): boolean {
        for (const key of keys) {
            if (keyboard[key]) return true;
        }
        return false;
    }

    public listenToKeyboard(keyboard: { [key: string]: boolean; }, deltaTime: number): BABYLON.Vector3 {
        // Update Rotation state
        if (keyboard[this.controls.rollLeftKey]) { // rotation autour de l'axe de déplacement
            this.mesh.rotate(this.getForwardDirection(), this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        } else if (keyboard[this.controls.rollRightKey]) {
            this.mesh.rotate(this.getForwardDirection(), -this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        }

        if (keyboard[this.controls.pitchUpKey]) {
            this.mesh.rotate(this.getRightDirection(), -this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        } else if (keyboard[this.controls.picthDownKey]) {
            this.mesh.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        }

        if (keyboard[this.controls.yawLeftKey]) {
            this.mesh.rotate(this.getUpwardDirection(), -this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        } else if (keyboard[this.controls.yawRightKey]) {
            this.mesh.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        }

        // Update displacement state

        let deplacement = BABYLON.Vector3.Zero();

        let forwardDeplacement = this.getForwardDirection().scale(this.speed * deltaTime);
        let upwardDeplacement = this.getUpwardDirection().scale(this.speed * deltaTime);
        let rightDeplacement = this.getRightDirection().scale(this.speed * deltaTime);

        if (this.isAnyOfKeysPressed(this.controls.forwardKeys, keyboard)) deplacement.subtractInPlace(forwardDeplacement);
        if (this.isAnyOfKeysPressed(this.controls.backwardKeys, keyboard)) deplacement.addInPlace(forwardDeplacement);
        if (this.isAnyOfKeysPressed(this.controls.leftKeys, keyboard)) deplacement.addInPlace(rightDeplacement);
        if (this.isAnyOfKeysPressed(this.controls.rightKeys, keyboard)) deplacement.subtractInPlace(rightDeplacement);
        if (this.isAnyOfKeysPressed(this.controls.upKeys, keyboard)) deplacement.subtractInPlace(upwardDeplacement);
        if (this.isAnyOfKeysPressed(this.controls.downKeys, keyboard)) deplacement.addInPlace(upwardDeplacement);

        if (keyboard["+"]) this.speed *= 1.1;
        if (keyboard["-"]) this.speed /= 1.1;
        if (keyboard["8"]) this.speed = 30;

        return deplacement;
    }


}