/**
 * Cryptographically secure identifiers.
 *
 * Widget keys and OTP codes were both generated with Math.random(), which is a
 * fast non-cryptographic PRNG: its output is predictable from previous values,
 * so a widget key (the only credential the public chat endpoint takes) or a
 * login OTP could be guessed rather than brute-forced.
 */

import { randomInt } from 'node:crypto';

const WIDGET_KEY_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const WIDGET_KEY_LENGTH = 12;
export const OTP_DIGITS = 6;

/**
 * A random widget key drawn from the same 62-character alphabet as before.
 *
 * randomInt() rather than randomBytes(): both draw from the same CSPRNG, but
 * reducing a random byte modulo 62 is biased (256 is not a multiple of 62), so
 * some characters would appear more often. randomInt() rejection-samples
 * internally and is uniform.
 */
export function generateWidgetKey(length: number = WIDGET_KEY_LENGTH): string {
  let key = '';
  for (let i = 0; i < length; i++) {
    key += WIDGET_KEY_ALPHABET[randomInt(0, WIDGET_KEY_ALPHABET.length)];
  }
  return key;
}

/** A uniformly random numeric OTP, zero-padded so every code is the same length. */
export function generateOtpCode(digits: number = OTP_DIGITS): string {
  const max = 10 ** digits;
  return String(randomInt(0, max)).padStart(digits, '0');
}
