import { Vector3, Quaternion } from "@babylonjs/core";
import {Algebra} from "../utils/algebra";
import {CelestialBodyType, Transformable} from "./interfaces";
import {PlayerController} from "../player/playerController";

//TODO: en faire une interface ici la classe abstraite n'apporte rien
export abstract class CelestialBody implements Transformable {
    protected abstract bodyType: CelestialBodyType;
    protected constructor() {

    }

    public abstract getName(): string;
    public abstract setAbsolutePosition(newPosition: Vector3): void;
    public abstract getAbsolutePosition(): Vector3;
    public abstract getRotationQuaternion(): Quaternion;
    public getBodyType(): CelestialBodyType {
        return this.bodyType;
    }
    public abstract getRadius(): number;
    public abstract update(player: PlayerController, lightPosition: Vector3): void;

    public getOriginBodySpaceSamplePosition(): Vector3 {
        let position = this.getAbsolutePosition().clone(); // position de la planète / au joueur
        position.scaleInPlace(-1); // position du joueur / au centre de la planète

        // on applique le quaternion inverse pour obtenir le sample point correspondant à la planète rotatée (fais un dessin si c'est pas clair)
        Algebra.applyQuaternionInPlace(Quaternion.Inverse(this.getRotationQuaternion()), position);

        return position;
    }

    public abstract translate(displacement: Vector3): void;

    public abstract rotateAround(pivot: Vector3, axis: Vector3, amount: number): void;

    public abstract rotate(axis: Vector3, amount: number): void;
}
