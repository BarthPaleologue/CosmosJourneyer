import { CubicEase, EasingFunction } from "@babylonjs/core/Animations/easing";
import { Animation } from "@babylonjs/core/Animations/animation";

/**
 * Quick and dirty way to set up an animation and play it immediately.
 * @param targetObject The object to animate.
 * @param whichprop The property to animate.
 * @param initialValue The initial value of the property.
 * @param targetval The target value of the property.
 * @param speed The speed of the animation.
 * @see https://forum.babylonjs.com/t/how-to-build-animation-for-arcrotatecamera-so-it-can-rotate-smoothly/25698/4
 */
export function quickAnimation<K, T>(targetObject: K, whichprop: string, initialValue: T, targetval: T, speed: number) {
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    Animation.CreateAndStartAnimation(
        "quickAnimation",
        targetObject,
        whichprop,
        speed,
        120,
        initialValue,
        targetval,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
        ease
    );
}
