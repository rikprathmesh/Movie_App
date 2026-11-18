// API route for the Profile screen: GET /api/stats → { savedCount, totalSearches, uniqueSearches }
import { getProfileStats } from "../../../services/db";

export async function GET() {
    try {
        return Response.json(await getProfileStats());
    } catch (error) {
        console.error("GET /api/stats failed:", error);
        return Response.json({ error: "Could not load stats" }, { status: 500 });
    }
}
