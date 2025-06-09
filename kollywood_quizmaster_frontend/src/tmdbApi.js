//
// Kollywood QuizMaster TMDB API Service
//
// This utility provides functions for querying The Movie Database (TMDB) API.
// It is configured for easy integration and can be reused across quiz modes.
//
const TMDB_API_KEY = "5bc67d3b06aecbd18121a3cbbc16eb59";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Helper function to perform GET requests to TMDB API
 * @param {string} endpoint - TMDB endpoint (starting with '/')
 * @param {object} params - Query params as object
 * @returns {Promise<object>} - JSON response from TMDB
 */
async function tmdbGet(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const response = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// PUBLIC_INTERFACE
/**
 * Fetch Kollywood (Tamil-language) movies by a search query or discover popular movies.
 * @param {object} options - Options for fetch: { query, page }
 * @returns {Promise<object>}
 */
export async function fetchTamilMovies(options = {}) {
  // TMDB language code for Tamil: 'ta'
  const { query, page = 1 } = options;
  if (query) {
    // Search movie by keyword (Tamil only)
    return tmdbGet("/search/movie", {
      language: "ta",
      query,
      page,
      region: "IN",
      with_original_language: "ta",
      include_adult: false,
    });
  } else {
    // Discover popular Tamil movies
    return tmdbGet("/discover/movie", {
      language: "ta",
      sort_by: "popularity.desc",
      page,
      region: "IN",
      with_original_language: "ta",
      include_adult: false,
    });
  }
}

// PUBLIC_INTERFACE
/**
 * Fetch detailed info for a movie by TMDB movie ID.
 * @param {number|string} movieId - TMDB movie ID
 * @returns {Promise<object>}
 */
export async function fetchMovieDetails(movieId) {
  // Returns movie details in Tamil if available, fallback to English.
  return tmdbGet(`/movie/${movieId}`, {
    language: "ta,en",
    append_to_response: "credits,images,videos",
    region: "IN",
  });
}

// PUBLIC_INTERFACE
/**
 * Fetch credits (cast and crew) for a given movie.
 * @param {number|string} movieId
 * @returns {Promise<object>}
 */
export async function fetchMovieCredits(movieId) {
  return tmdbGet(`/movie/${movieId}/credits`, {
    language: "ta,en",
  });
}

// PUBLIC_INTERFACE
/**
 * Fetch images (posters, backdrops) for a movie.
 * @param {number|string} movieId
 * @returns {Promise<object>}
 */
export async function fetchMovieImages(movieId) {
  return tmdbGet(`/movie/${movieId}/images`, {
    include_image_language: "ta,en,null",
  });
}

/**
 * Get TMDB image URL (poster, backdrop, etc.)
 * @param {string} path - Path returned from TMDB API (e.g., poster_path)
 * @param {string} size - 'w500', 'original', etc.
 * @returns {string}
 */
export function getTmdbImageUrl(path, size = "w500") {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
