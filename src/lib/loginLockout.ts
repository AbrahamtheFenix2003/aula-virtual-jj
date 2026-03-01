/**
 * Login Lockout Service
 *
 * Persistent brute-force protection backed by PostgreSQL (Prisma).
 * Tracks failed login attempts per email+IP pair and enforces
 * a temporary lockout after exceeding the configured threshold.
 */

import { prisma } from "@/lib/prisma";

// ============================================
// CONFIGURATION
// ============================================

/** Maximum consecutive failed attempts before lockout */
const MAX_FAILED_ATTEMPTS = getPositiveIntFromEnv(
  process.env.LOGIN_MAX_FAILED_ATTEMPTS,
  5,
);

/** Sliding window (minutes) before attempts are considered stale */
const ATTEMPT_WINDOW_MINUTES = getPositiveIntFromEnv(
  process.env.LOGIN_ATTEMPT_WINDOW_MINUTES,
  15,
);

/** Temporary lockout duration (minutes) once threshold is exceeded */
const LOCKOUT_DURATION_MINUTES = getPositiveIntFromEnv(
  process.env.LOGIN_LOCKOUT_DURATION_MINUTES,
  15,
);

/** Sliding window in milliseconds */
const ATTEMPT_WINDOW_MS = ATTEMPT_WINDOW_MINUTES * 60 * 1000;

/** Lockout duration in milliseconds */
const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000;

export const LOGIN_LOCKOUT_CONFIG = {
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  attemptWindowMinutes: ATTEMPT_WINDOW_MINUTES,
  attemptWindowMs: ATTEMPT_WINDOW_MS,
  lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES,
  lockoutDurationMs: LOCKOUT_DURATION_MS,
} as const;

// ============================================
// TYPES
// ============================================

interface LockoutStatus {
  /** Whether the pair email+IP is currently locked out */
  locked: boolean;
  /** Seconds remaining until unlock (0 if not locked) */
  retryAfterSeconds: number;
  /** Current failed attempts in the active window */
  failedAttempts: number;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Check whether login should be blocked for this email+IP.
 * Call this BEFORE verifying the password.
 */
export async function checkLoginLockout(
  email: string,
  ipAddress: string,
): Promise<LockoutStatus> {
  const now = new Date();
  const key = normalizeKey(email, ipAddress);

  const record = await prisma.loginAttempt.findUnique({
    where: { email_ipAddress: key },
    select: {
      failedAttempts: true,
      lockedUntil: true,
      lastAttemptAt: true,
    },
  });

  // No record → first attempt ever, not locked
  if (!record) {
    return { locked: false, retryAfterSeconds: 0, failedAttempts: 0 };
  }

  // Active lockout?
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil(
      (record.lockedUntil.getTime() - now.getTime()) / 1000,
    );
    return {
      locked: true,
      retryAfterSeconds,
      failedAttempts: record.failedAttempts,
    };
  }

  // Window expired? Treat as fresh
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);
  if (record.lastAttemptAt < windowStart) {
    // Stale record — reset lazily on next write
    return { locked: false, retryAfterSeconds: 0, failedAttempts: 0 };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    failedAttempts: record.failedAttempts,
  };
}

/**
 * Record a failed login attempt. If the threshold is exceeded,
 * a lockout is activated.
 */
export async function recordFailedLogin(
  email: string,
  ipAddress: string,
): Promise<void> {
  const now = new Date();
  const key = normalizeKey(email, ipAddress);
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

  const existing = await prisma.loginAttempt.findUnique({
    where: { email_ipAddress: key },
    select: {
      failedAttempts: true,
      lastAttemptAt: true,
      lockedUntil: true,
    },
  });

  // Determine new attempt count
  let newCount: number;
  if (!existing || existing.lastAttemptAt < windowStart) {
    // First attempt or stale window → start fresh at 1
    newCount = 1;
  } else {
    newCount = existing.failedAttempts + 1;
  }

  // Activate lockout if threshold reached
  const lockedUntil =
    newCount >= MAX_FAILED_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
      : null;

  await prisma.loginAttempt.upsert({
    where: { email_ipAddress: key },
    create: {
      email: email.toLowerCase().trim(),
      ipAddress,
      failedAttempts: newCount,
      lockedUntil,
      lastAttemptAt: now,
    },
    update: {
      failedAttempts: newCount,
      lockedUntil,
      lastAttemptAt: now,
    },
  });
}

/**
 * Clear all failed-login tracking for this email+IP pair.
 * Call after a successful login.
 */
export async function clearLoginAttempts(
  email: string,
  ipAddress: string,
): Promise<void> {
  const key = normalizeKey(email, ipAddress);

  // deleteMany is safe even if the record does not exist
  await prisma.loginAttempt.deleteMany({
    where: {
      email: key.email,
      ipAddress: key.ipAddress,
    },
  });
}

// ============================================
// HELPERS
// ============================================

function normalizeKey(
  email: string,
  ipAddress: string,
): { email: string; ipAddress: string } {
  return {
    email: email.toLowerCase().trim(),
    ipAddress: ipAddress.trim(),
  };
}

function getPositiveIntFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}
