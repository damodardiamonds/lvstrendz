import { db } from "../src/backend/lib/db";
import fs from "fs";
import path from "path";
// @ts-ignore
import { generateJWEAndJWS } from "payglocal-js-client";

async function main() {
  const latestOrders = await db.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      address: true,
    },
  });

  if (latestOrders.length === 0) {
    console.log("No orders found in database.");
    return;
  }

  console.log("=========================================");
  console.log(`ALL 10 RECENT ORDERS IN DATABASE:`);
  console.log("=========================================");
  latestOrders.forEach((o, i) => {
    console.log(`${i + 1}. Order ${o.orderNumber} | AttemptId: ${o.paymentAttemptId} | Status: ${o.paymentStatus} | Created: ${o.createdAt}`);
  });

  const order = latestOrders[0];
  console.log(`\n--- SELECTED ₹2 ORDER DETAILS ---`);
  console.log("Order ID     :", order.id);
  console.log("Order Number :", order.orderNumber);
  console.log("Total Amount :", order.total.toString(), "INR");
  console.log("Payment Method:", order.paymentMethod);
  console.log("Created At   :", order.createdAt);

  let publicKey = process.env.PAYGLOCAL_PUBLIC_KEY?.replace(/\\n/g, "\n");
  let privateKey = process.env.PAYGLOCAL_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!publicKey || !privateKey) {
    const publicPemPath = path.resolve(
      process.cwd(),
      process.env.PAYGLOCAL_PUBLIC_PEM_PATH ||
        "./keys/8cc91c8d-8030-4660-a9c7-33de886fb495_payglocal_mid.pem"
    );
    const privatePemPath = path.resolve(
      process.cwd(),
      process.env.PAYGLOCAL_PRIVATE_PEM_PATH ||
        "./keys/kId-edUmioEvV6nLsG6l_ptplkikanikr2907.pem"
    );

    if (fs.existsSync(publicPemPath) && fs.existsSync(privatePemPath)) {
      publicKey = fs.readFileSync(publicPemPath, "utf8");
      privateKey = fs.readFileSync(privatePemPath, "utf8");
    }
  }

  const totalAmountStr = Number(order.total).toFixed(2);
  const fullName = order.address?.name || "Customer";
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Trendz";

  const payload = {
    merchantTxnId: order.orderNumber,
    paymentData: {
      totalAmount: totalAmountStr,
      txnCurrency: "INR",
    },
    clientData: {
      emailId: order.user?.email || "guest@lvstrendz.com",
      phoneNumber: order.address?.phone || order.user?.phone || "9999999999",
      firstName: firstName,
      lastName: lastName,
    },
    merchantCallbackURL: `${
      process.env.NEXT_PUBLIC_APP_URL || "https://lvstrendz.com"
    }/api/payment/callback`,
  };

  console.log("\n--- PAYLOAD CREATED FROM REAL LIVE ORDER ---");
  console.log(JSON.stringify(payload, null, 2));

  const secureTokens = await generateJWEAndJWS({
    payload,
    publicKey,
    privateKey,
    merchantId: process.env.PAYGLOCAL_MERCHANT_ID || "ptplkikanikr2907",
    publicKeyId: process.env.PAYGLOCAL_PUBLIC_KEY_ID || "8cc91c8d-8030-4660-a9c7-33de886fb495",
    privateKeyId: process.env.PAYGLOCAL_PRIVATE_KEY_ID || "kId-edUmioEvV6nLsG6l",
  });

  console.log("\n--- REAL ORDER JWE TOKEN ---");
  console.log(secureTokens.jweToken);

  console.log("\n--- REAL ORDER JWS TOKEN ---");
  console.log(secureTokens.jwsToken);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
