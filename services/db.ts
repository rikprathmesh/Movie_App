// SERVER-ONLY: imported only by API routes (src/app/api/*+api.ts), which run on the
// Expo dev server on your laptop. Never import this from a screen or component —
// it holds the database password.
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the tables the first time an API route runs (safe to run every time)
let tablesReady: Promise<unknown> | null = null;

const ensureTables = () => {
    if (!tablesReady) {
        tablesReady = pool.query(`
            CREATE TABLE IF NOT EXISTS trending_searches (
                id          SERIAL PRIMARY KEY,
                search_term TEXT        NOT NULL UNIQUE,
                movie_id    INTEGER     NOT NULL,
                title       TEXT        NOT NULL,
                count       INTEGER     NOT NULL DEFAULT 1,
                poster_url  TEXT        NOT NULL,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS saved_movies (
                movie_id     INTEGER PRIMARY KEY,
                title        TEXT             NOT NULL,
                poster_path  TEXT,
                vote_average DOUBLE PRECISION NOT NULL DEFAULT 0,
                release_date TEXT,
                saved_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
            );

            -- Single-user app: one profile row with id = 1.
            -- avatar holds the photo as a data URI ("data:image/jpeg;base64,...")
            CREATE TABLE IF NOT EXISTS profile (
                id         SMALLINT    PRIMARY KEY DEFAULT 1 CHECK (id = 1),
                avatar     TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        `).catch((error) => {
            tablesReady = null; // try again on the next request
            throw error;
        });
    }
    return tablesReady;
};

// ---------- Trending searches ----------

// Adds 1 to the count for this search term, or creates a new row on its first search
export const recordSearch = async (searchTerm: string, movie: { id: number; title: string; poster_path: string | null }) => {
    await ensureTables();
    await pool.query(
        `INSERT INTO trending_searches (search_term, movie_id, title, poster_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (search_term)
         DO UPDATE SET count = trending_searches.count + 1, updated_at = now()`,
        [
            searchTerm.trim().toLowerCase(),
            movie.id,
            movie.title,
            `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        ]
    );
};

// Top 5 most-searched movies, shaped like the app's TrendingMovie interface.
// Different searches can lead to the same movie ("avenger", "avengers"), so counts
// are added up per movie and each movie appears only once.
export const getTopSearches = async (): Promise<TrendingMovie[]> => {
    await ensureTables();
    const { rows } = await pool.query(
        `SELECT
            (array_agg(search_term ORDER BY count DESC))[1] AS "searchTerm",
            movie_id,
            max(title)            AS title,
            sum(count)::int       AS count,
            max(poster_url)       AS poster_url
         FROM trending_searches
         GROUP BY movie_id
         ORDER BY sum(count) DESC, max(updated_at) DESC
         LIMIT 5`
    );
    return rows;
};

// ---------- Saved movies (bookmarks) ----------

export const getSavedMovies = async (): Promise<SavedMovie[]> => {
    await ensureTables();
    const { rows } = await pool.query(
        `SELECT movie_id AS id, title, poster_path, vote_average, release_date
         FROM saved_movies
         ORDER BY saved_at DESC`
    );
    return rows;
};

export const isMovieSaved = async (movieId: number): Promise<boolean> => {
    await ensureTables();
    const { rowCount } = await pool.query(`SELECT 1 FROM saved_movies WHERE movie_id = $1`, [movieId]);
    return (rowCount ?? 0) > 0;
};

// Saving the same movie twice just keeps one row
export const saveMovie = async (movie: SavedMovie) => {
    await ensureTables();
    await pool.query(
        `INSERT INTO saved_movies (movie_id, title, poster_path, vote_average, release_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (movie_id) DO NOTHING`,
        [movie.id, movie.title, movie.poster_path, movie.vote_average ?? 0, movie.release_date]
    );
};

export const removeSavedMovie = async (movieId: number) => {
    await ensureTables();
    await pool.query(`DELETE FROM saved_movies WHERE movie_id = $1`, [movieId]);
};

// ---------- Profile photo ----------

export const getProfile = async (): Promise<Profile> => {
    await ensureTables();
    const { rows } = await pool.query(`SELECT avatar FROM profile WHERE id = 1`);
    return { avatar: rows[0]?.avatar ?? null };
};

// Pass null to remove the photo
export const setAvatar = async (avatar: string | null) => {
    await ensureTables();
    await pool.query(
        `INSERT INTO profile (id, avatar) VALUES (1, $1)
         ON CONFLICT (id) DO UPDATE SET avatar = EXCLUDED.avatar, updated_at = now()`,
        [avatar]
    );
};

// ---------- Profile stats ----------

export const getProfileStats = async (): Promise<ProfileStats> => {
    await ensureTables();
    const { rows } = await pool.query(
        `SELECT
            (SELECT count(*) FROM saved_movies)::int                     AS "savedCount",
            (SELECT coalesce(sum(count), 0) FROM trending_searches)::int AS "totalSearches",
            (SELECT count(*) FROM trending_searches)::int                AS "uniqueSearches"`
    );
    return rows[0];
};
