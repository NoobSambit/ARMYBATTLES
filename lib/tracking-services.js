export const TRACKING_SERVICES = {
  LASTFM: 'lastfm',
  STATSFM: 'statsfm',
  MUSICAT: 'musicat',
};

export const TRACKING_SERVICE_CONFIG = {
  [TRACKING_SERVICES.LASTFM]: {
    label: 'Last.fm',
    supportsBattleVerification: true,
    usernameLabel: 'Last.fm Username',
    usernamePlaceholder: 'Enter your Last.fm username',
    profileUrlPlaceholder: 'https://www.last.fm/user/...',
    profileHelpUrl: 'https://www.last.fm/join',
    profileHelpLabel: 'Last.fm',
    description: 'Works with Last.fm scrobbles from Spotify and other supported players.',
    battleSupportNote: 'Battle verification supported.',
  },
  [TRACKING_SERVICES.STATSFM]: {
    label: 'Stats.fm',
    supportsBattleVerification: true,
    usernameLabel: 'Stats.fm Username',
    usernamePlaceholder: 'Enter your Stats.fm username',
    profileUrlPlaceholder: 'https://stats.fm/user/...',
    profileHelpUrl: 'https://stats.fm',
    profileHelpLabel: 'Stats.fm',
    description: 'Works with public Stats.fm streaming history.',
    battleSupportNote: 'Battle verification supported.',
  },
  [TRACKING_SERVICES.MUSICAT]: {
    label: 'Musicat',
    supportsBattleVerification: false,
    usernameLabel: 'Musicat Username',
    usernamePlaceholder: 'Enter your Musicat username',
    profileUrlPlaceholder: 'https://musicat.fm/@...',
    profileHelpUrl: 'https://musicat.fm',
    profileHelpLabel: 'Musicat',
    description: 'Apple Music friendly account connection.',
    battleSupportNote: 'Login is supported, but battle verification is not available yet.',
  },
};

export const TRACKING_SERVICE_OPTIONS = [
  TRACKING_SERVICES.LASTFM,
];

export function normalizeTrackingService(service) {
  if (!service) {
    return TRACKING_SERVICES.LASTFM;
  }

  const normalized = String(service).trim().toLowerCase();
  return TRACKING_SERVICE_CONFIG[normalized] ? normalized : TRACKING_SERVICES.LASTFM;
}

export function getTrackingServiceConfig(service) {
  return TRACKING_SERVICE_CONFIG[normalizeTrackingService(service)];
}

export function getTrackingServiceLabel(service) {
  return getTrackingServiceConfig(service).label;
}

export function trackingServiceSupportsBattleVerification(service) {
  return getTrackingServiceConfig(service).supportsBattleVerification;
}
