// App-side helpers for the profile photo: pick or take a photo, shrink it,
// and save it through the /api/profile route (stored in PostgreSQL).
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`Request to ${url} failed: ${response.status}`);
    }
    return response.json();
};

export const getProfile = () => request<Profile>("/api/profile");

export const removeAvatar = () => request<{ ok: true }>("/api/profile", { method: "DELETE" });

const uploadAvatar = (avatar: string) =>
    request<{ ok: true }>("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
    });

export type PhotoSource = "library" | "camera";

/**
 * Lets the user choose (or take) a photo, crops it square, shrinks it to 512px
 * and uploads it. Returns the saved photo as a data URI, or null if cancelled.
 */
export const pickAndUploadAvatar = async (source: PhotoSource): Promise<string | null> => {
    if (source === "camera") {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
            throw new Error("Camera permission is needed to take a profile photo.");
        }
    }

    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true, // lets the user crop
        aspect: [1, 1],      // square crop (iOS always crops square)
        quality: 1,
    };

    const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]) {
        return null;
    }

    // Phone photos are several MB; 512px wide is plenty for an avatar (~50KB)
    const image = await ImageManipulator.manipulate(result.assets[0].uri)
        .resize({ width: 512 })
        .renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });

    if (!saved.base64) {
        throw new Error("Could not process the photo.");
    }

    const avatar = `data:image/jpeg;base64,${saved.base64}`;
    await uploadAvatar(avatar);
    return avatar;
};
