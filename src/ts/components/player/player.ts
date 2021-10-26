import { Keyboard } from "../inputs/keyboard";
import { Mouse } from "../inputs/mouse";

export class Player {

    firstPersonCamera: BABYLON.FreeCamera;
    thirdPersonCamera: BABYLON.ArcRotateCamera;

    activeCamera: BABYLON.Camera;

    private speed: number = 1;
    private rotationSpeed: number = Math.PI / 6;

    private controls = {
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

    /* #region directions */

    /**
     * 
     * @returns the unit vector pointing forward the player controler in world space
     */
    public getForwardDirection(): BABYLON.Vector3 {
        return this.mesh.getDirection(BABYLON.Axis.Z);
    }

    /**
     * 
     * @returns the unit vector pointing backward the player controler in world space
     */
    public getBackwardDirection(): BABYLON.Vector3 {
        return this.getForwardDirection().scale(-1);
    }

    /**
     * 
     * @returns the unit vector pointing upward the player controler in world space
     */
    public getUpwardDirection(): BABYLON.Vector3 {
        return this.mesh.getDirection(BABYLON.Axis.Y);
    }

    /**
     * 
     * @returns the unit vector pointing downward the player controler in world space
     */
    public getDownwardDirection(): BABYLON.Vector3 {
        return this.getUpwardDirection().scale(-1);
    }

    /**
     * 
     * @returns the unit vector pointing to the right of the player controler in world space
     */
    public getRightDirection(): BABYLON.Vector3 {
        return this.mesh.getDirection(BABYLON.Axis.X);
    }

    /**
     * 
     * @returns the unit vector pointing to the left of the player controler in world space
     */
    public getLeftDirection(): BABYLON.Vector3 {
        return this.getRightDirection().scale(-1);
    }
    /* #endregion directions */

    /**
     * Set new speed for player controler
     * @param newSpeed the new speed value
     */
    public setSpeed(newSpeed: number) {
        this.speed = newSpeed;
    }

    /**
     * Listens to keyboard, rotate the player accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param keyboard the keyboard to listen to
     * @param deltaTime the time between 2 frames
     * @returns the displacement of the player to apply to every other mesh
     */
    public listenToKeyboard(keyboard: Keyboard, deltaTime: number): BABYLON.Vector3 {
        // Update Rotation state
        if (keyboard.isPressed(this.controls.rollLeftKey)) { // rotation autour de l'axe de déplacement
            this.mesh.rotate(this.getForwardDirection(), this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        } else if (keyboard.isPressed(this.controls.rollRightKey)) {
            this.mesh.rotate(this.getForwardDirection(), -this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        }

        if (keyboard.isPressed(this.controls.pitchUpKey)) {
            this.mesh.rotate(this.getRightDirection(), -this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        } else if (keyboard.isPressed(this.controls.picthDownKey)) {
            this.mesh.rotate(this.getRightDirection(), this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        }

        if (keyboard.isPressed(this.controls.yawLeftKey)) {
            this.mesh.rotate(this.getUpwardDirection(), -this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        } else if (keyboard.isPressed(this.controls.yawRightKey)) {
            this.mesh.rotate(this.getUpwardDirection(), this.rotationSpeed * deltaTime, BABYLON.Space.WORLD);
        }

        // Update displacement state
        let deplacement = BABYLON.Vector3.Zero();

        let forwardDeplacement = this.getForwardDirection().scale(this.speed * deltaTime);
        let upwardDeplacement = this.getUpwardDirection().scale(this.speed * deltaTime);
        let rightDeplacement = this.getRightDirection().scale(this.speed * deltaTime);

        if (keyboard.isAnyPressed(this.controls.forwardKeys)) deplacement.subtractInPlace(forwardDeplacement);
        if (keyboard.isAnyPressed(this.controls.backwardKeys)) deplacement.addInPlace(forwardDeplacement);
        if (keyboard.isAnyPressed(this.controls.leftKeys)) deplacement.addInPlace(rightDeplacement);
        if (keyboard.isAnyPressed(this.controls.rightKeys)) deplacement.subtractInPlace(rightDeplacement);
        if (keyboard.isAnyPressed(this.controls.upKeys)) deplacement.subtractInPlace(upwardDeplacement);
        if (keyboard.isAnyPressed(this.controls.downKeys)) deplacement.addInPlace(upwardDeplacement);

        if (keyboard.isPressed("+")) this.speed *= 1.1;
        if (keyboard.isPressed("-")) this.speed /= 1.1;
        if (keyboard.isPressed("8")) this.speed = 30;

        return deplacement;
    }

    /**
     * Listens to mouse and rotate player accordingly
     * @param mouse the mouse to listen to
     */
    public listenToMouse(mouse: Mouse): void {
        // Update Rotation state
        // TODO : use deltaTime here too
        this.mesh.rotate(this.getRightDirection(), 0.1 * this.rotationSpeed * mouse.getDYToCenter() / Math.max(window.innerWidth, window.innerHeight), BABYLON.Space.WORLD);
        this.mesh.rotate(this.getUpwardDirection(), 0.1 * this.rotationSpeed * mouse.getDXToCenter() / Math.max(window.innerWidth, window.innerHeight), BABYLON.Space.WORLD);
    }


}