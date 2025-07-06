
// --- Helper function to convert ArrayBuffer to Base64Url ---
/*function arrayBufferToBase64Url(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}*/
export async function bufferToBase64(buffer: ArrayBuffer | Uint8Array) {
    // use a FileReader to generate a base64 data URI:
    const base64url: string = await new Promise((r) => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result as string);
        reader.readAsDataURL(new Blob([buffer]));
    });
    // remove the `data:...;base64,` part from the start
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

// --- Helper function to convert Base64Url to ArrayBuffer ---
/*function base64UrlToArrayBuffer(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
        base64 += new Array(5 - pad).join('=');
    }
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}*/
export async function base64ToBuffer(privateString: string) {
    const response = await fetch(
        `data:application/octet-stream;base64,${privateString.replace(/-/g, '+').replace(/_/g, '/')}`
    );
    return await response.arrayBuffer();
}

interface Claims {
    id: string;
    roles: string[]
}
/**
 * Creates and signs a JWT using an RSA private key with SubtleCrypto.
 *
 * @param {CryptoKey} privateKey - The CryptoKey object representing the RSA private key.
 * @param {object} claims - The payload (claims) for the JWT.
 * @param {string} audience - The intended recipient of the token (e.g., your resource server URL).
 * @param {string} issuer - The issuer of the token (e.g., your authorization server URL).
 * @returns {Promise<string>} A promise that resolves with the signed JWT string.
 */
async function generateJwt(privateKey: string, claims: Claims, audience: string, issuer: string) {
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    const expiration = now + (15 * 60); // Token valid for 15 minutes from now

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
            name: "RSASSA-PKCS1-v1_5", //check this
            hash: { name: "SHA-256" },
        },
        privateKeyCrypto,
        new TextEncoder().encode(dataToSign)
    );

    const encodedSignature = await bufferToBase64(signature);

    // Combine into final JWT
    return `${dataToSign}.${encodedSignature}`;
}

// --- Main execution block ---
export async function runExample() {
    // 1. Generate an RSA key pair (for demonstration purposes only).
    // In a real application, you would load an existing private key securely,
    // not generate it in the browser every time.
    console.log("Generating RSA key pair...");
    const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
        {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
            hash: { name: "SHA-256" },
        },
        true, // extractable
        ["sign", "verify"]
    );
    console.log("RSA key pair generated.");

    // Export the private key to JWK format for storage/use (demonstration)
    /*const privateKeyJwk = await crypto.subtle.exportKey("jwk", privateKey);
    console.log("Private Key (JWK format):", JSON.stringify(privateKeyJwk, null, 2));

    // Export the public key to JWK format (for your Resource Server to verify)
    const publicKeyJwk = await crypto.subtle.exportKey("jwk", publicKey);
    console.log("Public Key (JWK format):", JSON.stringify(publicKeyJwk, null, 2));*/

    const { privateKey: privateKeyString, publicKey: publicKeyString } = await Promise.all([
        window.crypto.subtle.exportKey("spki", publicKey).then(bufferToBase64Raw),
        window.crypto.subtle.exportKey("pkcs8", privateKey).then(bufferToBase64Raw),
    ]).then(([publicKey, privateKey]) => ({ publicKey, privateKey }));

    // In a real scenario, you would load your private key like this:
    // const storedPrivateKeyJwk = { /* your actual private key JWK object */ };
    // const loadedPrivateKey = await crypto.subtle.importKey(
    //     "jwk",
    //     storedPrivateKeyJwk,
    //     { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    //     true, // extractable
    //     ["sign"]
    // );
    //const loadedPrivateKey = JSON.stringify(privateKeyString, null, 2); // Using the generated key for this example
    console.log(privateKeyString)
    console.log(publicKeyString)
    const res = publicKeyString.match(/.{1,64}/g)
    if (res !== null) {
        console.log(`-----BEGIN PUBLIC KEY-----\n${res.join('\n')}\n-----END PUBLIC KEY-----`)
    }
    const userId = "js_user_456";
    const userRoles = ["viewer", "analyst"];
    const resourceServerAudience = "https://your.resource.server.com";
    const authServerIssuer = "https://your.auth.server.com";

    const claims = {
        id: userId,
        roles: userRoles
    };

    try {
        const jwt = await generateJwt(
            privateKeyString,
            claims,
            resourceServerAudience,
            authServerIssuer
        );
        console.log("\nSuccessfully created JWT:\n", jwt);

        // --- Optional: Verify the JWT using the public key (for demonstration) ---
        console.log("\nVerifying the generated JWT...");
        const parts = jwt.split('.');
        if (parts.length !== 3) {
            console.error("Invalid JWT format for verification.");
            return;
        }
        const [encodedHeader, encodedClaims, encodedSignature] = parts;
        const dataToVerify = `${encodedHeader}.${encodedClaims}`;
        const signatureBuffer = base64ToBuffer(encodedSignature);

        /*const loadedPublicKey = JSON.stringify(publicKeyJwk); // Using the generated public key for this example

        const isValid = await crypto.subtle.verify(
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: { name: "SHA-256" },
            },
            loadedPublicKey,
            signatureBuffer,
            new TextEncoder().encode(dataToVerify)
        );

        console.log("JWT verification result:", isValid ? "SUCCESS" : "FAILED");

        if (isValid) {
            // Decode claims (without verification, as we just verified the signature)
            const decodedClaims = JSON.parse(new TextDecoder().decode(base64UrlToArrayBuffer(encodedClaims)));
            console.log("Decoded Claims:", decodedClaims);
        }*/

    } catch (error) {
        console.error("Error creating or verifying JWT:", error);
    }
}

// Run the example
//runExample();