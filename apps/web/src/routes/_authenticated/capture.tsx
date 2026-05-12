import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Separator,
} from "@kana-consultant/ui-kit"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
	ArrowLeft,
	Brain,
	CheckCircle2,
	type LucideIcon,
	Mail,
	Send,
	Sparkles,
	UserPlus,
} from "lucide-react"

import { captureFieldSchemas, useCaptureLogic } from "./_hooks/-use-capture"

export const Route = createFileRoute("/_authenticated/capture")({
	component: CapturePage,
})

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

type PipelineStep = {
	icon: LucideIcon
	tone: string
	title: string
	description: string
}

const pipelineSteps: PipelineStep[] = [
	{
		icon: UserPlus,
		tone: "var(--color-primary)",
		title: "Capture lead",
		description: "Save the prospect and start the pipeline.",
	},
	{
		icon: Brain,
		tone: "var(--color-accent)",
		title: "Research & analyze",
		description: "AI scrapes the website and builds a behavior profile.",
	},
	{
		icon: Sparkles,
		tone: "var(--color-info)",
		title: "Craft sequence",
		description: "Personalized 3-email outbound is generated.",
	},
	{
		icon: Send,
		tone: "var(--color-success)",
		title: "Send & monitor",
		description: "First email goes out — replies surface here automatically.",
	},
]

function PipelinePreview() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div
						className="size-9 rounded-lg flex items-center justify-center"
						style={{
							background: softBg("var(--color-primary)"),
							color: "var(--color-primary)",
						}}
					>
						<Sparkles className="size-4" />
					</div>
					<div>
						<CardTitle className="text-base">What happens next</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Automated as soon as you submit
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ol className="relative space-y-4">
					<span
						aria-hidden
						className="absolute left-[15px] top-2 bottom-2 w-px"
						style={{ background: "var(--color-border)" }}
					/>
					{pipelineSteps.map((step, i) => {
						const Icon = step.icon
						return (
							<li key={step.title} className="flex items-start gap-3 relative">
								<div
									className="size-8 rounded-lg flex items-center justify-center shrink-0 relative z-10"
									style={{
										background: softBg(step.tone),
										color: step.tone,
										boxShadow: "0 0 0 4px var(--color-surface)",
									}}
								>
									<Icon className="size-4" />
								</div>
								<div className="flex-1 min-w-0 pt-0.5">
									<div className="flex items-center gap-2">
										<span
											className="text-[10px] font-bold uppercase tracking-wider tabular-nums"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											Step {i + 1}
										</span>
									</div>
									<p className="text-sm font-semibold leading-tight mt-0.5">
										{step.title}
									</p>
									<p
										className="text-xs leading-snug mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										{step.description}
									</p>
								</div>
							</li>
						)
					})}
				</ol>
			</CardContent>
		</Card>
	)
}

function AiEnrichmentTips() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div
						className="size-9 rounded-lg flex items-center justify-center"
						style={{
							background: softBg("var(--color-accent)"),
							color: "var(--color-accent)",
						}}
					>
						<Brain className="size-4" />
					</div>
					<div>
						<CardTitle className="text-base">Boost AI quality</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Optional fields = sharper personalization
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3">
					{[
						{
							title: "Add LinkedIn",
							copy: "Lets AI research the person directly for hooks and rapport.",
						},
						{
							title: "Pin pain points",
							copy: "Anchor the email to a real problem worth solving.",
						},
						{
							title: "Use a real domain",
							copy: "Website is scraped to extract product, positioning, and ICP.",
						},
					].map((tip) => (
						<li key={tip.title} className="flex items-start gap-2.5">
							<CheckCircle2
								className="size-4 shrink-0 mt-0.5"
								style={{ color: "var(--color-success)" }}
							/>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium leading-tight">{tip.title}</p>
								<p
									className="text-xs leading-snug mt-1"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{tip.copy}
								</p>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	)
}

function SectionHeading({
	icon: Icon,
	title,
	description,
	tone,
}: {
	icon: LucideIcon
	title: string
	description: string
	tone: string
}) {
	return (
		<div className="flex items-center gap-3">
			<div
				className="size-8 rounded-lg flex items-center justify-center shrink-0"
				style={{ background: softBg(tone), color: tone }}
			>
				<Icon className="size-4" />
			</div>
			<div>
				<p className="text-sm font-semibold leading-tight">{title}</p>
				<p
					className="text-xs leading-snug mt-0.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{description}
				</p>
			</div>
		</div>
	)
}

function CapturePage() {
	const navigate = useNavigate()
	const { form, error, successMessage } = useCaptureLogic()

	if (successMessage) {
		return (
			<div className="max-w-2xl mx-auto">
				<Card>
					<CardContent className="p-12 text-center space-y-5">
						<div
							className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
							style={{ background: softBg("var(--color-success)") }}
						>
							<CheckCircle2
								className="w-8 h-8"
								style={{ color: "var(--color-success)" }}
							/>
						</div>
						<div className="space-y-2">
							<h2 className="text-2xl font-semibold tracking-tight">
								Lead captured
							</h2>
							<p
								className="text-sm"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{successMessage}
							</p>
						</div>
						<p
							className="text-xs"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Redirecting to leads pipeline…
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* ── Header ── */}
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					<Link
						to="/leads"
						className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						<ArrowLeft className="size-3.5" />
						Back to pipeline
					</Link>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span
								className="text-[11px] font-semibold uppercase tracking-widest"
								style={{ color: "var(--color-primary)" }}
							>
								Lead Capture
							</span>
							<span
								className="size-1 rounded-full"
								style={{ background: "var(--color-muted-foreground)" }}
							/>
							<span
								className="text-[11px] uppercase tracking-widest"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Manual entry
							</span>
						</div>
						<h1 className="text-2xl font-bold tracking-tight">Add New Lead</h1>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							The AI pipeline researches, analyzes, and sends a personalized
							sequence automatically.
						</p>
					</div>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* ── Main form ── */}
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Lead Information</CardTitle>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Fields marked with{" "}
									<span
										className="font-semibold"
										style={{ color: "var(--color-danger)" }}
									>
										*
									</span>{" "}
									are required.
								</p>
							</CardHeader>
							<CardContent className="space-y-6">
								<SectionHeading
									icon={UserPlus}
									tone="var(--color-primary)"
									title="Prospect"
									description="Who you're reaching out to"
								/>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

								<Separator />

								<SectionHeading
									icon={Brain}
									tone="var(--color-accent)"
									title="Company"
									description="What KUNCI will research"
								/>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
												description="Scraped to extract product, ICP, and tone."
											/>
										)}
									</form.AppField>
								</div>

								<Separator />

								<SectionHeading
									icon={Sparkles}
									tone="var(--color-info)"
									title="Personalization"
									description="Optional — sharpens the AI sequence"
								/>
								<form.AppField
									name="linkedinUrl"
									validators={{
										onChange: captureFieldSchemas.linkedinUrl,
										onBlur: captureFieldSchemas.linkedinUrl,
									}}
								>
									{(field) => (
										<field.TextField
											label="LinkedIn Profile URL"
											placeholder="https://linkedin.com/in/johndoe"
											description="Lets the AI research the person directly for stronger hooks."
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
											label="Pain Points"
											placeholder="e.g. Struggling with lead quality, slow response times…"
											rows={4}
											description="Anchor the email to a real problem worth solving."
										/>
									)}
								</form.AppField>

								{error && (
									<div
										className="p-3 text-sm rounded-xl border flex items-start gap-2"
										style={{
											background: softBg("var(--color-danger)"),
											color: "var(--color-danger)",
											borderColor: "var(--color-danger)",
										}}
									>
										<span className="font-semibold">Error:</span>
										<span>
											{(error as { message?: string })?.message ||
												"Failed to capture lead"}
										</span>
									</div>
								)}
							</CardContent>

							<CardFooter
								className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 border-t p-6"
								style={{ background: "var(--color-surface-muted)" }}
							>
								<div className="flex items-center gap-2 text-xs">
									<Mail
										className="size-3.5"
										style={{ color: "var(--color-muted-foreground)" }}
									/>
									<span style={{ color: "var(--color-muted-foreground)" }}>
										First email goes out as soon as the AI sequence is ready.
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="ghost"
										onClick={() => navigate({ to: "/leads" })}
									>
										Cancel
									</Button>
									<form.AppForm>
										<form.SubmitButton
											leadingIcon={<Sparkles className="w-4 h-4" />}
										>
											Capture & Run Pipeline
										</form.SubmitButton>
									</form.AppForm>
								</div>
							</CardFooter>
						</Card>
					</div>

					{/* ── Side panel ── */}
					<aside className="space-y-4">
						<PipelinePreview />
						<AiEnrichmentTips />
					</aside>
				</div>
			</form>
		</div>
	)
}
