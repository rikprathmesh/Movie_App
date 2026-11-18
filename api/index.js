// Vercel entry point. Vercel runs files in this top-level api/ folder as server
// functions. This one hands every request to Expo's Vercel adapter, which runs the
// API routes in src/app/api/*+api.ts from the build in dist/server
// (created by `npx expo export --platform web`, see vercel.json).
const path = require("path");
const { createRequestHandler } = require("expo-server/adapter/vercel");

module.exports = createRequestHandler({
  build: path.join(__dirname, "../dist/server"),
});
