// App-side movie helpers. They call our own API (/api/movies), which calls TMDB on
// the server (see services/tmdb.ts). In development, "/api/..." goes to the Expo dev
// server; in the APK it goes to the origin in app.json (the Vercel deployment).

// GET one of our API URLs, giving up after 15 seconds so a bad network shows an
// error instead of loading forever
const apiGet = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
        response = await fetch(url, { signal: controller.signal });
    } catch (err) {
        if (controller.signal.aborted) {
            throw new Error("Request timed out. Check your internet connection.");
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed: ${response.status}`);
    }

    return response.json();
};

export const fetchMovies = async ({ query }: { query: string }): Promise<Movie[]> => {
    const trimmed = query.trim();
    return apiGet(trimmed ? `/api/movies?query=${encodeURIComponent(trimmed)}` : "/api/movies");
};

export const fetchMovieDetails = async (movieId: string): Promise<MovieDetails> => {
    return apiGet(`/api/movies/${encodeURIComponent(movieId)}`);
};
