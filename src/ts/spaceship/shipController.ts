import { Input, InputType } from "../controller/inputs/input";
import { UberCamera } from "../controller/uberCore/uberCamera";
import { AbstractController } from "../controller/uberCore/abstractController";
import { Assets } from "../controller/assets";
import { Keyboard } from "../controller/inputs/keyboard";
import { UberOrbitCamera } from "../controller/uberCore/uberOrbitCamera";
import { Mouse } from "../controller/inputs/mouse";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MainThruster } from "./mainThruster";
import { WarpDrive } from "./warpDrive";
import { parseSpeed } from "../utils/parseSpeed";
import { LOCAL_DIRECTION } from "../controller/uberCore/localDirections";
import { RCSThruster } from "./rcsThruster";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { IPhysicsCollisionEvent, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { getForwardDirection, pitch, roll, translate } from "../controller/uberCore/transforms/basicTransform";

export class ShipController extends AbstractController {
    readonly instanceRoot: AbstractMesh;

    readonly rollAuthority = 0.1;
    readonly pitchAuthority = 1;
    readonly yawAuthority = 1;

    readonly thirdPersonCamera: UberOrbitCamera;
    readonly firstPersonCamera: UberCamera;

    readonly aggregate: PhysicsAggregate;
    private readonly collisionObservable: Observable<IPhysicsCollisionEvent>;

    private flightAssistEnabled = true;

    private readonly mainThrusters: MainThruster[] = [];
    private readonly rcsThrusters: RCSThruster[] = [];

    private readonly warpDrive = new WarpDrive(false);

    private closestObject = {
        distance: Infinity,
        radius: 1
    }

    constructor(scene: Scene) {
        super();

        this.instanceRoot = Assets.CreateSpaceShipInstance();

        this.firstPersonCamera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.firstPersonCamera.parent = this.instanceRoot;
        this.firstPersonCamera.position = new Vector3(0, 1, 0);

        this.thirdPersonCamera = new UberOrbitCamera("thirdPersonCamera", Vector3.Zero(), scene, 30, 3.14, 1.4);
        this.thirdPersonCamera.parent = this.instanceRoot;


        this.aggregate = new PhysicsAggregate(this.instanceRoot
            , PhysicsShapeType.CONTAINER, { mass: 10, restitution: 0.2 }, scene);
        for (const child of this.instanceRoot.getChildMeshes()) {
            const childShape = new PhysicsShapeMesh(child as Mesh, scene);
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;

        this.aggregate.body.setCollisionCallbackEnabled(true);

        this.collisionObservable = this.aggregate.body.getCollisionObservable();
        this.collisionObservable.add((collisionEvent: IPhysicsCollisionEvent) => {
            console.log("Collision", collisionEvent);
            if (collisionEvent.impulse < 0.8) return;
            Assets.OuchSound.play();
        });

        //if(this.warpDrive.isEnabled()) setEnabledBody(this.aggregate.body, false, )

        for (const child of this.instanceRoot.getChildMeshes()) {
            if (child.name.includes("mainThruster")) {
                console.log("Found main thruster");
                this.addMainThruster(child);
            } else if (child.name.includes("rcsThruster")) {
                console.log("Found rcs thruster");
                this.addRCSThruster(child);
            }
        }
    }

    public override addInput(input: Input): void {
        super.addInput(input);
        if (input.type === InputType.KEYBOARD) {
            const keyboard = input as Keyboard;
            keyboard.addPressedOnceListener("f", () => {
                this.flightAssistEnabled = !this.flightAssistEnabled;
            });
            keyboard.addPressedOnceListener("h", () => {
                this.toggleWarpDrive();
            });
        }
    }

    private addMainThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        this.mainThrusters.push(new MainThruster(mesh, direction, this.aggregate));
    }

    private addRCSThruster(mesh: AbstractMesh) {
        const direction = mesh.getDirection(new Vector3(0, 1, 0));
        const thruster = new RCSThruster(mesh, direction, this.aggregate);
        this.rcsThrusters.push(thruster);

        //FIXME: this is temporary to balance rc thrust
        thruster.setMaxAuthority(thruster.getMaxAuthority() / thruster.leverage);
    }

    public override getActiveCamera(): UberCamera {
        return this.thirdPersonCamera;
    }

    public setEnabled(enabled: boolean, havokPlugin: HavokPlugin) {
        this.instanceRoot.setEnabled(enabled);
        setEnabledBody(this.aggregate.body, enabled, havokPlugin);
    }

    public registerClosestObject(distance: number, radius: number) {
        this.closestObject = { distance, radius };
    }

    public enableWarpDrive() {
        for(const thruster of this.mainThrusters) thruster.setThrottle(0);
        for(const thruster of this.rcsThrusters) thruster.deactivate();
        this.warpDrive.enable();
    }

    public toggleWarpDrive() {
        if (!this.warpDrive.isEnabled()) this.enableWarpDrive();
        else this.warpDrive.desengage();
    }

    protected override listenTo(input: Input, deltaTime: number): Vector3 {
        if (this.getActiveCamera() === this.thirdPersonCamera) {
            if (input.type === InputType.KEYBOARD) {
                const keyboard = input as Keyboard;
                const cameraRotationSpeed = 0.8 * deltaTime;
                if (keyboard.isPressed("1")) this.thirdPersonCamera.rotatePhi(cameraRotationSpeed);
                if (keyboard.isPressed("3")) this.thirdPersonCamera.rotatePhi(-cameraRotationSpeed);
                if (keyboard.isPressed("2")) this.thirdPersonCamera.rotateTheta(-cameraRotationSpeed);
                if (keyboard.isPressed("5")) this.thirdPersonCamera.rotateTheta(cameraRotationSpeed);
            }
        }

        if (this.warpDrive.isDisabled()) {
            for (const thruster of this.mainThrusters) {
                thruster.updateThrottle(2 * deltaTime * input.getZAxis() * thruster.getAuthority01(LOCAL_DIRECTION.FORWARD));
                thruster.updateThrottle(2 * deltaTime * -input.getZAxis() * thruster.getAuthority01(LOCAL_DIRECTION.BACKWARD));

                thruster.updateThrottle(2 * deltaTime * input.getYAxis() * thruster.getAuthority01(LOCAL_DIRECTION.UP));
                thruster.updateThrottle(2 * deltaTime * -input.getYAxis() * thruster.getAuthority01(LOCAL_DIRECTION.DOWN));

                thruster.updateThrottle(2 * deltaTime * input.getXAxis() * thruster.getAuthority01(LOCAL_DIRECTION.LEFT));
                thruster.updateThrottle(2 * deltaTime * -input.getXAxis() * thruster.getAuthority01(LOCAL_DIRECTION.RIGHT));
            }

            if(input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const roll = mouse.getRoll();
                const pitch = mouse.getPitch();

                //console.log(roll);

                for (const rcsThruster of this.rcsThrusters) {
                    let throttle = 0;

                    // rcs rotation contribution
                    if (roll < 0 && rcsThruster.getRollAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(roll));
                    else if (roll > 0 && rcsThruster.getRollAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(roll));
                    
                    if (pitch < 0 && rcsThruster.getPitchAuthorityNormalized() > 0.2) throttle = Math.max(throttle, Math.abs(pitch));
                    else if (pitch > 0 && rcsThruster.getPitchAuthorityNormalized() < -0.2) throttle = Math.max(throttle, Math.abs(pitch));

                    rcsThruster.setThrottle(throttle);
                }
            }
        } else {
            if(input.type === InputType.MOUSE) {
                const mouse = input as Mouse;
                const rollContribution = mouse.getRoll();
                const pitchContribution = mouse.getPitch();
                
                roll(this.aggregate.transformNode, rollContribution * deltaTime);
                pitch(this.aggregate.transformNode, pitchContribution * deltaTime);
            }

            const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());
            //this.aggregate.body.setLinearVelocity(warpSpeed);
            translate(this.aggregate.transformNode, warpSpeed.scale(deltaTime));
        }
        return Vector3.Zero();
    }

    public override update(deltaTime: number): Vector3 {
        for (const input of this.inputs) this.listenTo(input, deltaTime);
        //const displacement = this.transform.update(deltaTime).negate();

        const warpSpeed = getForwardDirection(this.aggregate.transformNode).scale(this.warpDrive.getWarpSpeed());//Vector3.Zero();
        
        const speed = Vector3.Zero();
        this.aggregate.body.getLinearVelocityToRef(speed);

        const currentForwardSpeed = Vector3.Dot(warpSpeed, this.aggregate.transformNode.getDirection(Axis.Z));
        this.warpDrive.update(currentForwardSpeed, this.closestObject.distance, this.closestObject.radius, deltaTime);

        for (const thruster of this.mainThrusters) thruster.update();
        for (const thruster of this.rcsThrusters) thruster.update();

        if(this.warpDrive.isDisabled()) {
            for (const thruster of this.mainThrusters) thruster.applyForce();
            for (const thruster of this.rcsThrusters) thruster.applyForce();    
        }

        if (this.flightAssistEnabled) {
            this.aggregate.body.setAngularDamping(0.9);
        } else {
            this.aggregate.body.setAngularDamping(1);
        }

        //TODO: should be separated from the ship
        (document.querySelector("#speedometer") as HTMLElement).innerHTML = `${parseSpeed(this.warpDrive.isEnabled() ? warpSpeed.length() : speed.length())}`;

        //this.transform.translate(displacement);
        return this.aggregate.transformNode.getAbsolutePosition();
    }
}
