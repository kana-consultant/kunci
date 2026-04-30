import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { orpcClient } from "~/libs/orpc/client"

export interface BulkLeadRow {
	fullName: string
	email: string
	companyName: string
	companyWebsite: string
	painPoints?: string
	leadSource?: string
	linkedinUrl?: string
}

export interface BulkCaptureResult {
	created: any[]
	duplicates: { email: string; fullName: string; reason: string }[]
	invalid: { email: string; fullName: string; reason: string }[]
}

/**
 * Parses CSV text into an array of BulkLeadRow objects.
 * Supports both comma and semicolon delimiters.
 * Required headers: fullName, email, companyName, companyWebsite
 */
export function parseCSV(csvText: string): {
	rows: BulkLeadRow[]
	errors: string[]
} {
	const errors: string[] = []
	const lines = csvText.trim().split(/\r?\n/)

	if (lines.length < 2) {
		errors.push("CSV must have a header row and at least one data row")
		return { rows: [], errors }
	}

	// Auto-detect delimiter
	const delimiter = lines[0].includes(";") ? ";" : ","
	const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())

	// Map common header variations
	const headerMap: Record<string, string> = {
		fullname: "fullName",
		full_name: "fullName",
		name: "fullName",
		email: "email",
		email_address: "email",
		companyname: "companyName",
		company_name: "companyName",
		company: "companyName",
		companywebsite: "companyWebsite",
		company_website: "companyWebsite",
		website: "companyWebsite",
		painpoints: "painPoints",
		pain_points: "painPoints",
		leadsource: "leadSource",
		lead_source: "leadSource",
		source: "leadSource",
		linkedinurl: "linkedinUrl",
		linkedin_url: "linkedinUrl",
		linkedin: "linkedinUrl",
	}

	const mappedHeaders = headers.map((h) => headerMap[h] || h)

	// Validate required headers
	const requiredFields = ["fullName", "email", "companyName", "companyWebsite"]
	for (const field of requiredFields) {
		if (!mappedHeaders.includes(field)) {
			errors.push(`Missing required header: ${field}`)
		}
	}
	if (errors.length > 0) return { rows: [], errors }

	const rows: BulkLeadRow[] = []

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		const values = line.split(delimiter).map((v) => v.trim())
		const row: Record<string, string> = {}

		for (let j = 0; j < mappedHeaders.length; j++) {
			row[mappedHeaders[j]] = values[j] || ""
		}

		// Validate required fields
		if (!row.fullName || !row.email || !row.companyName || !row.companyWebsite) {
			errors.push(`Row ${i + 1}: Missing required fields`)
			continue
		}

		// Basic email format check
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
			errors.push(`Row ${i + 1}: Invalid email format (${row.email})`)
			continue
		}

		// Auto-prefix website with https:// if missing
		let website = row.companyWebsite
		if (website && !/^https?:\/\//.test(website)) {
			website = `https://${website}`
		}

		rows.push({
			fullName: row.fullName,
			email: row.email,
			companyName: row.companyName,
			companyWebsite: website,
			painPoints: row.painPoints || undefined,
			leadSource: row.leadSource || "Bulk Import",
			linkedinUrl: row.linkedinUrl || undefined,
		})
	}

	return { rows, errors }
}

export function useBulkCaptureLogic() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const [parsedRows, setParsedRows] = useState<BulkLeadRow[]>([])
	const [parseErrors, setParseErrors] = useState<string[]>([])
	const [result, setResult] = useState<BulkCaptureResult | null>(null)

	const {
		mutateAsync: bulkCapture,
		isPending,
		error,
	} = useMutation({
		mutationFn: async (leads: BulkLeadRow[]) => {
			return (orpcClient as any).lead.captureBulk({ leads })
		},
		onSuccess: (data: BulkCaptureResult) => {
			setResult(data)
			queryClient.invalidateQueries({ queryKey: ["lead"] })
		},
	})

	const handleFileUpload = useCallback((file: File) => {
		const reader = new FileReader()
		reader.onload = (e) => {
			const text = e.target?.result as string
			const { rows, errors } = parseCSV(text)
			setParsedRows(rows)
			setParseErrors(errors)
			setResult(null)
		}
		reader.readAsText(file)
	}, [])

	const handleTextPaste = useCallback((text: string) => {
		const { rows, errors } = parseCSV(text)
		setParsedRows(rows)
		setParseErrors(errors)
		setResult(null)
	}, [])

	const submitBulk = useCallback(async () => {
		if (parsedRows.length === 0) return
		await bulkCapture(parsedRows)
	}, [parsedRows, bulkCapture])

	const reset = useCallback(() => {
		setParsedRows([])
		setParseErrors([])
		setResult(null)
	}, [])

	return {
		parsedRows,
		parseErrors,
		result,
		isPending,
		error,
		handleFileUpload,
		handleTextPaste,
		submitBulk,
		reset,
		navigateToLeads: () => navigate({ to: "/leads" }),
	}
}
