/**
 * Port for email address verification.
 * Implementation: infrastructure/email-verification/mx-verifier.ts
 * Provider: Native Node.js dns module (zero dependencies)
 */
export interface EmailVerifier {
	verify(email: string): Promise<VerificationResult>
}

export interface VerificationResult {
	valid: boolean
	reason?: string
}
