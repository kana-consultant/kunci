import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Textarea,
} from "@kana-consultant/ui-kit"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"

import { useCaptureLogic } from "./_hooks/use-capture"

export const Route = createFileRoute("/_authenticated/capture")({
	component: CapturePage,
})

function CapturePage() {
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
							<form.Field
								name="fullName"
								children={(field: any) => (
									<div className="space-y-2">
										<Label htmlFor={field.name} required>
											Full Name
										</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="John Doe"
										/>
										{field.state.meta.errors ? (
											<p className="text-xs text-[var(--color-danger)]">
												{field.state.meta.errors.join(", ")}
											</p>
										) : null}
									</div>
								)}
							/>

							<form.Field
								name="email"
								children={(field: any) => (
									<div className="space-y-2">
										<Label htmlFor={field.name} required>
											Email Address
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="john@company.com"
										/>
										{field.state.meta.errors ? (
											<p className="text-xs text-[var(--color-danger)]">
												{field.state.meta.errors.join(", ")}
											</p>
										) : null}
									</div>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<form.Field
								name="companyName"
								children={(field: any) => (
									<div className="space-y-2">
										<Label htmlFor={field.name} required>
											Company Name
										</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Acme Corp"
										/>
										{field.state.meta.errors ? (
											<p className="text-xs text-[var(--color-danger)]">
												{field.state.meta.errors.join(", ")}
											</p>
										) : null}
									</div>
								)}
							/>

							<form.Field
								name="companyWebsite"
								children={(field: any) => (
									<div className="space-y-2">
										<Label htmlFor={field.name} required>
											Company Website
										</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://acme.com"
										/>
										{field.state.meta.errors ? (
											<p className="text-xs text-[var(--color-danger)]">
												{field.state.meta.errors.join(", ")}
											</p>
										) : null}
									</div>
								)}
							/>
						</div>

						<form.Field
							name="painPoints"
							children={(field: any) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Pain Points (Optional)</Label>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g. Struggling with lead quality, slow response times..."
										rows={4}
									/>
									<p className="text-[10px] text-[var(--color-muted-foreground)]">
										Adding specific pain points helps the AI craft a more
										relevant message.
									</p>
								</div>
							)}
						/>

						{error && (
							<div className="p-3 text-sm bg-[var(--color-danger-muted)] text-[var(--color-danger)] rounded-lg border border-[var(--color-danger)]">
								{(error as any)?.message || "Failed to capture lead"}
							</div>
						)}
					</CardContent>

					<CardFooter className="flex justify-end gap-3 border-t p-6 bg-[var(--color-muted-subtle)]">
						<Button type="button" variant="ghost" onClick={() => window.history.back()}>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
							children={([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									loading={isPending || isSubmitting}
									disabled={!canSubmit}
									leadingIcon={<Sparkles className="w-4 h-4" />}
								>
									Capture & Run Pipeline
								</Button>
							)}
						/>
					</CardFooter>
				</Card>
			</form>
		</div>
	)
}
