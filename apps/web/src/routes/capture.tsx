import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { orpc } from "~/libs/orpc/client"
import { Sparkles } from "lucide-react"
import { useAppForm, Card, CardContent, CardFooter } from "@kana-consultant/ui-kit"
import { z } from "zod"

export const Route = createFileRoute("/capture")({
	component: CapturePage,
})

function CapturePage() {
	const navigate = useNavigate()

	const { mutate: captureLead, isPending, error } = useMutation(
		(orpc as any).lead.capture.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/leads" })
			},
		}),
	)

	const form = useAppForm({
		defaultValues: {
			fullName: "",
			email: "",
			companyName: "",
			companyWebsite: "",
			painPoints: "",
			leadSource: "Manual Entry",
		},
		onSubmit: async ({ value }) => {
			return new Promise((resolve, reject) => {
				;(captureLead as any)(
					{
						...value,
						painPoints: value.painPoints || undefined,
					},
					{
						onSuccess: resolve as any,
						onError: reject,
					}
				)
			})
		},
	})

	return (
		<div className="max-w-2xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-slate-900">Add New Lead</h1>
				<p className="text-sm text-slate-500 mt-1">
					The AI pipeline will automatically research, analyze, and generate a personalized email sequence.
				</p>
			</div>

			<Card>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						void form.handleSubmit()
					}}
				>
					<CardContent className="p-6 space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<form.AppField name="fullName" validators={{ onChange: z.string().min(1, "Required") }}>
								{(field) => <field.TextField label="Full Name" required placeholder="John Doe" />}
							</form.AppField>
							<form.AppField name="email" validators={{ onChange: z.string().email("Invalid email") }}>
								{(field) => <field.TextField label="Email Address" required placeholder="john@company.com" />}
							</form.AppField>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<form.AppField name="companyName" validators={{ onChange: z.string().min(1, "Required") }}>
								{(field) => <field.TextField label="Company Name" required placeholder="Acme Corp" />}
							</form.AppField>
							<form.AppField name="companyWebsite" validators={{ onChange: z.string().url("Must be a valid URL") }}>
								{(field) => <field.TextField label="Company Website" required placeholder="https://acme.com" />}
							</form.AppField>
						</div>

						<form.AppField name="painPoints">
							{(field) => (
								<field.TextareaField
									label="Pain Points (Optional)"
									placeholder="Any known pain points or specific context for the AI to use..."
								/>
							)}
						</form.AppField>
					</CardContent>

					<CardFooter className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
						{error ? (
							<p className="text-sm text-red-600">{(error as any).message || "An error occurred"}</p>
						) : (
							<div className="flex items-center gap-2 text-sm text-slate-500">
								<Sparkles className="w-4 h-4 text-amber-500" />
								The AI pipeline will start automatically after capture.
							</div>
						)}

						<form.AppForm>
							<form.SubmitButton>Capture Lead</form.SubmitButton>
						</form.AppForm>
					</CardFooter>
				</form>
			</Card>
		</div>
	)
}
