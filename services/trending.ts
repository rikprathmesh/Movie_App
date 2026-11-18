// App-side helpers: call the /api/trending route, which talks to PostgreSQL.
// In development, relative URLs like "/api/trending" go to the Expo dev server.

// Records a search so it can count towards Trending Movies
export const updateSearchCount = async (query: string, movie: Movie) => {
    const response = await fetch("/api/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            searchTerm: query,
            movie: { id: movie.id, title: movie.title, poster_path: movie.poster_path },
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to save search: ${response.status}`);
    }
};

// Top 5 most-searched movies (returns undefined on failure so the home screen still works)
export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
    try {
        const response = await fetch("/api/trending");
        if (!response.ok) {
            throw new Error(`Failed to load trending movies: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn("Error fetching trending movies:", error);
        return undefined;
    }
};
