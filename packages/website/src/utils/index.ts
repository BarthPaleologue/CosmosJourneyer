import type { KeyboardEvent, MouseEvent } from "react";

import type { ScrollDirection } from "@/types";

export const smoothScrollTo = (options: ScrollDirection): void => {
    window.scrollTo(options);
};

export const scrollToTop = (): void => {
    smoothScrollTo({
        top: 0,
        behavior: "smooth",
    });
};

export const scrollToSection = (sectionIndex: number): void => {
    smoothScrollTo({
        top: window.innerHeight * sectionIndex,
        behavior: "smooth",
    });
};

export const handleExternalLink = (url: string, event?: MouseEvent): void => {
    if (event) {
        event.preventDefault();
    }
    window.open(url, "_blank", "noopener,noreferrer");
};

// Accessibility helper for keyboard navigation
export const handleKeyPress = (callback: () => void, event: KeyboardEvent): void => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        callback();
    }
};

// Image optimization helper
export const getOptimizedImageProps = (src: string, alt: string, width?: number, height?: number) => ({
    src,
    alt,
    width: width ?? 480,
    height: height ?? undefined,
    loading: "lazy" as const,
    placeholder: "blur" as const,
    blurDataURL:
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
});
