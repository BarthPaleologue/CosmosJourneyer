export interface RoadmapItem {
    id: string;
    title: string;
    eta: string;
    description: string;
    content: {
        image: {
            src: string;
            alt: string;
            width: number;
            height?: number;
        };
        paragraphs: string[];
        subsections?: {
            title: string;
            content: string;
        }[];
    };
}

export interface SocialLink {
    id: string;
    name: string;
    url: string;
    icon: {
        src: string;
        alt: string;
    };
    title: string;
}

export interface ViewProps {
    className?: string;
    id?: string;
}

export interface ScrollDirection {
    top: number;
    behavior: "smooth" | "auto" | "instant";
}

export interface FAQItem {
    id: string;
    question: string;
    answer: string | readonly string[];
}
