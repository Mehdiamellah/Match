import redis from "./redis";

export const TTL_OFFRES = 30; // secondes — les offres de match vivent vite

/** cache-aside avec fail-open : redis mort = pas de crash, juste plus lent */
export async function cacheAside<T>(
  cle: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get(cle);
    if (hit) {
      console.log(`🟢 HIT ${cle}`);
      return JSON.parse(hit) as T;
    }
  } catch {
    // redis indisponible → la DB prend le relais (ton principe "optimisation, pas dépendance")
  }

  const frais = await fetcher();

  try {
    await redis.set(cle, JSON.stringify(frais), "EX", ttl);
  } catch {
    // même patience en écriture : jamais bloquer sur le cache
  }
  console.log(`🟡 MISS ${cle} (écrite, TTL ${ttl}s)`);
  return frais;
}

/** purge du namespace offres — appelée à chaque ÉCRITURE */
export async function invaliderOffres(): Promise<void> {
  try {
    const cles = await redis.keys("offres:*");
    if (cles.length > 0) {
      await redis.del(...cles);
      console.log(`🧹 invalide ${cles.length} clé(s) du cache offres`);
    }
  } catch {
    // pas de redis = rien à invalider
  }
}