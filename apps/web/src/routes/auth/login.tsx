import {
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

const emailSchema = z.string().email("Email tidak valid")
const passwordSchema = z.string().min(1, "Password wajib diisi")

function LoginPage() {
	const navigate = useNavigate()

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			})

			if (!error) {
				navigate({ to: "/" })
			} else {
				alert(error.message || "Login failed")
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
						<form.AppField
							name="email"
							validators={{ onChange: emailSchema, onBlur: emailSchema }}
						>
							{(field) => (
								<field.TextField
									label="Email Address"
									type="email"
									required
									placeholder="admin@kunci.dev"
								/>
							)}
						</form.AppField>

						<form.AppField
							name="password"
							validators={{ onChange: passwordSchema, onBlur: passwordSchema }}
						>
							{(field) => (
								<field.TextField
									label="Password"
									type="password"
									required
									placeholder="••••••••"
								/>
							)}
						</form.AppField>

						<form.AppForm>
							<form.SubmitButton className="w-full mt-4">
								Sign In
							</form.SubmitButton>
						</form.AppForm>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
