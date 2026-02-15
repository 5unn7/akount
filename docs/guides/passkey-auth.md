# Passkey Authentication for Akount

## Overview

Akount uses **passkeys** as the primary authentication method, providing a modern, secure, and frictionless login experience across all platforms.

## What are Passkeys?

Passkeys are a passwordless authentication standard built on **WebAuthn** (Web Authentication API). They use public-key cryptography and biometric authentication to provide:

- **Higher security** - Resistant to phishing, credential stuffing, and password breaches
- **Better UX** - No passwords to remember, instant biometric login
- **Cross-platform** - Works on Windows, Mac, iOS, Android, Linux
- **Device redundancy** - Users can register multiple devices
- **Auto-sync** - Via iCloud Keychain (Apple) and Google Password Manager (Android)

## Platform Support

### Desktop

- **Windows 10/11**: Windows Hello (fingerprint, facial recognition, PIN)
- **macOS**: Touch ID, Face ID (on supported Macs)
- **Linux**: FIDO2-compatible authenticators

### Mobile

- **iOS 16+**: Face ID, Touch ID with iCloud Keychain sync
- **Android 9+**: Biometric authentication with Google Password Manager sync

## How It Works

### Registration Flow

1. User signs up with email
2. System prompts to create a passkey
3. User authenticates with biometric (Face ID, Touch ID, Windows Hello, etc.)
4. Device generates a cryptographic key pair:
   - **Private key** - Stored securely on device (never leaves device)
   - **Public key** - Stored on Akount servers
5. Passkey is registered and named (e.g., "iPhone 15 Pro", "Work Laptop")

### Login Flow

1. User enters email (or selects from saved accounts)
2. System challenges for passkey authentication
3. User authenticates with biometric
4. Device signs challenge with private key
5. Server verifies signature with public key
6. User is logged in

### Multi-Device Support

- Users can register passkeys for multiple devices (phone, laptop, tablet)
- Each device has its own key pair
- Users can manage passkeys in account settings (add, rename, remove)

### Sync Across Devices

- **Apple ecosystem**: Passkeys sync via iCloud Keychain (iPhone, iPad, Mac)
- **Android ecosystem**: Passkeys sync via Google Password Manager
- **Cross-platform**: Users can register passkeys on both Apple and Android devices

## Fallback Authentication

While passkeys are the primary method, Akount provides fallback options:

### Email Magic Links

- User enters email
- System sends one-time login link
- Click link to authenticate
- No password required

### Traditional Password + MFA (Optional)

- User can optionally set a password
- MFA required for password-based login:
  - TOTP (Google Authenticator, Authy, etc.)
  - Email OTP
  - SMS OTP (premium feature)

## Implementation Details

### Technology: Clerk

Akount uses **Clerk** for authentication, which has built-in passkey support via WebAuthn.

#### Clerk Configuration

```typescript
{
  // Enable passkeys as primary authentication
  signIn: {
    passkeys: true,
    emailLink: true,  // Fallback
    password: true,   // Optional fallback
  },

  // Passkey settings
  passkeys: {
    enabled: true,
    allowMultiple: true,  // Users can register multiple devices
    namingRequired: true, // Prompt users to name their passkeys
  },

  // Multi-factor authentication
  mfa: {
    enabled: true,
    required: false,  // Optional for password-based login
    methods: ['totp', 'email_otp'],
  },
}
```

#### API Integration

```typescript
// Register a passkey
await clerk.user.createPasskey({
  name: 'iPhone 15 Pro',
})

// Sign in with passkey
await clerk.client.signIn.authenticateWithPasskey()

// List user's passkeys
const passkeys = await clerk.user.passkeys.list()

// Remove a passkey
await clerk.user.passkeys.delete(passkeyId)
```

## User Experience Flow

### First-Time User

1. User visits Akount
2. Clicks "Sign Up"
3. Enters email and workspace name
4. System prompts: "Secure your account with Face ID / Touch ID / Windows Hello"
5. User authenticates with biometric
6. Account created, passkey registered
7. User is logged in

### Returning User

1. User visits Akount
2. Clicks "Sign In"
3. System shows: "Sign in with Face ID" (or Touch ID, Windows Hello)
4. User authenticates with biometric
5. User is logged in (< 2 seconds)

### New Device Setup

1. User visits Akount on new device
2. Enters email
3. System sends magic link to email
4. User clicks link, authenticates
5. System prompts: "Add this device for quick sign-in?"
6. User authenticates with biometric
7. Passkey registered for new device

### Device Management

1. User goes to Settings → Security → Passkeys
2. Sees list of registered devices:
   - iPhone 15 Pro (registered Jan 15, 2026)
   - MacBook Pro (registered Jan 10, 2026)
   - Work Laptop (registered Dec 20, 2025)
3. Can rename or remove devices
4. "Add New Passkey" button to register current device

## Security Benefits

### Resistant to Common Attacks

- **Phishing** - Private key never leaves device, can't be stolen
- **Password reuse** - No passwords to reuse
- **Credential stuffing** - No shared credentials to stuff
- **Man-in-the-middle** - Challenge-response tied to domain
- **Social engineering** - Can't trick users into revealing something they don't have

### Regulatory Compliance

- **GDPR** - Reduces personal data storage (no passwords)
- **SOC 2** - Strong authentication controls
- **PCI DSS** - Multi-factor authentication by design
- **NIST 800-63B** - Meets AAL3 (highest authentication assurance level)

## Cost Implications

Clerk includes passkey support in all tiers:

- **Free tier** - 10,000 monthly active users
- **Pro tier** - $25/mo for first 100 MAU, then usage-based
- **Enterprise** - Custom pricing

No additional cost for passkey authentication (included in base Clerk pricing).

## Migration Path

### Phase 1: Launch (Week 1-2)

- Enable passkeys as primary authentication
- Email magic links as fallback
- Passkey management UI

### Phase 2: Enhancements (Week 8-12)

- Optional password + MFA for users who prefer it
- Security keys (YubiKey) support via WebAuthn
- Device trust scoring

### Phase 3: Advanced Features (Phase 3)

- Passkey recovery flows (for lost all devices)
- Organization-wide passkey policies
- Conditional authentication (high-risk actions require re-auth)

## User Communication

### Marketing Messaging

- "Sign in with your face or fingerprint - no passwords needed"
- "Your accounting data, secured by biometrics"
- "Faster than typing a password, more secure than any other method"

### Onboarding Copy
>
> **Welcome to Akount!** We use passkeys to keep your financial data secure. You'll sign in with Face ID, Touch ID, or Windows Hello - no passwords to remember. Let's set that up now.

### Help Documentation

- "What are passkeys and why should I use them?"
- "How do I add a new device?"
- "What if I lose my device?"
- "Can I still use a password if I prefer?"

## Testing Checklist

- [ ] Passkey registration works on iOS (Face ID)
- [ ] Passkey registration works on iOS (Touch ID)
- [ ] Passkey registration works on Android (fingerprint)
- [ ] Passkey registration works on macOS (Touch ID)
- [ ] Passkey registration works on Windows (Windows Hello)
- [ ] Passkey login works on all platforms
- [ ] iCloud Keychain sync works (passkey created on iPhone, used on Mac)
- [ ] Google Password Manager sync works (passkey created on Android phone, used on Android tablet)
- [ ] Multiple passkeys per user works
- [ ] Passkey management UI (rename, remove) works
- [ ] Email magic link fallback works
- [ ] Error handling for unsupported browsers/devices
- [ ] Grace period for new device registration

## Success Metrics

### Adoption

- % of users with at least one passkey registered
- % of logins via passkey (vs email/password)
- Average time to login (passkey vs other methods)

### Security

- Phishing attempt success rate (should be 0%)
- Password reset requests (should decrease)
- Account takeover attempts (should decrease)

### UX

- Login friction (time from click to authenticated)
- Support tickets related to login issues
- User satisfaction with authentication

## References

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-3/)
- [FIDO Alliance Passkeys Guide](https://fidoalliance.org/passkeys/)
- [Clerk Passkeys Documentation](https://clerk.com/docs/authentication/passkeys)
- [Apple Passkeys](https://developer.apple.com/passkeys/)
- [Google Passkeys](https://developers.google.com/identity/passkeys)
- [Microsoft Passkeys](https://support.microsoft.com/en-us/windows/passkeys-in-windows-301c8944-5ea2-452b-9886-97e4d2ef4422)
