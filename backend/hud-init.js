const hud = require('hud-sdk/setup');

// Register Hud - don't instrument node_modules unless needed
hud.register({
  includeModules: [],
});

// Initialize Hud session with API key and service name
const hudApiKey = process.env.HUD_API_KEY;
if (!hudApiKey) {
  console.warn('HUD_API_KEY environment variable is not set. Hud monitoring will not be initialized.');
} else {
  void hud.initSession(hudApiKey, 'magician-props-api');
}
