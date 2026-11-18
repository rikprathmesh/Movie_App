// API route for bookmarks: runs on the Expo dev server (your laptop), not on the phone.
//   GET    /api/saved          → all saved movies, newest first
//   GET    /api/saved?id=123   → { saved: true | false } for one movie
//   POST   /api/saved          body: { id, title, poster_path, vote_average, release_date }
//   DELETE /api/saved?id=123   → remove one movie
import { getSavedMovies, isMovieSaved, removeSavedMovie, saveMovie } from "../../../services/db";

const getIdParam = (request: Request) => {
    const id = Number(new URL(request.url).searchParams.get("id"));
    return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(request: Request) {
    try {
        if (new URL(request.url).searchParams.has("id")) {
            const id = getIdParam(request);
            if (id === null) return Response.json({ error: "Invalid id" }, { status: 400 });
            return Response.json({ saved: await isMovieSaved(id) });
        }
        return Response.json(await getSavedMovies());
    } catch (error) {
        console.error("GET /api/saved failed:", error);
        return Response.json({ error: "Could not load saved movies" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const movie = await request.json();
        if (typeof movie?.id !== "number" || typeof movie?.title !== "string") {
            return Response.json({ error: "id and title are required" }, { status: 400 });
        }
        await saveMovie({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ?? null,
            vote_average: typeof movie.vote_average === "number" ? movie.vote_average : 0,
            release_date: movie.release_date ?? null,
        });
        return Response.json({ ok: true });
    } catch (error) {
        console.error("POST /api/saved failed:", error);
        return Response.json({ error: "Could not save movie" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const id = getIdParam(request);
        if (id === null) return Response.json({ error: "Invalid id" }, { status: 400 });
        await removeSavedMovie(id);
        return Response.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/saved failed:", error);
        return Response.json({ error: "Could not remove movie" }, { status: 500 });
    }
}
