# lib/notify — Notification Service

Reaches owners (or the community) once a match is found.

## Files
- `mock.ts` — `Notifier` interface + `MockNotifier` (console log, returns success).
- `index.ts` — `getNotifier()` factory.

## Decisions
- **Provider-agnostic interface, mock first** — demo the full reunification flow with zero SMS
  cost and no third-party flakiness; real providers slot in behind the same `sendSms`/`sendEmail`.

## Next steps
- Implement Bird SMS, WhatsApp Business, and web push providers.
- Delivery receipts, retries, opt-in/opt-out, and a notification audit log.
- Templated, localized messages (NL/EN).

## Configuration
Set `NOTIFIER_PROVIDER=bird` to enable real outbound SMS via Bird.
The Bird provider requires:
- `BIRD_ACCESS_KEY`
- `BIRD_ORIGINATOR`

When `NOTIFIER_PROVIDER` is unset or set to `mock`, the app uses `MockNotifier`.
