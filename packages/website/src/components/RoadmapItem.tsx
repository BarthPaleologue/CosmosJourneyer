import Image from "next/image";
import React from "react";

import { RoadmapItem } from "@/types";

interface RoadmapItemComponentProps {
    item: RoadmapItem;
}

export const RoadmapItemComponent: React.FC<RoadmapItemComponentProps> = ({ item }) => {
    return (
        <div className="roadmapItem">
            <h3>{item.title}</h3>
            <p className="roadmapEta">{item.eta}</p>

            <div className="roadmapItemContent">
                <Image
                    className="roadmapImage"
                    src={item.content.image.src}
                    alt={item.content.image.alt}
                    width={item.content.image.width}
                    height={item.content.image.height ?? 270}
                />

                {item.content.paragraphs.map((paragraph, index) => (
                    <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
                ))}

                {item.content.subsections?.map((subsection, index) => (
                    <div key={index} className="roadmap-subsection">
                        <h4>{subsection.title}</h4>
                        <p dangerouslySetInnerHTML={{ __html: subsection.content }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
