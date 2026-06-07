// Notifier interface + factory.
import type { Notifier } from "@/lib/notify/mock";
import { mockNotifier } from "@/lib/notify/mock";
import { birdNotifier } from "@/lib/notify/bird";
import { emailNotifier } from "@/lib/notify/email";

export type { Notifier } from "@/lib/notify/mock";

export function getNotifier(): Notifier {
  const provider = (process.env.NOTIFIER_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "mock":
      return mockNotifier;
    case "bird":
      return birdNotifier;
    case "email":
      return emailNotifier;
    default:
      console.warn(
        `[pawlink] unknown NOTIFIER_PROVIDER='${provider}' — falling back to mock notifier.`
      );
      return mockNotifier;
  }
}
