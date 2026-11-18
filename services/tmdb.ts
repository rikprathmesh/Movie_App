// SERVER-ONLY: imported only by API routes (src/app/api/movies*). The app never
// calls TMDB directly. It asks our own API (Vercel), which calls TMDB. That way:
//  - it works on networks that block TMDB (e.g. Jio mobile data / DNS)
//  - the TMDB token stays on the server instead of inside the APK
//
// Token: TMDB_API_KEY (set in Vercel → Settings → Environment Variables).
// Falls back to EXPO_PUBLIC_MOVIE_API_KEY from .env for local development.
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const getToken = () => process.env.TMDB_API_KEY ?? process.env.EXPO_PUBLIC_MOVIE_API_KEY;

export class TmdbError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

// GET a TMDB path, giving up after 10 seconds
export const tmdbGet = async (path: string) => {
    const token = getToken();
    if (!token) {
        throw new TmdbError(500, "TMDB_API_KEY is not set on the server");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(`${TMDB_BASE_URL}${path}`, {
            headers: { accept: "application/json", authorization: `Bearer ${token}` },
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new TmdbError(response.status, `TMDB request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (controller.signal.aborted) {
            throw new TmdbError(504, "TMDB did not respond in time");
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

// Turns any error into a JSON response for the API routes
export const tmdbErrorResponse = (error: unknown) => {
    const status = error instanceof TmdbError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Could not load movies";
    return Response.json({ error: message }, { status });
};
