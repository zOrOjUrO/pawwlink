// MockNotifier — logs to the console and returns fake success. Zero setup.

export interface Notifier {
  readonly name: string;
  sendSms(to: string, message: string): Promise<boolean>;
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

export const mockNotifier: Notifier = {
  name: "mock",

  async sendSms(to: string, message: string): Promise<boolean> {
    console.log(`\n📱 [MOCK SMS] to ${to}:\n   ${message}\n`);
    return true;
  },

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`\n✉️  [MOCK EMAIL] to ${to} | ${subject}:\n   ${body}\n`);
    return true;
  },
};
