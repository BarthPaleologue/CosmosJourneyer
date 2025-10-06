import { handleKeyPress, scrollToSection, scrollToTop } from "@/utils";

interface ScrollArrowProps {
    direction: "up" | "down";
    targetSection?: number;
    onClick?: () => void;
    className?: string;
    ariaLabel?: string;
}

export const ScrollArrow = ({ direction, targetSection, onClick, className = "", ariaLabel }: ScrollArrowProps) => {
    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (direction === "up") {
            scrollToTop();
        } else if (targetSection !== undefined) {
            scrollToSection(targetSection);
        }
    };

    const defaultAriaLabel = direction === "up" ? "Scroll to top" : "Scroll to next section";

    return (
        <div
            className={`${direction === "up" ? "topArrow" : "downArrow"} ${className}`}
            onClick={handleClick}
            onKeyDown={(e) => handleKeyPress(handleClick, e)}
            role="button"
            tabIndex={0}
            aria-label={ariaLabel || defaultAriaLabel}
        />
    );
};
