// GET /api/movies            → popular movies (TMDB discover)
// GET /api/movies?query=...  → search results
import { tmdbErrorResponse, tmdbGet } from "../../../services/tmdb";

export async function GET(request: Request) {
    const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
    const path = query
        ? `/search/movie?query=${encodeURIComponent(query)}`
        : `/discover/movie?sort_by=popularity.desc`;

    try {
        const data = await tmdbGet(path);
        return Response.json(data.results ?? []);
    } catch (error) {
        console.error("GET /api/movies failed:", error);
        return tmdbErrorResponse(error);
    }
}
