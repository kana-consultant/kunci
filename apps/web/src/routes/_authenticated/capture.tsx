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
import { useRef } from "react"
import { Sparkles } from "lucide-react"

export const Route = createFileRoute("/_authenticated/capture")({
	component: CapturePage,
})

function CapturePage() {
	const navigate = useNavigate()
	const formRef = useRef<HTMLFormElement>(null)

	const { mutate: captureLead, isPending, error } = useMutation(
		orpc.lead.capture.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/_authenticated/leads" })
			},
		}),
	)

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)
		const data = {
			fullName: formData.get("fullName") as string,
			email: formData.get("email") as string,
			companyName: formData.get("companyName") as string,
			companyWebsite: formData.get("companyWebsite") as string,
			painPoints: (formData.get("painPoints") as string) || undefined,
			leadSource: "Manual Entry",
		}
		const mutate = captureLead as any
		mutate(data)
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

			<form ref={formRef} onSubmit={handleSubmit}>
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
									name="fullName"
									type="text"
									required
									placeholder="John Doe"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email" required>
									Email Address
								</Label>
								<Input
									id="email"
									name="email"
									type="email"
									required
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
									name="companyName"
									type="text"
									required
									placeholder="Acme Corp"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="companyWebsite" required>
									Company Website
								</Label>
								<Input
									id="companyWebsite"
									name="companyWebsite"
									type="url"
									required
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
								name="painPoints"
								rows={3}
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
