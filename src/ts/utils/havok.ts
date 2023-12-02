import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";

/**
 *
 * @param body
 * @param enabled
 * @param havokPlugin
 * @see https://forum.babylonjs.com/t/havok-setenabled-on-body-shape/40818
 */
export function setEnabledBody(body: PhysicsBody, enabled: boolean, havokPlugin: HavokPlugin): void {
    if (enabled) havokPlugin._hknp.HP_World_AddBody(havokPlugin.world, body._pluginData.hpBodyId, body.startAsleep);
    else havokPlugin._hknp.HP_World_RemoveBody(havokPlugin.world, body._pluginData.hpBodyId);
}

/**
 * Hack to change the limits on max velocity. Pass in the BABYLON.HavokPlugin(), before creating any bodies
 * @param havokPlugin
 * @param maxLinVel
 * @param maxAngVel
 * @see https://forum.babylonjs.com/t/how-to-enable-faster-moving-rigidbodies-in-havok/40631/7
 */
export function setMaxLinVel(havokPlugin: HavokPlugin, maxLinVel: number, maxAngVel: number) {
    const heap = havokPlugin._hknp.HEAP8.buffer;
    const world1 = new Int32Array(heap, Number(havokPlugin.world), 100);
    const world2 = new Int32Array(heap, world1[8], 500);
    const mplib = new Int32Array(heap, world2[428], 100);
    const tsbuf = new Float32Array(heap, mplib[8], 300);

    tsbuf[32] = maxLinVel;
    tsbuf[33] = maxAngVel;
    tsbuf[60] = maxLinVel;
    tsbuf[61] = maxAngVel;
    tsbuf[88] = maxLinVel;
    tsbuf[89] = maxAngVel;
    tsbuf[144] = maxLinVel;
    tsbuf[145] = maxAngVel;
    tsbuf[172] = maxLinVel;
    tsbuf[173] = maxAngVel;
    tsbuf[200] = maxLinVel;
    tsbuf[201] = maxAngVel;
    tsbuf[228] = maxLinVel;
    tsbuf[229] = maxAngVel;
}
