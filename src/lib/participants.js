const DEFAULT_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
  <defs>
    <linearGradient id="avatarGradient" x1="12" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D8EAFE"/>
      <stop offset="1" stop-color="#93C5FD"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="48" fill="url(#avatarGradient)"/>
  <circle cx="48" cy="36" r="16" fill="#F8FAFC"/>
  <path d="M22 78c4-13 15-21 26-21s22 8 26 21" fill="#F8FAFC"/>
</svg>
`.trim();

export const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;

export function getParticipantProfileImage(profileImage) {
  return profileImage && String(profileImage).trim() ? profileImage : DEFAULT_PROFILE_IMAGE;
}

export function normalizeParticipant(participant) {
  return {
    ...participant,
    profileImage: getParticipantProfileImage(participant?.profileImage),
  };
}
