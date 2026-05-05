// this page handle the image path for vehicles and new vehicles and all other images in the project

/**
 * Unified image URL helper.
 *
 * The backend stores image paths as relative strings like "/uploads/vehicles/foo.jpg".
 * This utility prepends the correct API origin so it works in any environment
 * without hardcoding "localhost:5000" all over the codebase.
 *
 * The base URL is derived from the Vite env variable VITE_API_URL (set in .env),
 * falling back to http://localhost:5000 for local development.
 */

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

/**
 * Convert a relative server image path to an absolute URL.
 *
 * @param {string|null|undefined} path - Relative path e.g. "/uploads/vehicles/foo.jpg"
 * @returns {string|null} Absolute URL, or null when path is empty / undefined
 */
export function getImageUrl(path) {
    if (!path) return null;
    // Already an absolute URL — return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
