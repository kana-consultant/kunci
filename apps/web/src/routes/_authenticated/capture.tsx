import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@kana-consultant/ui-kit"
import { createFileRoute } from "@tanstack/react-router"
import { CheckCircle2, Sparkles } from "lucide-react"

import { captureFieldSchemas, useCaptureLogic } from "./_hooks/-use-capture"

export const Route = createFileRoute("/_authenticated/capture")({
	component: CapturePage,
})

function CapturePage() {
	const { form, error, successMessage } = useCaptureLogic()

	// Success state — show confirmation while redirecting
	if (successMessage) {
		return (
			<div className="space-y-6">
				<Card className="max-w-2xl">
					<CardContent className="p-12 text-center space-y-4">
						<div
							className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
							style={{ background: "var(--color-success-muted)" }}
						>
							<CheckCircle2
								className="w-8 h-8"
								style={{ color: "var(--color-success)" }}
							/>
						</div>
						<h2 className="text-xl font-semibold">Lead Captured!</h2>
						<p style={{ color: "var(--color-muted-foreground)" }}>
							{successMessage}
						</p>
						<p
							className="text-sm"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Redirecting to leads...
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Add New Lead</h1>
				<p
					className="text-sm mt-1"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					The AI pipeline will automatically research, analyze, and generate a
					personalized email sequence.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Lead Information</CardTitle>
						<p
							className="text-sm"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Fill in the lead's details. Required fields are marked.
						</p>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<form.AppField
								name="fullName"
								validators={{
									onChange: captureFieldSchemas.fullName,
									onBlur: captureFieldSchemas.fullName,
								}}
							>
								{(field) => (
									<field.TextField
										label="Full Name"
										required
										placeholder="John Doe"
									/>
								)}
							</form.AppField>

							<form.AppField
								name="email"
								validators={{
									onChange: captureFieldSchemas.email,
									onBlur: captureFieldSchemas.email,
								}}
							>
								{(field) => (
									<field.TextField
										label="Email Address"
										required
										type="email"
										placeholder="john@company.com"
									/>
								)}
							</form.AppField>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<form.AppField
								name="companyName"
								validators={{
									onChange: captureFieldSchemas.companyName,
									onBlur: captureFieldSchemas.companyName,
								}}
							>
								{(field) => (
									<field.TextField
										label="Company Name"
										required
										placeholder="Acme Corp"
									/>
								)}
							</form.AppField>

							<form.AppField
								name="companyWebsite"
								validators={{
									onChange: captureFieldSchemas.companyWebsite,
									onBlur: captureFieldSchemas.companyWebsite,
								}}
							>
								{(field) => (
									<field.TextField
										label="Company Website"
										required
										placeholder="https://acme.com"
									/>
								)}
							</form.AppField>
						</div>

						<form.AppField
							name="linkedinUrl"
							validators={{
								onChange: captureFieldSchemas.linkedinUrl,
								onBlur: captureFieldSchemas.linkedinUrl,
							}}
						>
							{(field) => (
								<field.TextField
									label="LinkedIn Profile URL (Optional)"
									placeholder="https://linkedin.com/in/johndoe"
									description="Allowing the AI to research the person directly provides better personalization."
								/>
							)}
						</form.AppField>

						<form.AppField
							name="painPoints"
							validators={{
								onChange: captureFieldSchemas.painPoints,
								onBlur: captureFieldSchemas.painPoints,
							}}
						>
							{(field) => (
								<field.TextareaField
									label="Pain Points (Optional)"
									placeholder="e.g. Struggling with lead quality, slow response times..."
									rows={4}
									description="Adding specific pain points helps the AI craft a more relevant message."
								/>
							)}
						</form.AppField>

						{error && (
							<div
								className="p-3 text-sm rounded-xl border"
								style={{
									background: "var(--color-danger-muted)",
									color: "var(--color-danger)",
									borderColor: "var(--color-danger)",
								}}
							>
								{(error as any)?.message || "Failed to capture lead"}
							</div>
						)}
					</CardContent>

					<CardFooter
						className="flex justify-end gap-3 border-t p-6"
						style={{ background: "var(--color-surface-alt)" }}
					>
						<Button
							type="button"
							variant="ghost"
							onClick={() => window.history.back()}
						>
							Cancel
						</Button>
						<form.AppForm>
							<form.SubmitButton leadingIcon={<Sparkles className="w-4 h-4" />}>
								Capture & Run Pipeline
							</form.SubmitButton>
						</form.AppForm>
					</CardFooter>
				</Card>
			</form>
		</div>
	)
}
