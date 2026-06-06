// E2EE Helper using the browser's native Web Crypto API (SubtleCrypto)
// Encrypts and decrypts strings using AES-GCM 256-bit key derived via PBKDF2 from a shared passphrase.

function bufferToBase64(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Fixed salt for key derivation. Since this is client-side only and the threat model
// is securing data in the database, a constant salt is acceptable. For added security,
// a unique couple salt could be used, but a static one ensures simplicity.
const SALT_BYTES = new Uint8Array([80, 114, 111, 106, 101, 99, 116, 83, 116, 97, 114, 69, 50, 69, 69, 33]); // "ProjectStarE2EE!"

async function getEncryptionKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // Import raw passphrase as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passphraseBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT_BYTES,
      iterations: 10000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

/**
 * Encrypts a plaintext string using the provided passphrase.
 */
export async function encryptText(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
  if (!passphrase) {
    throw new Error('E2EE Passphrase is required for encryption');
  }

  // Generate a random 12-byte IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey(passphrase);
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const encryptedBuf = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bufferToBase64(encryptedBuf),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts a ciphertext string using the provided passphrase and IV.
 */
export async function decryptText(ciphertext: string, ivBase64: string, passphrase: string): Promise<string> {
  if (!passphrase) {
    throw new Error('E2EE Passphrase is required for decryption');
  }

  try {
    const key = await getEncryptionKey(passphrase);
    const encryptedBytes = base64ToBuffer(ciphertext);
    const iv = new Uint8Array(base64ToBuffer(ivBase64));

    const decryptedBuf = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuf);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw new Error('Decryption failed. Please verify your shared couple passphrase.');
  }
}
