export function createPageUrl(path: string): string {
    if (path.startsWith('/')) {
        return path;
    }
    return `/${path}`;
}

/**
 * Converts a backend-relative image URL to an absolute URL.
 * Backend returns paths like `/uploads/products/image.jpg` which are
 * served by the backend server, not the frontend.
 */
export function getImageUrl(imageUrl: string | undefined): string | undefined {
    if (!imageUrl) return undefined;

    // Already an absolute URL (external or full path)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Relative path from backend - prepend backend base URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}${imageUrl}`;
}
