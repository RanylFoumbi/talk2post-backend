export class EmailTemplate {
  static welcome(name: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to Talk2Post! 🎉</h1>
        <p>Hey ${name},</p>
        <p>Thanks for signing up. We're excited to have you on board.</p>
        <p>Start creating amazing posts from your voice today!</p>
        <br/>
        <p style="color: #888;">— The Talk2Post Team</p>
      </div>
    `;
  }

  static passwordReset(resetLink: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Reset Your Password</h1>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background: #6366f1; 
                  color: white; text-decoration: none; border-radius: 8px;">
          Reset Password
        </a>
        <p style="color: #888; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;
  }
}
