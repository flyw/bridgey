import * as crypto from 'crypto';

/**
 * Hashes a password using scrypt with a random salt.
 * Returns salt:hash format.
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verifies a password against a stored salt:hash string.
 */
export const verifyPassword = (password: string, storedValue: string): boolean => {
  try {
    const [salt, hash] = storedValue.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === verifyHash;
  } catch (err) {
    return false;
  }
};
