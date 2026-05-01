import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@kana-consultant/ui-kit"
import { useMutation } from "@tanstack/react-query"
import { FlaskConical, Loader2, Play } from "lucide-react"
import { useState } from "react"
import { OfferingsEditor } from "~/components/offerings-editor"
import { orpcClient } from "~/libs/orpc/client"
import { SandboxShell } from "./shared/sandbox-shell"
import { SettingField } from "./shared/setting-field"
import type { TabProps } from "./types"

interface LeadDraft {
	fullName: string
	companyName: string
	companyWebsite: string
	painPoints: string
}

function BusinessSandboxPanel({
	formState,
}: {
	formState: Record<string, any>
}) {
	const [lead, setLead] = useState<LeadDraft>({
		fullName: "Alex Johnson",
		companyName: "Acme Corp",
		companyWebsite: "https://acme.com",
		painPoints: "Struggling with manual lead outreach",
	})

	const sampleMutation = useMutation({
		mutationFn: () =>
			orpcClient.sandbox.generateBusinessSample({
				leadDraft: lead,
				businessOverride: {
					name: formState["business.name"],
					description: formState["business.description"],
					valueProposition: formState["business.value_proposition"],
					toneOfVoice: formState["business.tone_of_voice"],
					offerings: formState["business.offerings"],
				},
			}),
	})

	return (
		<Card style={{ borderColor: "var(--color-primary)", borderWidth: "1px" }}>
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<FlaskConical
						className="w-4 h-4"
						style={{ color: "var(--color-primary)" }}
					/>
					<CardTitle className="text-base">Sample Email Generator</CardTitle>
				</div>
				<p
					className="text-xs mt-0.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Generate a sample outreach email using your current (unsaved) business
					settings.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Mock lead inputs */}
				<div className="space-y-3">
					<p
						className="text-xs font-semibold uppercase tracking-widest"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Mock Lead
					</p>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs">Name</Label>
							<Input
								value={lead.fullName}
								onChange={(e) =>
									setLead((l) => ({ ...l, fullName: e.target.value }))
								}
								placeholder="Alex Johnson"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Company</Label>
							<Input
								value={lead.companyName}
								onChange={(e) =>
									setLead((l) => ({ ...l, companyName: e.target.value }))
								}
								placeholder="Acme Corp"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">Website</Label>
						<Input
							value={lead.companyWebsite}
							onChange={(e) =>
								setLead((l) => ({ ...l, companyWebsite: e.target.value }))
							}
							placeholder="https://acme.com"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">Pain Points</Label>
						<Input
							value={lead.painPoints}
							onChange={(e) =>
								setLead((l) => ({ ...l, painPoints: e.target.value }))
							}
							placeholder="Struggling with manual outreach"
						/>
					</div>
				</div>

				<Button
					onClick={() => sampleMutation.mutate()}
					disabled={sampleMutation.isPending}
					className="w-full"
					leadingIcon={
						sampleMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Play className="w-4 h-4" />
						)
					}
				>
					{sampleMutation.isPending ? "Generating..." : "Generate Sample Email"}
				</Button>

				{sampleMutation.isError && (
					<div
						className="rounded-lg border p-3 text-sm"
						style={{
							borderColor: "var(--color-danger)",
							color: "var(--color-danger)",
							background:
								"color-mix(in oklab, var(--color-danger) 8%, transparent)",
						}}
					>
						{sampleMutation.error instanceof Error
							? sampleMutation.error.message
							: "Failed to generate sample email."}
					</div>
				)}

				{sampleMutation.data && (
					<div
						className="space-y-3 rounded-lg p-4"
						style={{ background: "var(--color-surface-alt)" }}
					>
						<div className="space-y-1">
							<p
								className="text-xs font-semibold uppercase tracking-widest"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Subject
							</p>
							<p className="text-sm font-medium">
								{sampleMutation.data.emailSubject}
							</p>
						</div>
						<div
							className="border-t pt-3"
							style={{ borderColor: "var(--color-border)" }}
						>
							<p
								className="text-xs font-semibold uppercase tracking-widest mb-2"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Body
							</p>
							<p className="text-sm whitespace-pre-wrap leading-relaxed">
								{sampleMutation.data.emailBody}
							</p>
						</div>
						<p
							className="text-xs"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Generated in {(sampleMutation.data.durationMs / 1000).toFixed(1)}s
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

export function BusinessTab({ settings, formState, onFieldChange }: TabProps) {
	const businessSettings = settings
		.filter((s) => s.category === "business")
		.sort((a, b) => a.key.localeCompare(b.key))

	const textSettings = businessSettings.filter((s) => s.valueType !== "json")
	const offeringsSettings = businessSettings.filter(
		(s) => s.valueType === "json",
	)

	const leftPanel = (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Business Profile</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{textSettings.map((setting) => (
					<SettingField
						key={setting.key}
						setting={setting}
						value={formState[setting.key]}
						onChange={(value) => onFieldChange(setting.key, value)}
					/>
				))}
				{offeringsSettings.map((setting) => (
					<div key={setting.key} className="space-y-2">
						<Label className="text-sm font-semibold">{setting.label}</Label>
						{setting.description && (
							<p
								className="text-xs mt-0.5 mb-2"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{setting.description}
							</p>
						)}
						<OfferingsEditor
							value={formState[setting.key] ?? []}
							onChange={(value) => onFieldChange(setting.key, value)}
						/>
					</div>
				))}
			</CardContent>
		</Card>
	)

	return (
		<div className="mt-4">
			<SandboxShell
				description="Configure your business identity. The sandbox generates a sample email using your current (unsaved) settings."
				left={leftPanel}
				right={<BusinessSandboxPanel formState={formState} />}
			/>
		</div>
	)
}
