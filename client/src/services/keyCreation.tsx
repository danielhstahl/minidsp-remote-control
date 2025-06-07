export const generateKeyPair = async () => {
  const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  return Promise.all([
    window.crypto.subtle.exportKey("spki", publicKey).then(bufferToBase64),
    window.crypto.subtle.exportKey("pkcs8", privateKey).then(bufferToBase64),
  ]).then(([publicKey, privateKey]) => ({ publicKey, privateKey }));
};

async function base64ToBuffer(privateString: string) {
  const response = await fetch(
    `data:application/octet-stream;base64,${privateString}`,
  );
  return await response.arrayBuffer();
}

async function bufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  // use a FileReader to generate a base64 data URI:
  const base64url: string = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result as string);
    reader.readAsDataURL(new Blob([buffer]));
  });
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(",") + 1);
}

export const sign = async (stringToSign: string, privateKey: string) => {
  const privateKeyBuffer = await base64ToBuffer(privateKey);
  const privateKeyCrypto = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  let enc = new TextEncoder();
  const thingToSign = enc.encode(stringToSign);
  let signature = await window.crypto.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32,
    },
    privateKeyCrypto,
    thingToSign,
  );
  return bufferToBase64(signature);
};
