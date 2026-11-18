// GET /api/movies/:id → full movie details (TMDB /movie/:id)
import { tmdbErrorResponse, tmdbGet } from "../../../../services/tmdb";

export async function GET(_request: Request, { id }: { id: string }) {
    if (!/^\d+$/.test(id)) {
        return Response.json({ error: "Invalid movie id" }, { status: 400 });
    }

    try {
        return Response.json(await tmdbGet(`/movie/${id}`));
    } catch (error) {
        console.error(`GET /api/movies/${id} failed:`, error);
        return tmdbErrorResponse(error);
    }
}
