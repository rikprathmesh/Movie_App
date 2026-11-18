import "react-native-url-polyfill/auto";
import { Client, ID, Query, TablesDB } from "react-native-appwrite";

// Must match the Android package / iOS bundle identifier in app.json,
// and be registered as a platform in the Appwrite Console.
const APPWRITE_PLATFORM = "com.movieflix.app";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!;

export const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
    .setPlatform(APPWRITE_PLATFORM);

// TablesDB replaces the older Databases API used in the video
// (tables = collections, rows = documents, columns = attributes)
const tablesDB = new TablesDB(client);

// Sends a test request to Appwrite to check the connection and project setup
export const pingAppwrite = () => client.ping();

// Records a search: adds 1 to the count if this search term was seen before,
// otherwise saves a new row with the first matching movie
export const updateSearchCount = async (query: string, movie: Movie) => {
    try {
        const result = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            queries: [Query.equal("searchTerm", query)],
        });

        if (result.rows.length > 0) {
            const existingRow = result.rows[0];
            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
                rowId: existingRow.$id,
                data: { count: existingRow.count + 1 },
            });
        } else {
            await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
                rowId: ID.unique(),
                data: {
                    searchTerm: query,
                    movie_id: movie.id,
                    title: movie.title,
                    count: 1,
                    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                },
            });
        }
    } catch (error) {
        console.error("Error updating search count:", error);
        throw error;
    }
};

// Top 5 most-searched movies, highest count first
export const getTrendingMovies = async (): Promise<TrendingMovie[] | undefined> => {
    try {
        const result = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            queries: [Query.limit(5), Query.orderDesc("count")],
        });

        return result.rows as unknown as TrendingMovie[];
    } catch (error) {
        console.error("Error fetching trending movies:", error);
        return undefined;
    }
};
