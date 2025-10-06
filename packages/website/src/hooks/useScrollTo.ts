import { useCallback } from "react";

import { ScrollDirection } from "@/types";

export const useScrollTo = () => {
    const scrollTo = useCallback((options: ScrollDirection) => {
        window.scrollTo(options);
    }, []);

    const scrollToView = useCallback(
        (viewIndex: number) => {
            scrollTo({
                top: window.innerHeight * viewIndex,
                behavior: "smooth",
            });
        },
        [scrollTo],
    );

    const scrollToTop = useCallback(() => {
        scrollToView(0);
    }, [scrollToView]);

    const scrollToNext = useCallback(
        (currentView: number) => {
            scrollToView(currentView + 1);
        },
        [scrollToView],
    );

    return {
        scrollTo,
        scrollToView,
        scrollToTop,
        scrollToNext,
    };
};
