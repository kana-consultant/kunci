import { useAppForm } from "@kana-consultant/ui-kit"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { orpc } from "~/libs/orpc/client"

function isLinkedInUrl(value: string): boolean {
	try {
		const hostname = new URL(value).hostname.toLowerCase()
		return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")
	} catch {
		return false
	}
}

export const captureFieldSchemas = {
	fullName: z.string().min(1, "Name is required"),
	email: z.string().email("Valid email is required"),
	companyName: z.string().min(1, "Company name is required"),
	companyWebsite: z.string().url("Valid website URL is required"),
	painPoints: z.string().optional(),
	linkedinUrl: z
		.string()
		.url("Valid LinkedIn URL is required")
		.refine(isLinkedInUrl, "URL must use linkedin.com")
		.optional()
		.or(z.literal("")),
}

export type CaptureFormValues = {
	fullName: string
	email: string
	companyName: string
	companyWebsite: string
	painPoints?: string
	linkedinUrl?: string
}

export function useCaptureLogic() {
	const navigate = useNavigate()
	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const {
		mutateAsync: captureLead,
		isPending,
		error,
	} = useMutation((orpc.lead.capture as any).mutationOptions())

	const form = useAppForm({
		defaultValues: {
			fullName: "",
			email: "",
			companyName: "",
			companyWebsite: "",
			painPoints: "",
			linkedinUrl: "",
		} as CaptureFormValues,
		onSubmit: async ({ value }) => {
			await captureLead({
				...value,
				linkedinUrl: value.linkedinUrl?.trim() || undefined,
				leadSource: "Manual Entry",
			} as any)

			// Show success briefly, then navigate
			setSuccessMessage(
				`Lead "${value.fullName}" captured! Pipeline is running in the background.`,
			)
			setTimeout(() => {
				navigate({ to: "/leads" })
			}, 1500)
		},
	})

	return {
		form,
		isPending,
		error,
		successMessage,
	}
}
