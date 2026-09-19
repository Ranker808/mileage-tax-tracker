// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js pulls in @supabase/realtime-js, whose package.json
// "exports" map points Metro at its Node-targeted build on native
// platforms. That build requires the `ws` package, which in turn requires
// Node core modules (stream, zlib, ...) that don't exist in React
// Native's Metro bundling environment, so the bundle 500s with
// UnableToResolveError. Falling back to legacy ("main" field) resolution
// makes Metro use realtime-js's browser-targeted build instead, which
// uses the platform's native WebSocket and never touches `ws` at all.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
