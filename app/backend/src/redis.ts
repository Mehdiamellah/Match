import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "redis://redis:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

redis.on("connect", () => console.log("✅ Redis connecté"));
redis.on("error", (e) =>
  console.error("⚠️ Redis indisponible — la DB prend le relais:", e.message));

export default redis;