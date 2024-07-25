export interface Tutorial<ContextType> {
    title: string;
    coverImageSrc: string;
    description: string;
    getContentPanelsHtml(context: ContextType): string[];
}