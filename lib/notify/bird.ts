import type { Notifier } from "@/lib/notify/mock";
import messagebird from "messagebird";

const accessKey = process.env.BIRD_ACCESS_KEY;
const originator = process.env.BIRD_ORIGINATOR;

let client: any = null;

function getClient() {
  if (client) return client;
  if (!accessKey) {
    throw new Error("Bird notifier requires the BIRD_ACCESS_KEY environment variable.");
  }
  const messagebirdFactory = messagebird as unknown as (key: string) => any;
  client = messagebirdFactory(accessKey);
  return client;
}

export const birdNotifier: Notifier = {
  name: "bird",

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!originator) {
      throw new Error("Bird notifier requires the BIRD_ORIGINATOR environment variable.");
    }

    try {
      const birdClient = getClient();
      return new Promise((resolve) => {
        birdClient.messages.create(
          {
            originator,
            recipients: [to],
            body: message,
          },
          (err: unknown, response: any) => {
            if (err) {
              console.error(`[BirdNotifier] sendSms failed to ${to}:`, err);
              resolve(false);
            } else {
              console.info(
                `[BirdNotifier] sendSms to ${to} success id=${response?.id}`
              );
              resolve(Boolean(response?.id));
            }
          }
        );
      });
    } catch (error) {
      console.error(`[BirdNotifier] sendSms encountered a runtime error:`, error);
      return false;
    }
  },

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.warn(
      "[BirdNotifier] sendEmail is not supported by the Bird SMS provider."
    );
    return false;
  },
};
