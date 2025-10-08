import Image from "next/image";

import { handleExternalLink, handleKeyPress } from "@/utils";

import type { SocialLink } from "@/types";

interface SocialLinksProps {
    links: SocialLink[];
    className?: string;
}

export const SocialLinks = ({ links, className = "" }: SocialLinksProps) => {
    return (
        <div id="secondaryButtons" className={className}>
            {links.map((link) => (
                <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.title}
                    id={`${link.id}Button`}
                    onClick={(e) => {
                        e.preventDefault();
                        handleExternalLink(link.url);
                    }}
                    onKeyDown={(e) => {
                        handleKeyPress(() => {
                            handleExternalLink(link.url);
                        }, e);
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <Image src={link.icon.src} alt={link.icon.alt} width={30} height={30} loading="lazy" />
                    <span className="sr-only">{link.title}</span>
                </a>
            ))}
        </div>
    );
};
