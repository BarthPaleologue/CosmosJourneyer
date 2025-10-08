import type { FC } from "react";

interface RotatingCubeProps {
    faces: string[];
    className?: string;
}

export const RotatingCube: FC<RotatingCubeProps> = ({ faces, className = "" }) => {
    return (
        <div id="shared-loader" className={className}>
            <div className="cube">
                <div className="cube-face cube-face-front">{faces[0]}</div>
                <div className="cube-face cube-face-back">{faces[1]}</div>
                <div className="cube-face cube-face-top">{faces[2]}</div>
                <div className="cube-face cube-face-bottom">{faces[3]}</div>
            </div>
        </div>
    );
};
