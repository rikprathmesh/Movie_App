// App-side helpers for bookmarks and profile stats. They call the API routes in
// src/app/api/, which talk to PostgreSQL. In development, relative URLs like
// "/api/saved" go to the Expo dev server.

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`Request to ${url} failed: ${response.status}`);
    }
    return response.json();
};

export const getSavedMovies = () => request<SavedMovie[]>("/api/saved");

export const isMovieSaved = async (movieId: number) => {
    const { saved } = await request<{ saved: boolean }>(`/api/saved?id=${movieId}`);
    return saved;
};

export const saveMovie = (movie: SavedMovie) =>
    request<{ ok: true }>("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movie),
    });

export const removeSavedMovie = (movieId: number) =>
    request<{ ok: true }>(`/api/saved?id=${movieId}`, { method: "DELETE" });

export const getProfileStats = () => request<ProfileStats>("/api/stats");
