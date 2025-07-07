export const generateKeyPair = async () => {
  const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
  return Promise.all([
    window.crypto.subtle.exportKey("spki", publicKey).then(bufferToBase64Raw),
    window.crypto.subtle.exportKey("pkcs8", privateKey).then(bufferToBase64Raw),
  ]).then(([publicKey, privateKey]) => ({ publicKey, privateKey }));
};

export async function bufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  // use a FileReader to generate a base64 data URI:
  const base64url: string = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result as string);
    reader.readAsDataURL(new Blob([buffer]));
  });
  // remove the `data:...;base64,` part from the start, make the base64 uri compatable
  return base64url.slice(base64url.indexOf(",") + 1).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function bufferToBase64Raw(buffer: ArrayBuffer | Uint8Array) {
  // use a FileReader to generate a base64 data URI:
  const base64url: string = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result as string);
    reader.readAsDataURL(new Blob([buffer]));
  });
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(",") + 1);
}

export async function base64ToBuffer(privateString: string) {
  const response = await fetch(
    `data:application/octet-stream;base64,${privateString.replace(/-/g, '+').replace(/_/g, '/')}`
  );
  return await response.arrayBuffer();
}

/**
 * Creates and signs a JWT using an RSA private key with SubtleCrypto.
 */
export async function generateJwt(privateKey: string, userId: string, audience: string, issuer: string, minutes_before_expiry: number = 30) {
  const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
  const expiration = now + (minutes_before_expiry * 60);
  const claims = {
    id: userId,
    roles: []
  };
  // Standard JWT header
  const header = {
    alg: "RS256", // Algorithm: RSA-SHA256
    typ: "JWT"    // Type: JWT
  };

  // Standard JWT claims (payload)
  const jwtClaims = {
    sub: claims.id,
    exp: expiration,
    iat: now,
    aud: audience,
    iss: issuer,
    roles: claims.roles || [] // Include custom roles claim
  };

  // Encode header and claims to Base64Url
  const [encodedHeader, encodedClaims] = await Promise.all([
    bufferToBase64(
      new TextEncoder().encode(JSON.stringify(header))
    ), bufferToBase64(
      new TextEncoder().encode(JSON.stringify(jwtClaims))
    )])

  const dataToSign = `${encodedHeader}.${encodedClaims}`;

  const privateKeyBuffer = await base64ToBuffer(privateKey);
  const privateKeyCrypto = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the data
  const signature = await window.crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    privateKeyCrypto,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = await bufferToBase64(signature);

  // Combine into final JWT
  return `${dataToSign}.${encodedSignature}`;
}