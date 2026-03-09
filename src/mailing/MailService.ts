export class MailService {
  static async send(to: string, subject: string, html: string): Promise<void> {
    console.log(`[Mail] Sending to: ${to} | Subject: ${subject}`);
    console.log(`[Mail] HTML preview: ${html.substring(0, 100)}...`);
  }
}
