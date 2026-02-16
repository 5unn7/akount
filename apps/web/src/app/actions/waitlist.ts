'use server'

interface WaitlistResult {
  success: boolean
  message: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  const email = formData.get('email')

  if (!email || typeof email !== 'string') {
    return { success: false, message: 'Email is required.' }
  }

  const trimmed = email.trim().toLowerCase()

  if (!EMAIL_REGEX.test(trimmed)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  // TODO: Wire up external email service (Resend, ConvertKit, Mailchimp)
  // For now, log server-side and return success
  // Replace this block with your provider's API call:
  //
  // Example with Resend:
  //   await resend.contacts.create({ email: trimmed, audienceId: '...' })
  //
  // Example with ConvertKit:
  //   await fetch('https://api.convertkit.com/v3/forms/{formId}/subscribe', {
  //     method: 'POST',
  //     body: JSON.stringify({ api_key: process.env.CONVERTKIT_API_KEY, email: trimmed }),
  //   })

  console.log(`[Waitlist] New signup: ${trimmed}`)

  return { success: true, message: "You're on the list!" }
}
