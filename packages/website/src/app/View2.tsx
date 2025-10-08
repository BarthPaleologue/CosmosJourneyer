//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

"use client";

import type { FC } from "react";

import { FaqItems } from "@/utils/constants";

import { FAQ } from "@/components/FAQ";
import { RotatingCube } from "@/components/RotatingCube";
import { ScrollArrow } from "@/components/ScrollArrow";
import { useScrollTo } from "@/hooks/useScrollTo";

export interface View2Props {
    className?: string;
}

const CUBE_FACES = ["Free Forever", "Curiosity Driven", "Open Source", "Labor of Love"];

export const View2: FC<View2Props> = ({ className = "" }) => {
    const { scrollToView } = useScrollTo();

    return (
        <div className={`fullView ${className}`} id="view2">
            <div className="view2Background">
                <ScrollArrow
                    direction="up"
                    onClick={() => {
                        scrollToView(1);
                    }}
                    ariaLabel="Scroll to previous section"
                />

                <RotatingCube faces={CUBE_FACES} />

                <FAQ items={FaqItems} />

                <footer>{/* Footer content can be added here */}</footer>
            </div>
        </div>
    );
};
