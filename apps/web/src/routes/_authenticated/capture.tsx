import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@kana-consultant/ui-kit"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"

import { useCaptureLogic } from "./_hooks/use-capture"

export const Route = createFileRoute("/_authenticated/capture")({
	component: CapturePage,
})

export function CapturePage() {
	const { form, isPending, error } = useCaptureLogic()

	return (
		<div className="max-w-2xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Add New Lead</h1>
				<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
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
				<Card>
					<CardHeader>
						<CardTitle>Lead Information</CardTitle>
						<CardDescription>
							Fill in the lead's details. Required fields are marked.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<form.AppField name="fullName">
								{(field) => (
									<field.TextField
										label="Full Name"
										required
										placeholder="John Doe"
									/>
								)}
							</form.AppField>

							<form.AppField name="email">
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
							<form.AppField name="companyName">
								{(field) => (
									<field.TextField
										label="Company Name"
										required
										placeholder="Acme Corp"
									/>
								)}
							</form.AppField>

							<form.AppField name="companyWebsite">
								{(field) => (
									<field.TextField
										label="Company Website"
										required
										placeholder="https://acme.com"
									/>
								)}
							</form.AppField>
						</div>

						<form.AppField name="painPoints">
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
							<div className="p-3 text-sm bg-[var(--color-danger-muted)] text-[var(--color-danger)] rounded-lg border border-[var(--color-danger)]">
								{(error as any)?.message || "Failed to capture lead"}
							</div>
						)}
					</CardContent>

					<CardFooter className="flex justify-end gap-3 border-t p-6 bg-[var(--color-muted-subtle)]">
						<Button
							type="button"
							variant="ghost"
							onClick={() => window.history.back()}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									loading={isPending || isSubmitting}
									disabled={!canSubmit}
									leadingIcon={<Sparkles className="w-4 h-4" />}
								>
									Capture & Run Pipeline
								</Button>
							)}
						</form.Subscribe>
					</CardFooter>
				</Card>
			</form>
		</div>
	)
}
