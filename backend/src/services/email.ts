import * as brevo from "@getbrevo/brevo";
import { Resource } from "sst";

const SENDER_NAME = "Wedding Admin";

export interface SendWelcomeEmailParams {
  recipientEmail: string;
  username: string;
  password: string;
}

export interface SendPasswordResetEmailParams {
  recipientEmail: string;
  username: string;
  temporaryPassword: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generate the beautiful HTML email template
 * Uses earthy/minimalist wedding theme with sage and sand colors
 */
function generateWelcomeEmailHtml(username: string, password: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Wedding Admin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #FAF8F5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAF8F5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with decorative element -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="font-size: 32px; color: #87A28F; margin-bottom: 8px;">&#10047;</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #5C7B62; letter-spacing: 2px;">
                Welcome
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280; letter-spacing: 1px;">
                WEDDING ADMIN PORTAL
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151; text-align: center;">
                Your admin account has been created successfully. Below are your login credentials.
              </p>

              <!-- Credentials box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAF8F5; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                            Username
                          </p>
                          <p style="margin: 4px 0 0 0; font-size: 18px; color: #374151; font-weight: 600;">
                            ${username}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 8px 0; border-top: 1px solid #E5E1DB;">
                          <p style="margin: 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                            Password
                          </p>
                          <p style="margin: 4px 0 0 0; font-size: 18px; color: #374151; font-family: 'Courier New', monospace; font-weight: 600;">
                            ${password}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #9CA3AF; text-align: center; font-style: italic;">
                Please keep your credentials secure and consider changing your password after your first login.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${loginUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #87A28F; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 1px; border-radius: 8px; text-transform: uppercase;">
                      Login to Admin Portal
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                Or copy this link: <br>
                <a href="${loginUrl}" style="color: #87A28F; word-break: break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #F3F0EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.5;">
                This is an automated message from the Wedding Admin System.<br>
                Please do not reply to this email.
              </p>
              <div style="text-align: center; margin-top: 16px;">
                <span style="font-size: 20px; color: #D4C5B5;">&#8226; &#8226; &#8226;</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
function generateWelcomeEmailText(username: string, password: string, loginUrl: string): string {
  return `
Welcome to Wedding Admin Portal
================================

Your admin account has been created successfully.

LOGIN CREDENTIALS
-----------------
Username: ${username}
Password: ${password}

LOGIN URL
---------
${loginUrl}

Please keep your credentials secure and consider changing your password after your first login.

---
This is an automated message from the Wedding Admin System.
Please do not reply to this email.
  `.trim();
}

/**
 * Generate the HTML email template for password reset
 */
function generatePasswordResetEmailHtml(username: string, temporaryPassword: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Wedding Admin</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #FAF8F5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAF8F5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with decorative element -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="font-size: 32px; color: #87A28F; margin-bottom: 8px;">&#128274;</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #5C7B62; letter-spacing: 2px;">
                Password Reset
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280; letter-spacing: 1px;">
                WEDDING ADMIN PORTAL
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151; text-align: center;">
                Your password has been reset by an administrator. Please use the temporary password below to log in.
              </p>

              <!-- Credentials box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAF8F5; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                            Username
                          </p>
                          <p style="margin: 4px 0 0 0; font-size: 18px; color: #374151; font-weight: 600;">
                            ${username}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 8px 0; border-top: 1px solid #E5E1DB;">
                          <p style="margin: 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">
                            Temporary Password
                          </p>
                          <p style="margin: 4px 0 0 0; font-size: 18px; color: #374151; font-family: 'Courier New', monospace; font-weight: 600;">
                            ${temporaryPassword}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Important notice -->
              <div style="background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #92400E; text-align: center;">
                  <strong>Important:</strong> You will be required to change your password immediately after logging in.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${loginUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #87A28F; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 1px; border-radius: 8px; text-transform: uppercase;">
                      Login to Admin Portal
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                Or copy this link: <br>
                <a href="${loginUrl}" style="color: #87A28F; word-break: break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #F3F0EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.5;">
                This is an automated message from the Wedding Admin System.<br>
                Please do not reply to this email.
              </p>
              <div style="text-align: center; margin-top: 16px;">
                <span style="font-size: 20px; color: #D4C5B5;">&#8226; &#8226; &#8226;</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the password reset email
 */
function generatePasswordResetEmailText(username: string, temporaryPassword: string, loginUrl: string): string {
  return `
Password Reset - Wedding Admin Portal
=====================================

Your password has been reset by an administrator.

LOGIN CREDENTIALS
-----------------
Username: ${username}
Temporary Password: ${temporaryPassword}

IMPORTANT: You will be required to change your password immediately after logging in.

LOGIN URL
---------
${loginUrl}

---
This is an automated message from the Wedding Admin System.
Please do not reply to this email.
  `.trim();
}

/**
 * Send welcome email to newly created admin user
 * Returns success status - failures should not prevent user creation
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<EmailResult> {
  const { recipientEmail, username, password } = params;

  // Get configuration from SST secrets
  const senderEmail = Resource.SenderEmail.value;
  const adminLoginUrl = Resource.AdminLoginUrl.value;

  try {
    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();

    // Set API key
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      Resource.BrevoApiKey.value
    );

    // Prepare the email
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "Wedding Admin Portal - Your Login Credentials";
    sendSmtpEmail.htmlContent = generateWelcomeEmailHtml(username, password, adminLoginUrl);
    sendSmtpEmail.textContent = generateWelcomeEmailText(username, password, adminLoginUrl);

    sendSmtpEmail.sender = {
      name: SENDER_NAME,
      email: senderEmail,
    };

    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: username,
      },
    ];

    // Send the email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: result.body.messageId,
    };
  } catch (error) {
    console.error("Failed to send welcome email:", error);

    // Extract error message
    const errorMessage = error instanceof Error ? error.message : "Unknown email error";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send password reset email to admin user
 * Returns success status - failures should not prevent password reset
 */
export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<EmailResult> {
  const { recipientEmail, username, temporaryPassword } = params;

  // Get configuration from SST secrets
  const senderEmail = Resource.SenderEmail.value;
  const adminLoginUrl = Resource.AdminLoginUrl.value;

  try {
    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();

    // Set API key
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      Resource.BrevoApiKey.value
    );

    // Prepare the email
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "Wedding Admin Portal - Password Reset";
    sendSmtpEmail.htmlContent = generatePasswordResetEmailHtml(username, temporaryPassword, adminLoginUrl);
    sendSmtpEmail.textContent = generatePasswordResetEmailText(username, temporaryPassword, adminLoginUrl);

    sendSmtpEmail.sender = {
      name: SENDER_NAME,
      email: senderEmail,
    };

    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: username,
      },
    ];

    // Send the email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: result.body.messageId,
    };
  } catch (error) {
    console.error("Failed to send password reset email:", error);

    // Extract error message
    const errorMessage = error instanceof Error ? error.message : "Unknown email error";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
