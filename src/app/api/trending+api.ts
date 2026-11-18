// API route: runs on the Expo dev server (your laptop), not on the phone.
// The app calls it at /api/trending.
import { getTopSearches, recordSearch } from "../../../services/db";

// GET /api/trending → top 5 most-searched movies
export async function GET() {
    try {
        const movies = await getTopSearches();
        return Response.json(movies);
    } catch (error) {
        console.error("GET /api/trending failed:", error);
        return Response.json({ error: "Could not load trending movies" }, { status: 500 });
    }
}

// POST /api/trending  body: { searchTerm, movie: { id, title, poster_path } }
export async function POST(request: Request) {
    try {
        const { searchTerm, movie } = await request.json();

        if (typeof searchTerm !== "string" || !searchTerm.trim() || typeof movie?.id !== "number" || typeof movie?.title !== "string") {
            return Response.json({ error: "searchTerm and movie { id, title } are required" }, { status: 400 });
        }

        await recordSearch(searchTerm, movie);
        return Response.json({ ok: true });
    } catch (error) {
        console.error("POST /api/trending failed:", error);
        return Response.json({ error: "Could not save search" }, { status: 500 });
    }
}
