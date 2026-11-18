export const TMDB_CONFIG = {
    BASE_URL: "https://api.themoviedb.org/3",
    API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
    headers: {
        accept: "application/json",
        authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
    }
}

// GET a TMDB URL, giving up after 10 seconds so a blocked or slow network
// shows an error instead of loading forever
const tmdbGet = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: TMDB_CONFIG.headers,
            signal: controller.signal,
        });
    } catch (err) {
        if (controller.signal.aborted) {
            throw new Error("Request timed out: could not reach api.themoviedb.org. Check your network or DNS settings.");
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const fetchMovies = async ({query}: {query: string}): Promise<Movie[]> => {
    const endPoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    :`${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;

    const data = await tmdbGet(endPoint);
    return data.results
}

export const fetchMovieDetails = async (movieId: string): Promise<MovieDetails> => {
    return tmdbGet(`${TMDB_CONFIG.BASE_URL}/movie/${encodeURIComponent(movieId)}`);
}
