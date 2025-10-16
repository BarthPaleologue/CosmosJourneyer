// From https://github.com/BabylonJS/Babylon.js/blob/868aef32d2296adbf73b4c4df282dca3732f984a/packages/dev/core/src/Materials/floatingOriginMatrixOverrides.ts

import type { IMatrixLike, IVector3Like } from "@babylonjs/core/Maths/math.like";
import type { Matrix } from "@babylonjs/core/Maths/math.vector";
import type { DeepImmutable } from "@babylonjs/core/types";

export function OffsetWorldToRef(
    offset: IVector3Like,
    world: DeepImmutable<Matrix>,
    ref: Matrix,
): DeepImmutable<IMatrixLike> {
    ref.copyFrom(world);
    const refArray = ref.asArray();
    refArray[12] -= offset.x;
    refArray[13] -= offset.y;
    refArray[14] -= offset.z;
    return ref;
}

export function OffsetViewToRef(view: DeepImmutable<Matrix>, ref: Matrix): DeepImmutable<Matrix> {
    ref.copyFrom(view);
    const refArray = ref.asArray();
    refArray[12] = 0;
    refArray[13] = 0;
    refArray[14] = 0;
    return ref;
}
