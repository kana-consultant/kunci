import {
	Badge,
	Button,
	Checkbox,
	Separator,
	ThemeToggle,
	useAppForm,
} from "@kana-consultant/ui-kit"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
	Activity,
	Clock,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	Mail,
	MessageSquare,
	Search,
	Send,
	Sparkles,
	UserPlus,
} from "lucide-react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { authClient } from "~/libs/auth/client"

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
})

const emailSchema = z.string().email("Invalid email address")
const passwordSchema = z.string().min(1, "Password is required")

function LoginPage() {
	const navigate = useNavigate()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [rememberMe, setRememberMe] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useAppForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setErrorMessage(null)
			setIsSubmitting(true)
			try {
				const { error } = await authClient.signIn.email({
					email: value.email,
					password: value.password,
					rememberMe,
				})
				if (error) {
					setErrorMessage(error.message || "Login failed. Check your credentials.")
					return
				}
				navigate({ to: "/" })
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err)
				setErrorMessage(msg || "Unable to reach server")
			} finally {
				setIsSubmitting(false)
			}
		},
	})

	return (
		<div
			className="relative grid min-h-screen w-full lg:grid-cols-2"
			style={{ background: "var(--color-background)" }}
		>
			<div className="absolute right-4 top-4 z-10">
				<ThemeToggle />
			</div>

			<BrandPanel />

			<div className="flex items-center justify-center px-6 py-10 sm:px-10">
				<div className="w-full max-w-md">
					<div className="mb-8 flex flex-col items-center text-center lg:hidden">
						<BrandMark />
					</div>

					<div
						className="w-full rounded-2xl border p-8 sm:p-10"
						style={{
							borderColor: "var(--color-border)",
							background:
								"color-mix(in srgb, var(--color-surface) 60%, transparent)",
						}}
					>
						<div className="space-y-2 text-center">
							<h1
								className="text-3xl font-semibold tracking-tight"
								style={{ color: "var(--color-foreground)" }}
							>
								Sign in to KUNCI
							</h1>
							<p
								className="text-sm"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Manage your outbound pipeline, leads, and AI SDR settings.
							</p>
						</div>

						{errorMessage && (
							<div
								role="alert"
								className="mt-6 rounded-md border px-3 py-2 text-sm"
								style={{
									borderColor: "var(--color-danger)",
									background:
										"color-mix(in srgb, var(--color-danger) 8%, transparent)",
									color: "var(--color-danger)",
								}}
							>
								{errorMessage}
							</div>
						)}

						<form
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								form.handleSubmit()
							}}
							className="mt-8 space-y-5"
							noValidate
						>
							<form.AppField
								name="email"
								validators={{ onChange: emailSchema, onBlur: emailSchema }}
							>
								{(field) => (
									<field.TextField
										label="Email"
										type="email"
										required
										autoComplete="email"
										placeholder="admin@kunci.ai"
										leadingIcon={<Mail className="h-4 w-4" />}
									/>
								)}
							</form.AppField>

							<form.AppField
								name="password"
								validators={{
									onChange: passwordSchema,
									onBlur: passwordSchema,
								}}
							>
								{(field) => (
									<field.TextField
										label="Password"
										type={showPassword ? "text" : "password"}
										required
										autoComplete="current-password"
										placeholder="••••••••••"
										leadingIcon={<KeyRound className="h-4 w-4" />}
										trailingIcon={
											<button
												type="button"
												onClick={() => setShowPassword((v) => !v)}
												className="inline-flex items-center justify-center rounded p-1"
												style={{ color: "var(--color-muted-foreground)" }}
												aria-label={
													showPassword ? "Hide password" : "Show password"
												}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</button>
										}
									/>
								)}
							</form.AppField>

							<div className="flex items-center justify-between">
								<label className="inline-flex cursor-pointer items-center gap-2 text-sm">
									<Checkbox
										checked={rememberMe}
										onCheckedChange={(v) => setRememberMe(v === true)}
									/>
									<span style={{ color: "var(--color-foreground)" }}>
										Remember me
									</span>
								</label>
								<button
									type="button"
									className="text-sm font-medium hover:underline"
									style={{ color: "var(--color-primary)" }}
									onClick={() =>
										setErrorMessage(
											"Contact your workspace admin to reset your password.",
										)
									}
								>
									Forgot password?
								</button>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={isSubmitting}
								size="lg"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing in...
									</>
								) : (
									"Sign in"
								)}
							</Button>
						</form>

						<div className="my-6 flex items-center gap-3">
							<Separator className="flex-1" />
							<span
								className="text-xs"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								or
							</span>
							<Separator className="flex-1" />
						</div>

						<Button
							type="button"
							variant="outline"
							className="w-full"
							size="lg"
							onClick={() =>
								setErrorMessage(
									"API Key sign-in is not available in the UI. Use the x-api-key header on direct requests.",
								)
							}
						>
							<KeyRound className="mr-2 h-4 w-4" />
							Use API Key
						</Button>

						<p
							className="mt-8 text-center text-xs"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Don't have access? Contact your workspace admin.
						</p>
					</div>

					<p
						className="mt-6 text-center text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						v{__APP_VERSION__} • KaNA Consultant
					</p>
				</div>
			</div>
		</div>
	)
}

function BrandPanel() {
	return (
		<div className="relative hidden lg:flex flex-col gap-5 px-8 py-8 overflow-hidden">
			<div className="flex items-center gap-3">
				<BrandMarkIcon />
				<div className="flex flex-col leading-tight">
					<span
						className="text-lg font-bold tracking-tight"
						style={{ color: "var(--color-foreground)" }}
					>
						KUNCI
					</span>
					<span
						className="text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						AI SDR Platform
					</span>
				</div>
			</div>

			<div className="space-y-1.5">
				<h2
					className="text-lg font-semibold leading-snug tracking-tight max-w-md"
					style={{ color: "var(--color-foreground)" }}
				>
					AI SDR for a consistent outbound pipeline across Southeast Asia.
				</h2>
				<p
					className="text-xs leading-relaxed max-w-md"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Capture leads, auto-research, build relevant email sequences, send,
					follow up, and auto-reply in a single flow.
				</p>
			</div>

			<PipelineOverviewCard />
			<DashboardPreviewCard />

			<div
				className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"
				style={{ color: "var(--color-muted-foreground)" }}
			>
				<span
					className="inline-flex h-4 w-4 items-center justify-center rounded-full"
					style={{
						background:
							"color-mix(in srgb, var(--color-success) 22%, transparent)",
						color: "var(--color-success)",
					}}
					aria-hidden
				>
					<svg
						viewBox="0 0 24 24"
						className="h-2.5 w-2.5"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
					>
						<title>Shield</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"
						/>
					</svg>
				</span>
				<span>Enterprise-grade security</span>
				<span>•</span>
				<span>Encrypted data</span>
				<span>•</span>
				<span>Controlled access</span>
			</div>
		</div>
	)
}

function BrandMarkIcon() {
	return (
		<div
			className="flex h-10 w-10 items-center justify-center rounded-lg border text-base font-bold"
			style={{
				borderColor: "var(--color-border)",
				background:
					"color-mix(in srgb, var(--color-surface) 70%, transparent)",
				color: "var(--color-primary)",
			}}
		>
			K
		</div>
	)
}

function BrandMark() {
	return (
		<div className="inline-flex items-center gap-3">
			<BrandMarkIcon />
			<div className="flex flex-col leading-tight">
				<span
					className="text-xl font-bold tracking-tight"
					style={{ color: "var(--color-foreground)" }}
				>
					KUNCI
				</span>
				<span
					className="text-xs"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					AI SDR Platform
				</span>
			</div>
		</div>
	)
}

const pipelineSteps = [
	{ icon: UserPlus, label: "Capture", caption: "Incoming leads", tone: "primary" },
	{
		icon: Search,
		label: "Research",
		caption: "Research & analysis",
		tone: "primary",
	},
	{
		icon: Send,
		label: "Sequence",
		caption: "Build & send email",
		tone: "primary",
	},
	{
		icon: Activity,
		label: "Monitor",
		caption: "Reply & follow-up",
		tone: "info",
	},
] as const

function PipelineOverviewCard() {
	return (
		<div
			className="rounded-xl border p-4"
			style={{
				borderColor: "var(--color-border)",
				background:
					"color-mix(in srgb, var(--color-surface) 60%, transparent)",
			}}
		>
			<p
				className="mb-3 text-[10px] font-medium uppercase tracking-widest"
				style={{ color: "var(--color-muted-foreground)" }}
			>
				Pipeline Overview
			</p>
			<div className="flex items-start justify-between gap-1">
				{pipelineSteps.map((step, idx) => (
					<div key={step.label} className="flex items-start gap-1 flex-1">
						<div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
							<StepBubble icon={step.icon} tone={step.tone} />
							<div className="text-center">
								<p
									className="text-xs font-semibold"
									style={{ color: "var(--color-foreground)" }}
								>
									{step.label}
								</p>
								<p
									className="text-[10px] mt-0.5"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{step.caption}
								</p>
							</div>
						</div>
						{idx < pipelineSteps.length - 1 && <StepConnector />}
					</div>
				))}
			</div>
		</div>
	)
}

function StepBubble({
	icon: Icon,
	tone,
}: {
	icon: typeof UserPlus
	tone: "primary" | "info"
}) {
	const color =
		tone === "info" ? "var(--color-info, #22d3ee)" : "var(--color-primary)"
	return (
		<span
			className="flex h-9 w-9 items-center justify-center rounded-full"
			style={{
				background: `color-mix(in srgb, ${color} 16%, transparent)`,
				border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
				color,
			}}
		>
			<Icon className="h-4 w-4" />
		</span>
	)
}

function StepConnector() {
	return (
		<div
			className="flex-1 mt-[18px] h-px self-start"
			style={{
				background:
					"repeating-linear-gradient(to right, var(--color-border) 0 4px, transparent 4px 8px)",
			}}
			aria-hidden
		/>
	)
}

type Variant = {
	trailing?: { tone: "success" | "warning" | "info"; dot?: boolean; label: string }
	body: React.ReactNode
}

type Slot = {
	icon: typeof UserPlus
	title: string
	variants: Variant[]
}

const slots: Slot[] = [
	{
		icon: UserPlus,
		title: "Campaign Health",
		variants: [
			{
				trailing: { tone: "success", dot: true, label: "Healthy" },
				body: (
					<div className="flex items-center gap-2">
						<DonutGauge value={87} />
						<div className="min-w-0">
							<p
								className="text-xs font-semibold leading-tight"
								style={{ color: "var(--color-foreground)" }}
							>
								Pipeline running smoothly
							</p>
							<p
								className="text-[11px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								42 of 48 leads active
							</p>
						</div>
					</div>
				),
			},
			{
				trailing: { tone: "success", dot: true, label: "Healthy" },
				body: (
					<div className="flex items-center gap-2">
						<DonutGauge value={94} />
						<div className="min-w-0">
							<p
								className="text-xs font-semibold leading-tight"
								style={{ color: "var(--color-foreground)" }}
							>
								Pipeline optimized
							</p>
							<p
								className="text-[11px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								68 of 72 leads active
							</p>
						</div>
					</div>
				),
			},
			{
				trailing: { tone: "warning", dot: true, label: "Watch" },
				body: (
					<div className="flex items-center gap-2">
						<DonutGauge value={71} />
						<div className="min-w-0">
							<p
								className="text-xs font-semibold leading-tight"
								style={{ color: "var(--color-foreground)" }}
							>
								Bounce rate uptick
							</p>
							<p
								className="text-[11px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								29 of 41 leads active
							</p>
						</div>
					</div>
				),
			},
		],
	},
	{
		icon: MessageSquare,
		title: "Awaiting Reply",
		variants: [
			{
				body: (
					<>
						<p
							className="text-2xl font-bold leading-none"
							style={{ color: "var(--color-foreground)" }}
						>
							26
						</p>
						<div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
							<p
								className="text-[11px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Leads awaiting reply
							</p>
							<Badge tone="warning">+3</Badge>
						</div>
					</>
				),
			},
			{
				body: (
					<>
						<p
							className="text-2xl font-bold leading-none"
							style={{ color: "var(--color-foreground)" }}
						>
							34
						</p>
						<div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
							<p
								className="text-[11px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Replies in queue
							</p>
							<Badge tone="success">+8</Badge>
						</div>
					</>
				),
			},
			{
				body: (
					<>
						<p
							className="text-2xl font-bold leading-none"
							style={{ color: "var(--color-foreground)" }}
						>
							19
						</p>
						<div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
							<p
								className="text-[11px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Cleared after sweep
							</p>
							<Badge tone="info">-5</Badge>
						</div>
					</>
				),
			},
		],
	},
	{
		icon: Sparkles,
		title: "Recent AI Run",
		variants: [
			{
				body: (
					<>
						<p
							className="text-xs font-semibold leading-tight"
							style={{ color: "var(--color-foreground)" }}
						>
							Research & Sequence
						</p>
						<p
							className="text-[11px] truncate"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							PT Inovasi Digital Nusantara
						</p>
						<div className="mt-1.5 flex items-center justify-between">
							<p
								className="inline-flex items-center gap-1 text-[10px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								<Clock className="h-2.5 w-2.5" />
								10m ago
							</p>
							<Badge tone="success">Success</Badge>
						</div>
					</>
				),
			},
			{
				body: (
					<>
						<p
							className="text-xs font-semibold leading-tight"
							style={{ color: "var(--color-foreground)" }}
						>
							Behavior Analysis
						</p>
						<p
							className="text-[11px] truncate"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							SG Tech Hub Pte Ltd
						</p>
						<div className="mt-1.5 flex items-center justify-between">
							<p
								className="inline-flex items-center gap-1 text-[10px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								<Clock className="h-2.5 w-2.5" />
								2m ago
							</p>
							<Badge tone="success">Success</Badge>
						</div>
					</>
				),
			},
			{
				body: (
					<>
						<p
							className="text-xs font-semibold leading-tight"
							style={{ color: "var(--color-foreground)" }}
						>
							Auto-reply Draft
						</p>
						<p
							className="text-[11px] truncate"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Wira Ventures Sdn Bhd
						</p>
						<div className="mt-1.5 flex items-center justify-between">
							<p
								className="inline-flex items-center gap-1 text-[10px]"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								<Clock className="h-2.5 w-2.5" />
								1h ago
							</p>
							<Badge tone="success">Success</Badge>
						</div>
					</>
				),
			},
		],
	},
	{
		icon: Clock,
		title: "Next Follow-up",
		variants: [
			{
				body: (
					<>
						<p
							className="text-2xl font-bold leading-none"
							style={{ color: "var(--color-foreground)" }}
						>
							8 leads
						</p>
						<p
							className="mt-1 text-[11px]"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Scheduled for today
						</p>
						<div className="mt-1.5">
							<Badge tone="warning">14:00-16:00 WIB</Badge>
						</div>
					</>
				),
			},
			{
				body: (
					<>
						<p
							className="text-2xl font-bold leading-none"
							style={{ color: "var(--color-foreground)" }}
						>
							12 leads
						</p>
						<p
							className="mt-1 text-[11px]"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Scheduled tomorrow
						</p>
						<div className="mt-1.5">
							<Badge tone="info">09:00-11:00 SGT</Badge>
						</div>
					</>
				),
			},
			{
				body: (
					<>
						<p
							className="text-2xl font-bold leading-none"
							style={{ color: "var(--color-foreground)" }}
						>
							5 leads
						</p>
						<p
							className="mt-1 text-[11px]"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Late afternoon batch
						</p>
						<div className="mt-1.5">
							<Badge tone="warning">16:00-18:00 MYT</Badge>
						</div>
					</>
				),
			},
		],
	},
]

const ROTATE_MS = 3500

function DashboardPreviewCard() {
	const [tick, setTick] = useState(0)

	useEffect(() => {
		const id = setInterval(() => setTick((t) => t + 1), ROTATE_MS)
		return () => clearInterval(id)
	}, [])

	return (
		<div
			className="rounded-xl border p-3.5 space-y-2.5"
			style={{
				borderColor: "var(--color-border)",
				background:
					"color-mix(in srgb, var(--color-surface) 60%, transparent)",
			}}
		>
			<style>{`@keyframes kunci-slide-right{from{transform:translateX(-14px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
			<div className="flex items-center justify-between">
				<p
					className="text-[10px] font-medium uppercase tracking-widest"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Live Dashboard Preview
				</p>
				<Badge tone="neutral">Example</Badge>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{slots.map((slot) => {
					const variantIdx = tick % slot.variants.length
					const variant = slot.variants[variantIdx]
					return (
						<div
							key={`${slot.title}-${variantIdx}`}
							style={{
								animation: "kunci-slide-right 0.55s ease-out",
							}}
						>
							<MiniCard
								icon={<slot.icon className="h-3 w-3" />}
								title={slot.title}
								trailing={
									variant.trailing ? (
										<Badge
											tone={variant.trailing.tone}
											dot={variant.trailing.dot}
										>
											{variant.trailing.label}
										</Badge>
									) : undefined
								}
							>
								{variant.body}
							</MiniCard>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function MiniCard({
	icon,
	title,
	trailing,
	children,
}: {
	icon: React.ReactNode
	title: string
	trailing?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div
			className="rounded-lg border p-2.5 space-y-1.5"
			style={{
				borderColor: "var(--color-border)",
				background:
					"color-mix(in srgb, var(--color-background) 60%, transparent)",
			}}
		>
			<div className="flex items-center justify-between gap-2">
				<div
					className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider truncate"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{icon}
					{title}
				</div>
				{trailing}
			</div>
			{children}
		</div>
	)
}

function DonutGauge({ value }: { value: number }) {
	const size = 44
	const stroke = 5
	const radius = (size - stroke) / 2
	const circumference = 2 * Math.PI * radius
	const dash = (value / 100) * circumference
	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<title>Pipeline health gauge</title>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="var(--color-border)"
					strokeWidth={stroke}
					fill="none"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="var(--color-success)"
					strokeWidth={stroke}
					strokeLinecap="round"
					fill="none"
					strokeDasharray={`${dash} ${circumference}`}
				/>
			</svg>
			<span
				className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
				style={{ color: "var(--color-foreground)" }}
			>
				{value}%
			</span>
		</div>
	)
}
