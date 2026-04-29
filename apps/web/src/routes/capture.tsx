import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { orpc } from "~/libs/orpc/client"
import {
	Button,
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
	Input,
	Label,
	Textarea,
} from "@kana-consultant/ui-kit"
import { useState } from "react"
import { Sparkles } from "lucide-react"

export const Route = createFileRoute("/capture")({
	component: CapturePage,
})

function CapturePage() {
	const navigate = useNavigate()

	const [form, setForm] = useState({
		fullName: "",
		email: "",
		companyName: "",
		companyWebsite: "",
		painPoints: "",
		leadSource: "Manual Entry",
	})

	const { mutate: captureLead, isPending, error } = useMutation(
		orpc.lead.capture.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/leads" })
			},
		}),
	)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		const mutate = captureLead as any;
		mutate({
			fullName: form.fullName,
			email: form.email,
			companyName: form.companyName,
			companyWebsite: form.companyWebsite,
			painPoints: form.painPoints || undefined,
			leadSource: form.leadSource,
		})
	}

	function updateField(field: string, value: string) {
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	return (
		<div className="max-w-2xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Add New Lead</h1>
				<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
					The AI pipeline will automatically research, analyze, and generate a
					personalized email sequence.
				</p>
			</div>

			<form onSubmit={handleSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>Lead Information</CardTitle>
						<CardDescription>
							Fill in the lead's details. Required fields are marked.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="fullName" required>
									Full Name
								</Label>
								<Input
									id="fullName"
									type="text"
									required
									value={form.fullName}
									onChange={(e) => updateField("fullName", e.target.value)}
									placeholder="John Doe"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email" required>
									Email Address
								</Label>
								<Input
									id="email"
									type="email"
									required
									value={form.email}
									onChange={(e) => updateField("email", e.target.value)}
									placeholder="john@company.com"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="companyName" required>
									Company Name
								</Label>
								<Input
									id="companyName"
									type="text"
									required
									value={form.companyName}
									onChange={(e) => updateField("companyName", e.target.value)}
									placeholder="Acme Corp"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="companyWebsite" required>
									Company Website
								</Label>
								<Input
									id="companyWebsite"
									type="url"
									required
									value={form.companyWebsite}
									onChange={(e) =>
										updateField("companyWebsite", e.target.value)
									}
									placeholder="https://acme.com"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="painPoints">
								Pain Points{" "}
								<span className="text-[var(--color-muted-foreground)] font-normal">
									(Optional)
								</span>
							</Label>
							<Textarea
								id="painPoints"
								rows={3}
								value={form.painPoints}
								onChange={(e) => updateField("painPoints", e.target.value)}
								placeholder="Any known pain points or specific context for the AI to use..."
							/>
						</div>
					</CardContent>

					<CardFooter className="flex items-center justify-between">
						{error ? (
							<p className="text-sm text-[var(--color-danger)]">
								{error.message || "An error occurred"}
							</p>
						) : (
							<div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
								<Sparkles className="w-4 h-4 text-[var(--color-warning)]" />
								The AI pipeline will start automatically after capture.
							</div>
						)}

						<Button type="submit" loading={isPending}>
							Capture Lead
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	)
}
