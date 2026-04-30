import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	useAppForm,
} from "@kana-consultant/ui-kit"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { authClient } from "~/libs/auth/client"

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
})

const loginSchema = z.object({
	email: z.string().email("Email tidak valid"),
	password: z.string().min(1, "Password wajib diisi"),
})

export function LoginPage() {
	const navigate = useNavigate()

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: loginSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			})

			if (!error) {
				navigate({ to: "/" })
			} else {
				// Biasanya ditangani dengan Toast di Kana best-practice
				alert(error.message)
			}
		},
	})

	return (
		<div className="flex h-screen items-center justify-center bg-slate-50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center text-2xl">KUNCI Login</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							form.handleSubmit()
						}}
						className="space-y-4"
					>
						<form.AppField name="email">
							{(field) => (
								<field.TextField
									label="Email Address"
									type="email"
									required
									placeholder="admin@kunci.dev"
								/>
							)}
						</form.AppField>

						<form.AppField name="password">
							{(field) => (
								<field.TextField
									label="Password"
									type="password"
									required
									placeholder="••••••••"
								/>
							)}
						</form.AppField>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									className="w-full mt-4"
									loading={isSubmitting}
									disabled={!canSubmit}
								>
									Sign In
								</Button>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
