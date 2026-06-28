import {
  doc, getDoc, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Constants ────────────────────────────────────────────────────────────────

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_RESERVATION_HOURS = 24;

// lowercase letters, numbers, underscores and periods only — no spaces
const USERNAME_PATTERN = /^[a-z0-9_.]+$/;

export const USERNAMES_COLLECTION = 'usernames';
export const USERS_COLLECTION = 'users';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsernameDoc {
  uid: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp until which this reservation is exclusive to `uid`. Null = permanently owned. */
  reservedUntil: string | null;
  previousUsername?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: 'taken' | 'reserved' | 'invalid' | 'own';
  message?: string;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Normalizes raw user input into the canonical stored form:
 * trims whitespace and lowercases. Does NOT strip invalid characters —
 * that's surfaced to the user via validateUsernameFormat instead.
 */
export function normalizeUsername(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

/**
 * Validates username format against the required rules:
 * - 3–30 characters
 * - lowercase letters, numbers, underscores and periods only
 * - no spaces
 */
export function validateUsernameFormat(raw: string): ValidationResult {
  const username = normalizeUsername(raw);

  if (!username) {
    return { valid: false, error: 'Username is required' };
  }
  if (/\s/.test(raw)) {
    return { valid: false, error: 'Username cannot contain spaces' };
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: 'Only lowercase letters, numbers, underscores (_) and periods (.) are allowed' };
  }
  return { valid: true };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isReservationActive(data: UsernameDoc): boolean {
  if (!data.reservedUntil) return true; // permanent ownership, always "active"
  return new Date(data.reservedUntil).getTime() > Date.now();
}

function nowIso(): string {
  return new Date().toISOString();
}

function reservationDeadlineIso(): string {
  return new Date(Date.now() + USERNAME_RESERVATION_HOURS * 60 * 60 * 1000).toISOString();
}

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Checks whether a username can be claimed by `currentUid`.
 * - Available if the doc doesn't exist.
 * - Available if the doc exists but already belongs to `currentUid` (keeping current name).
 * - Available if the doc exists, belongs to someone else, but its reservation has expired.
 * - Unavailable otherwise (actively owned or actively reserved by someone else).
 */
export async function isUsernameAvailable(rawUsername: string, currentUid?: string): Promise<AvailabilityResult> {
  const format = validateUsernameFormat(rawUsername);
  if (!format.valid) {
    return { available: false, reason: 'invalid', message: format.error };
  }
  const username = normalizeUsername(rawUsername);

  const ref = doc(db, USERNAMES_COLLECTION, username);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { available: true };
  }

  const data = snap.data() as UsernameDoc;

  if (currentUid && data.uid === currentUid) {
    return { available: true, reason: 'own' };
  }

  if (isReservationActive(data)) {
    const reason = data.reservedUntil ? 'reserved' : 'taken';
    return {
      available: false,
      reason,
      message: reason === 'reserved'
        ? 'This username was recently released and is temporarily reserved. Try again later.'
        : 'This username is already taken.',
    };
  }

  // Reservation has expired — it's up for grabs.
  return { available: true };
}

/**
 * Checks whether `uid` currently owns `rawUsername` (active ownership, not just an
 * expired or reserved record pointing at them).
 */
export async function checkOwnership(rawUsername: string, uid: string): Promise<boolean> {
  const username = normalizeUsername(rawUsername);
  if (!username || !uid) return false;
  const ref = doc(db, USERNAMES_COLLECTION, username);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() as UsernameDoc;
  return data.uid === uid;
}

// ─── Claiming / Changing ──────────────────────────────────────────────────────

/**
 * Claims a username for a user who does not currently have one (or is setting
 * their first username). Safe against race conditions via a Firestore transaction.
 */
export async function claimUsername(uid: string, rawUsername: string): Promise<ClaimResult> {
  const format = validateUsernameFormat(rawUsername);
  if (!format.valid) return { success: false, error: format.error };

  const username = normalizeUsername(rawUsername);
  const usernameRef = doc(db, USERNAMES_COLLECTION, username);
  const userRef = doc(db, USERS_COLLECTION, uid);

  try {
    await runTransaction(db, async (tx) => {
      const usernameSnap = await tx.get(usernameRef);

      if (usernameSnap.exists()) {
        const data = usernameSnap.data() as UsernameDoc;
        if (data.uid !== uid && isReservationActive(data)) {
          throw new Error('TAKEN');
        }
      }

      const timestamp = nowIso();
      const newDoc: UsernameDoc = {
        uid,
        username,
        createdAt: usernameSnap.exists() ? (usernameSnap.data() as UsernameDoc).createdAt || timestamp : timestamp,
        updatedAt: timestamp,
        reservedUntil: null,
      };

      tx.set(usernameRef, newDoc);
      tx.update(userRef, { username, updatedAt: timestamp });
    });

    return { success: true };
  } catch (err: any) {
    if (err?.message === 'TAKEN') {
      return { success: false, error: 'This username is already taken.' };
    }
    console.error('claimUsername error:', err);
    return { success: false, error: 'Failed to claim username. Please try again.' };
  }
}

/**
 * Changes a user's username from `oldUsername` to `newUsername`.
 * The old username is reserved (exclusively, for the same user) for
 * USERNAME_RESERVATION_HOURS so nobody else can immediately claim it,
 * after which it becomes available to anyone.
 */
export async function changeUsername(
  uid: string,
  oldUsername: string | null | undefined,
  rawNewUsername: string,
): Promise<ClaimResult> {
  const format = validateUsernameFormat(rawNewUsername);
  if (!format.valid) return { success: false, error: format.error };

  const newUsername = normalizeUsername(rawNewUsername);
  const normalizedOld = oldUsername ? normalizeUsername(oldUsername) : null;

  // No actual change — nothing to do.
  if (normalizedOld === newUsername) {
    return { success: true };
  }

  // No previous username — this is just a first-time claim.
  if (!normalizedOld) {
    return claimUsername(uid, newUsername);
  }

  const newRef = doc(db, USERNAMES_COLLECTION, newUsername);
  const oldRef = doc(db, USERNAMES_COLLECTION, normalizedOld);
  const userRef = doc(db, USERS_COLLECTION, uid);

  try {
    await runTransaction(db, async (tx) => {
      const [newSnap, oldSnap] = await Promise.all([tx.get(newRef), tx.get(oldRef)]);

      if (newSnap.exists()) {
        const data = newSnap.data() as UsernameDoc;
        if (data.uid !== uid && isReservationActive(data)) {
          throw new Error('TAKEN');
        }
      }

      const timestamp = nowIso();

      // Reserve the old username for this user only, for 24 hours.
      const oldDoc: UsernameDoc = {
        uid,
        username: normalizedOld,
        createdAt: oldSnap.exists() ? (oldSnap.data() as UsernameDoc).createdAt || timestamp : timestamp,
        updatedAt: timestamp,
        reservedUntil: reservationDeadlineIso(),
      };
      tx.set(oldRef, oldDoc);

      // Claim the new username.
      const newDoc: UsernameDoc = {
        uid,
        username: newUsername,
        createdAt: newSnap.exists() ? (newSnap.data() as UsernameDoc).createdAt || timestamp : timestamp,
        updatedAt: timestamp,
        reservedUntil: null,
        previousUsername: normalizedOld,
      };
      tx.set(newRef, newDoc);

      tx.update(userRef, { username: newUsername, updatedAt: timestamp });
    });

    return { success: true };
  } catch (err: any) {
    if (err?.message === 'TAKEN') {
      return { success: false, error: 'This username is already taken.' };
    }
    console.error('changeUsername error:', err);
    return { success: false, error: 'Failed to update username. Please try again.' };
  }
}

/**
 * Best-effort explicit release of an expired reservation. Not required for
 * correctness (isUsernameAvailable/claimUsername already treat expired
 * reservations as available), but useful for cleanup jobs or admin tools.
 */
export async function releaseExpiredReservation(rawUsername: string): Promise<boolean> {
  const username = normalizeUsername(rawUsername);
  const ref = doc(db, USERNAMES_COLLECTION, username);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const data = snap.data() as UsernameDoc;
  if (!data.reservedUntil) return false; // permanently owned, nothing to release
  if (isReservationActive(data)) return false; // still within reservation window

  // Reservation has lapsed — clear the reservedUntil flag so the slot reads as
  // fully free (the doc itself is harmlessly overwritten on next claim anyway).
  try {
    await runTransaction(db, async (tx) => {
      const freshSnap = await tx.get(ref);
      if (!freshSnap.exists()) return;
      const fresh = freshSnap.data() as UsernameDoc;
      if (fresh.reservedUntil && new Date(fresh.reservedUntil).getTime() <= Date.now()) {
        tx.update(ref, { reservedUntil: null, updatedAt: nowIso() });
      }
    });
    return true;
  } catch (err) {
    console.error('releaseExpiredReservation error:', err);
    return false;
  }
}

/**
 * Resolves a username to its owning uid (used by the public profile page
 * as a fallback lookup path). Returns null if not found or not actively owned.
 */
export async function resolveUidForUsername(rawUsername: string): Promise<string | null> {
  const username = normalizeUsername(rawUsername);
  if (!username) return null;
  const ref = doc(db, USERNAMES_COLLECTION, username);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as UsernameDoc;
  return data.uid || null;
}