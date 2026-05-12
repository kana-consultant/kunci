import { Button, Card, CardContent, useAppForm } from "@kana-consultant/ui-kit"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	Mail,
	ShieldCheck,
	Sparkles,
	Workflow,
} from "lucide-react"
import { useState } from "react"
import { z } from "zod"
import { authClient } from "~/libs/auth/client"

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
})

const emailSchema = z.string().email("Email tidak valid")
const passwordSchema = z.string().min(1, "Password wajib diisi")

const highlights = [
	{
		icon: Workflow,
		title: "Outbound pipeline otomatis",
		body: "Capture → enrich → behavioral analysis → 3-email sequence dalam satu alur.",
	},
	{
		icon: Sparkles,
		title: "AI-powered untuk ASEAN",
		body: "Prompt locale-aware untuk ID, SG, MY, TH — tone yang sesuai konteks bisnis lokal.",
	},
	{
		icon: ShieldCheck,
		title: "Compliance-first",
		body: "One-click unsubscribe, opt-out suppression, send-window per timezone.",
	},
]

function LoginPage() {
	const navigate = useNavigate()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
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
				})
				if (error) {
					setErrorMessage(error.message || "Login gagal. Cek kredensial kamu.")
					return
				}
				navigate({ to: "/" })
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err)
				setErrorMessage(msg || "Tidak bisa menghubungi server")
			} finally {
				setIsSubmitting(false)
			}
		},
	})

	return (
		<div
			className="grid min-h-screen w-full lg:grid-cols-[1.05fr_minmax(0,1fr)]"
			style={{ background: "var(--color-background)" }}
		>
			<BrandPanel />

			<div className="flex items-center justify-center px-6 py-12 sm:px-12">
				<div className="w-full max-w-md">
					<div className="mb-8 flex flex-col items-center text-center lg:hidden">
						<BrandMark />
						<p
							className="mt-3 text-sm"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							KanA Unified Network for Conversion Intelligence
						</p>
					</div>

					<Card
						className="w-full"
						style={{
							borderColor: "var(--color-border)",
							background: "var(--color-surface)",
						}}
					>
						<CardContent className="space-y-6 p-8">
							<div className="space-y-1.5">
								<h1
									className="text-2xl font-semibold leading-tight tracking-tight"
									style={{ color: "var(--color-foreground)" }}
								>
									Masuk ke KUNCI
								</h1>
								<p
									className="text-sm"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Gunakan akun admin kamu untuk mengelola pipeline outbound.
								</p>
							</div>

							{errorMessage && (
								<div
									role="alert"
									className="rounded-md border px-3 py-2 text-sm"
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
								className="space-y-4"
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
											placeholder="kamu@kunci.ai"
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
											placeholder="••••••••"
											leadingIcon={<KeyRound className="h-4 w-4" />}
											trailingIcon={
												<button
													type="button"
													onClick={() => setShowPassword((v) => !v)}
													className="inline-flex items-center justify-center p-1 rounded transition-colors"
													style={{
														color: "var(--color-muted-foreground)",
													}}
													aria-label={
														showPassword
															? "Sembunyikan password"
															: "Tampilkan password"
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

								<Button
									type="submit"
									className="w-full"
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Memasukkan...
										</>
									) : (
										"Sign in"
									)}
								</Button>
							</form>

							<p
								className="text-xs text-center"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Tidak punya akses? Hubungi admin workspace kamu.
							</p>
						</CardContent>
					</Card>

					<p
						className="mt-6 text-center text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						v{__APP_VERSION__} • KanA Consultant
					</p>
				</div>
			</div>
		</div>
	)
}

function BrandPanel() {
	return (
		<div
			className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
			style={{
				background:
					"linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 92%, black) 0%, color-mix(in srgb, var(--color-primary) 60%, var(--color-accent)) 100%)",
				color: "#fff",
			}}
		>
			<DecorativeGrid />

			<div className="relative z-10">
				<BrandMark light />
				<p className="mt-4 text-base/relaxed text-white/80 max-w-md">
					KanA Unified Network for Conversion Intelligence — outbound AI SDR
					untuk B2B di Indonesia, Singapore, Malaysia, dan Thailand.
				</p>
			</div>

			<ul className="relative z-10 space-y-5 max-w-md">
				{highlights.map((item) => (
					<li key={item.title} className="flex gap-4">
						<span
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
							style={{
								background: "rgba(255,255,255,0.12)",
								backdropFilter: "blur(6px)",
							}}
						>
							<item.icon className="h-5 w-5" />
						</span>
						<div>
							<p className="font-semibold text-sm tracking-tight">
								{item.title}
							</p>
							<p className="text-sm text-white/75 leading-snug mt-0.5">
								{item.body}
							</p>
						</div>
					</li>
				))}
			</ul>

			<div className="relative z-10 text-xs text-white/60">
				© {new Date().getFullYear()} KanA Consultant
			</div>
		</div>
	)
}

function BrandMark({ light = false }: { light?: boolean }) {
	return (
		<div className="inline-flex items-center gap-3">
			<div
				className="flex h-11 w-11 items-center justify-center rounded-xl font-bold text-lg"
				style={{
					background: light ? "rgba(255,255,255,0.18)" : "var(--color-primary)",
					color: light ? "#fff" : "var(--color-primary-foreground, #fff)",
					backdropFilter: light ? "blur(6px)" : undefined,
				}}
			>
				K
			</div>
			<div className="flex flex-col leading-tight">
				<span
					className="text-xl font-bold tracking-tight"
					style={{ color: light ? "#fff" : "var(--color-foreground)" }}
				>
					KUNCI
				</span>
				<span
					className="text-[11px] uppercase tracking-widest"
					style={{
						color: light
							? "rgba(255,255,255,0.65)"
							: "var(--color-muted-foreground)",
					}}
				>
					AI SDR Platform
				</span>
			</div>
		</div>
	)
}

function DecorativeGrid() {
	return (
		<>
			<div
				aria-hidden
				className="absolute inset-0 opacity-[0.18]"
				style={{
					backgroundImage:
						"radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0%, transparent 45%)",
				}}
			/>
			<div
				aria-hidden
				className="absolute inset-0 opacity-[0.08]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
					backgroundSize: "32px 32px",
					maskImage:
						"radial-gradient(circle at center, black 35%, transparent 75%)",
				}}
			/>
		</>
	)
}
