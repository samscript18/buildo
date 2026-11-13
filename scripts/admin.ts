import { MongoClient } from "mongodb";
const email = process.argv[2];
if (!email || !process.env.MONGODB_URI)
  throw new Error("Usage: npm run admin:grant -- registered@example.com");
const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const result = await client
    .db()
    .collection("user")
    .updateOne({ email: email.toLowerCase() }, { $set: { role: "admin" } });
  if (!result.matchedCount) throw new Error("Register this account first.");
  console.log("Admin role granted to the registered account.");
} finally {
  await client.close();
}
