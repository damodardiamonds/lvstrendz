import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { generateJWEAndJWS } = require("payglocal-js-client");

const publicPemPath  = path.resolve(__dirname, "../keys/8cc91c8d-8030-4660-a9c7-33de886fb495_payglocal_mid.pem");
const privatePemPath = path.resolve(__dirname, "../keys/kId-edUmioEvV6nLsG6l_ptplkikanikr2907.pem");

const publicKey  = fs.readFileSync(publicPemPath,  "utf8");
const privateKey = fs.readFileSync(privatePemPath, "utf8");

// ── Minimal test payload ──────────────────────────────────────────────────────
const payload = {
  merchantTxnId: `TEST-${Date.now()}`,
  paymentData: {
    totalAmount: "2.00",
    txnCurrency: "INR",
  },
  clientData: {
    emailId:     "test@lvstrendz.com",
    phoneNumber: "9999999999",
    firstName:   "Test",
    lastName:    "User",
  },
  merchantCallbackURL: "https://lvstrendz.com/api/payment/callback",
};

console.log("=== PAYLOAD ===");
console.log(JSON.stringify(payload, null, 2));

const secureTokens = await generateJWEAndJWS({
  payload,
  publicKey,
  privateKey,
  merchantId:   "ptplkikanikr2907",
  publicKeyId:  "8cc91c8d-8030-4660-a9c7-33de886fb495",
  privateKeyId: "kId-edUmioEvV6nLsG6l",
});

console.log("\n=== JWE TOKEN ===");
console.log(secureTokens.jweToken);
console.log("\n=== JWS TOKEN ===");
console.log(secureTokens.jwsToken);

// ── POST to PayGlocal sandbox ─────────────────────────────────────────────────
const url = "https://api.prod.payglocal.in/gl/v1/payments/initiate/paycollect";

console.log("\n=== POSTING TO PAYGLOCAL ===");
console.log("URL:", url);

const res = await fetch(url, {
  method:  "POST",
  headers: {
    "Content-Type":        "text/plain",
    "x-gl-token-external": secureTokens.jwsToken,
  },
  body: secureTokens.jweToken,
});

const responseText = await res.text();

console.log("\n=== HTTP STATUS ===");
console.log(res.status, res.statusText);

console.log("\n=== RESPONSE HEADERS ===");
for (const [k, v] of res.headers.entries()) {
  console.log(`  ${k}: ${v}`);
}

console.log("\n=== RESPONSE BODY ===");
try {
  console.log(JSON.stringify(JSON.parse(responseText), null, 2));
} catch {
  console.log(responseText);
}
