export const MS_24H = 24 * 60 * 60 * 1000
export const MS_3D  = 3 * 24 * 60 * 60 * 1000
export const MS_7D  = 7 * 24 * 60 * 60 * 1000
export const MS_30D = 30 * 24 * 60 * 60 * 1000
export const MS_90D = 90 * 24 * 60 * 60 * 1000

export const TOKEN_LINK_TTL_MS = MS_3D
export const RATE_LIMIT_WINDOW_S = 86400

export const DURATIONS = [
  { label: "24 hours", ms: MS_24H },
  { label: "3 days",   ms: MS_3D  },
  { label: "7 days",   ms: MS_7D  },
  { label: "30 days",  ms: MS_30D },
] as const

export const ALL_DURATIONS = [
  { label: "24 hours", ms: MS_24H },
  { label: "3 days",   ms: MS_3D  },
  { label: "7 days",   ms: MS_7D  },
  { label: "30 days",  ms: MS_30D },
  { label: "90 days",  ms: MS_90D },
] as const

export const VALID_DURATIONS_MS = new Set(ALL_DURATIONS.map(d => d.ms))
