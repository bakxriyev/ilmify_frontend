// lib/crypto.ts
const SECRET_KEY = 'edu-platform-secret-key-2026'; // Ishlab chiqarishda murakkabroq kalit ishlating

export function encryptUnitId(unitId: string): string {
  let result = '';
  for (let i = 0; i < unitId.length; i++) {
    result += String.fromCharCode(
      unitId.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }
  // Base64 qilamiz va URL uchun xavfsiz qilamiz
  return btoa(result)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decryptUnitId(encrypted: string): string {
  // Base64URL ni oddiy Base64 ga qaytaramiz
  let base64 = encrypted.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const decoded = atob(base64);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }
  return result;
}