import { Kafka } from 'kafkajs';

// 1. Le client — même reflexe que redis.ts : var d'env + fallback
const kafka = new Kafka({
  clientId: 'match-backend',
  brokers: [process.env.KAFKA_BROKERS ?? 'kafka:9092'],
});

// 2. Le producteur + connexion UNE fois, au chargement du module
const producer = kafka.producer();

producer.connect()
  .then(() => console.log('✅ Kafka connecté'))
  .catch((e) =>
    console.error('⚠️ Kafka indisponible — notifications non publiées:', e.message));

// 3. La fonction que les routes appelleront
export async function publierEvenement(topic: string, payload: unknown) {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  } catch (e) {
    console.error('⚠️ Publication Kafka échouée:', (e as Error).message);
  }
}