// Ambient stubs for optional notifier SDKs (messagebird ships no types;
// nodemailer needs @types/nodemailer which we don't depend on). These let the
// providers typecheck and build; the real packages are loaded at runtime only
// when NOTIFIER_PROVIDER selects them.
declare module "messagebird";
declare module "nodemailer";
