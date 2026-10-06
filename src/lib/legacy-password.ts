import { PasswordHash } from "phpass";

const phpass = new PasswordHash();

/** Hashes migrated from the old WooCommerce/WordPress site use phpass ($P$/$H$), not argon2. */
export function isLegacyHash(hash: string): boolean {
  return hash.startsWith("$P$") || hash.startsWith("$H$");
}

export function verifyLegacyPassword(password: string, hash: string): boolean {
  return phpass.checkPassword(password, hash);
}
