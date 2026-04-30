import { promises as dns } from "node:dns"
import type {
  EmailVerifier,
  VerificationResult,
} from "#/domain/ports/email-verifier.ts"

/**
 * Email verification via DNS MX record lookup.
 * Zero external dependencies — uses Node.js built-in dns module.
 */
export function createMxVerifier(): EmailVerifier {
  return {
    async verify(email: string): Promise<VerificationResult> {
      const parts = email.split("@")
      if (parts.length !== 2) {
        return { valid: false, reason: "Invalid email format" }
      }

      const domain = parts[1]
      if (!domain || domain.length === 0) {
        return { valid: false, reason: "Missing domain" }
      }

      try {
        const mxRecords = await dns.resolveMx(domain)
        if (mxRecords.length > 0) {
          return { valid: true }
        }
        return { valid: false, reason: "No MX records found" }
      } catch (error) {
        const dnsError = error as NodeJS.ErrnoException
        if (dnsError.code === "ENOTFOUND" || dnsError.code === "ENODATA") {
          return { valid: false, reason: "Domain does not exist" }
        }
        return { valid: false, reason: `DNS lookup failed: ${dnsError.code}` }
      }
    },
  }
}
