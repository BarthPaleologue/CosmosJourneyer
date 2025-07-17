import { Animation } from "@babylonjs/core/Animations/animation";
import { CubicEase, EasingFunction } from "@babylonjs/core/Animations/easing";
import { type ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

/**
 * Quick and dirty way to set up an animation and play it immediately.
 * @param targetObject The object to animate.
 * @param whichProp The property to animate.
 * @param initialValue The initial value of the property.
 * @param targetValue The target value of the property.
 * @param speed The speed of the animation.
 * @see https://forum.babylonjs.com/t/how-to-build-animation-for-arcrotatecamera-so-it-can-rotate-smoothly/25698/4
 */
export function quickAnimation<T>(
    targetObject: ArcRotateCamera,
    whichProp: string,
    initialValue: T,
    targetValue: T,
    speed: number,
) {
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    Animation.CreateAndStartAnimation(
        "quickAnimation",
        targetObject,
        whichProp,
        speed,
        120,
        initialValue,
        targetValue,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
        ease,
    );
}
