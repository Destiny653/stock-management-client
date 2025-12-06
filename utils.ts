export function createPageUrl(path: string): string {
    if (path.startsWith('/')) {
        return path;
    }
    return `/${path}`;
}
