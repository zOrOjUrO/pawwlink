# lib/notify — Notification Service

Reaches owners (or the community) once a match is found.

## Files
- `mock.ts` — `Notifier` interface + `MockNotifier` (console log, returns success).
- `index.ts` — `getNotifier()` factory.

## Decisions
- **Provider-agnostic interface, mock first** — demo the full reunification flow with zero SMS
  cost and no third-party flakiness; real providers slot in behind the same `sendSms`/`sendEmail`.

## Next steps
- Implement Twilio SMS, WhatsApp Business, and web push providers.
- Delivery receipts, retries, opt-in/opt-out, and a notification audit log.
- Templated, localized messages (NL/EN).
