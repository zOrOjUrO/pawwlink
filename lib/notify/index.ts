// Notifier interface + factory. MockNotifier only for now.
import type { Notifier } from "@/lib/notify/mock";
import { mockNotifier } from "@/lib/notify/mock";

export type { Notifier } from "@/lib/notify/mock";

export function getNotifier(): Notifier {
  // Only "mock" is wired today. Twilio/Bird providers slot in here later by
  // reading process.env.NOTIFIER_PROVIDER and returning the matching impl.
  return mockNotifier;
}
