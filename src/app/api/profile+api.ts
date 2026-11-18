// API route for the profile photo: runs on the Expo dev server (your laptop), not on the phone.
//   GET    /api/profile   → { avatar: "data:image/jpeg;base64,..." | null }
//   PUT    /api/profile   body: { avatar: "data:image/jpeg;base64,..." }
//   DELETE /api/profile   → remove the photo
import { getProfile, setAvatar } from "../../../services/db";

// The app resizes photos to 512px before upload (~50KB). Anything far bigger is a mistake.
const MAX_AVATAR_LENGTH = 2_000_000;
const DATA_URI_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function GET() {
    try {
        return Response.json(await getProfile());
    } catch (error) {
        console.error("GET /api/profile failed:", error);
        return Response.json({ error: "Could not load profile" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { avatar } = await request.json();

        if (typeof avatar !== "string" || !DATA_URI_PATTERN.test(avatar)) {
            return Response.json({ error: "avatar must be a base64 image data URI" }, { status: 400 });
        }
        if (avatar.length > MAX_AVATAR_LENGTH) {
            return Response.json({ error: "Photo is too large" }, { status: 413 });
        }

        await setAvatar(avatar);
        return Response.json({ ok: true });
    } catch (error) {
        console.error("PUT /api/profile failed:", error);
        return Response.json({ error: "Could not save photo" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await setAvatar(null);
        return Response.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/profile failed:", error);
        return Response.json({ error: "Could not remove photo" }, { status: 500 });
    }
}
