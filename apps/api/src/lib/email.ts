import { Resend } from 'resend';

/**
 * Email service using Resend.
 *
 * Uses RESEND_API_KEY from environment. Falls back to a no-op
 * in development if the key is not set (logs a warning).
 *
 * NEVER use console.log — use the logger parameter for structured logging.
 */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface Logger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  resendClient = new Resend(apiKey);
  return resendClient;
}

const DEFAULT_FROM = 'Akount <noreply@akount.app>';

/**
 * Send an email via Resend.
 *
 * @param options - Email options (to, subject, html, attachments)
 * @param logger - Pino logger instance (request.log or server.log)
 * @returns Send result with success status and messageId
 */
export async function sendEmail(
  options: SendEmailOptions,
  logger: Logger
): Promise<SendEmailResult> {
  const client = getResendClient();

  if (!client) {
    logger.warn(
      { to: options.to, subject: options.subject },
      'RESEND_API_KEY not set — email not sent (development mode)'
    );
    return {
      success: true,
      messageId: 'dev-noop',
    };
  }

  const maxRetries = 1;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await client.emails.send({
        from: options.from ?? DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      if (result.error) {
        lastError = result.error.message;
        logger.error(
          { attempt, error: result.error, to: options.to },
          'Resend API returned error'
        );

        if (attempt < maxRetries) continue;
        return { success: false, error: lastError };
      }

      logger.info(
        { messageId: result.data?.id, to: options.to, subject: options.subject },
        'Email sent successfully'
      );

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown email error';
      logger.error(
        { attempt, error: lastError, to: options.to },
        'Email send failed'
      );

      if (attempt < maxRetries) continue;
    }
  }

  return { success: false, error: lastError };
}
