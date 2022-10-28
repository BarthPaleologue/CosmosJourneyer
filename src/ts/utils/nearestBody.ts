import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { AbstractBody } from "../bodies/abstractBody";

export function nearestBody(object: ITransformLike, bodies: AbstractBody[]): AbstractBody {
    let distance = -1;
    if (bodies.length == 0) throw new Error("no bodieees !");
    let nearest = bodies[0];
    for (const body of bodies) {
        const newDistance = object.getAbsolutePosition().subtract(body.transform.getAbsolutePosition()).length();
        if (distance == -1 || newDistance < distance) {
            nearest = body;
            distance = newDistance;
        }
    }
    return nearest;
}
