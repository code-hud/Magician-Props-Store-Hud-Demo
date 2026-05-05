const hud = require('hud-sdk/setup');

// Register Hud - don't instrument node_modules unless needed
hud.register({
  includeModules: [],
});

// Commit hash tag is required - fail loudly if missing so we never ship
// Hud sessions tagged as "unknown" by accident.
const commitSha = process.env.GIT_COMMIT_SHA;
if (!commitSha || commitSha.trim() === '') {
  throw new Error(
    'GIT_COMMIT_SHA environment variable is not set. ' +
    'It must be baked at build time (see backend/Dockerfile and docker-compose.yml). ' +
    'Refusing to start so Hud sessions are never tagged "unknown".',
  );
}

// Initialize Hud session with API key and service name
const hudApiKey = process.env.HUD_API_KEY;
if (!hudApiKey) {
  console.warn('HUD_API_KEY environment variable is not set. Hud monitoring will not be initialized.');
} else {
  void hud.initSession(hudApiKey, 'magician-props-api', {
    tags: {
      commit_sha: commitSha,
    },
  });
}
