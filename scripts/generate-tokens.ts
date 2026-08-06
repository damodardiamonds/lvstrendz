import fs from "fs";
import path from "path";
// @ts-ignore
import { generateJWEAndJWS } from "payglocal-js-client";

// Read .env
const envPath = path.resolve(process.cwd(), ".env");
const envVars: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
  });
}

async function main() {
  const publicPemPath = path.resolve(
    process.cwd(),
    envVars.PAYGLOCAL_PUBLIC_PEM_PATH || "./keys/payglocal_public.pem"
  );
  const privatePemPath = path.resolve(
    process.cwd(),
    envVars.PAYGLOCAL_PRIVATE_PEM_PATH || "./keys/payglocal_private.pem"
  );

  if (!fs.existsSync(publicPemPath) || !fs.existsSync(privatePemPath)) {
    console.error("PEM keys missing at:", publicPemPath, privatePemPath);
    process.exit(1);
  }

  const publicKey = fs.readFileSync(publicPemPath, "utf8");
  const privateKey = fs.readFileSync(privatePemPath, "utf8");

  const payload = {
    merchantTxnId: "ORD-" + Date.now(),
    paymentData: {
      totalAmount: "100.00",
      txnCurrency: "INR",
    },
    clientData: {
      emailId: "customer@example.com",
      phoneNumber: "9999999999",
      firstName: "Test",
      lastName: "User",
    },
    merchantCallbackURL: `${
      envVars.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/payment/callback`,
  };

  const merchantId = envVars.PAYGLOCAL_MERCHANT_ID || "ptplkikanikr2907";
  const publicKeyId =
    envVars.PAYGLOCAL_PUBLIC_KEY_ID || "8cc91c8d-8030-4660-a9c7-33de886fb495";
  const privateKeyId =
    envVars.PAYGLOCAL_PRIVATE_KEY_ID || "kId-edUmioEvV6nLsG6l";

  console.log("=========================================");
  console.log("        PAYGLOCAL TOKEN GENERATOR        ");
  console.log("=========================================");
  console.log("\n--- CONFIGURATION ---");
  console.log("Merchant ID    :", merchantId);
  console.log("Public Key ID  :", publicKeyId);
  console.log("Private Key ID :", privateKeyId);

  console.log("\n--- PAYLOAD ---");
  console.log(JSON.stringify(payload, null, 2));

  const tokens = await generateJWEAndJWS({
    payload,
    publicKey,
    privateKey,
    merchantId,
    publicKeyId,
    privateKeyId,
  });

  console.log("\n--- JWE TOKEN (Encrypted Request Body) ---");
  console.log(tokens.jweToken);

  console.log("\n--- JWS TOKEN (Header: x-gl-token-external) ---");
  console.log(tokens.jwsToken);
  console.log("=========================================");
}

main().catch((err) => {
  console.error("Error generating tokens:", err);
  process.exit(1);
});
