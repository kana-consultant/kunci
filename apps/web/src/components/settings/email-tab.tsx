import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Label,
	Textarea,
} from "@kana-consultant/ui-kit"
import { useMutation } from "@tanstack/react-query"
import { FlaskConical, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { useState } from "react"
import { orpcClient } from "~/libs/orpc/client"
import { SandboxShell } from "./shared/sandbox-shell"
import { SettingField } from "./shared/setting-field"
import type { TabProps } from "./types"

const SAMPLE_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { background: {{BACKGROUND}}; font-family: {{FONT}}; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; }
  h1 { color: {{PRIMARY}}; font-size: 22px; margin-bottom: 16px; }
  p { color: {{TEXT_COLOR}}; line-height: 1.6; margin-bottom: 16px; }
  .cta { display: inline-block; background: {{CTA}}; color: white; padding: 12px 24px;
         border-radius: 6px; text-decoration: none; font-weight: bold; }
  .accent { color: {{ACCENT}}; }
</style></head>
<body>
  <div class="container">
    <h1>Hi Alex, I noticed something about Acme Corp</h1>
    <p>Your team is working hard on <span class="accent">scaling outreach</span>, but manual prospecting is slowing you down.</p>
    <p>At <strong>{{SENDER_COMPANY}}</strong>, we help companies like yours automate personalized outreach — without losing the human touch.</p>
    <p>In the past 6 months, clients using our approach have seen a <strong>3x increase in reply rates</strong>.</p>
    <p>Would you be open to a 15-minute call this week?</p>
    <a href="#" class="cta">Book a Call →</a>
    <p style="margin-top:32px;font-size:13px;color:#999;">
      Best, {{SENDER_NAME}}<br>
      {{SENDER_COMPANY}}
    </p>
  </div>
</body>
</html>`

function buildStaticPreview(formState: Record<string, any>): string {
	return SAMPLE_EMAIL_TEMPLATE.replace(
		/{{PRIMARY}}/g,
		formState["email.color_primary"] || "#2563eb",
	)
		.replace(/{{ACCENT}}/g, formState["email.color_accent"] || "#f97316")
		.replace(/{{CTA}}/g, formState["email.color_cta"] || "#16a34a")
		.replace(/{{TEXT_COLOR}}/g, formState["email.color_text"] || "#374151")
		.replace(
			/{{BACKGROUND}}/g,
			formState["email.color_background"] || "#ffffff",
		)
		.replace(/{{FONT}}/g, formState["email.font_family"] || "Arial, sans-serif")
		.replace(/{{SENDER_NAME}}/g, formState["email.sender_name"] || "Your Name")
		.replace(
			/{{SENDER_COMPANY}}/g,
			formState["email.sender_company"] || "Your Company",
		)
}

const DEFAULT_SAMPLE_TEXT = `Hi Alex,

I came across Acme Corp and noticed you've been scaling your sales team rapidly.

We work with companies like yours to automate personalized outreach at scale — our clients typically see a 3x increase in qualified replies within 60 days.

Would you be open to a quick 15-minute call this week to explore if we'd be a good fit?

Best,
{{SENDER_NAME}}
{{SENDER_COMPANY}}`

function EmailPreviewPanel({ formState }: { formState: Record<string, any> }) {
	const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE_TEXT)
	const [aiHtml, setAiHtml] = useState<string | null>(null)
	const [refreshKey, setRefreshKey] = useState(0)

	const previewMutation = useMutation({
		mutationFn: () =>
			orpcClient.sandbox.previewEmailHtml({
				emailText: sampleText,
				colors: {
					primary: formState["email.color_primary"] || "#2563eb",
					accent: formState["email.color_accent"] || "#f97316",
					cta: formState["email.color_cta"] || "#16a34a",
					text: formState["email.color_text"] || "#374151",
					background: formState["email.color_background"] || "#ffffff",
					fontFamily: formState["email.font_family"] || "Arial, sans-serif",
				},
			}),
		onSuccess: (data) => {
			setAiHtml(data.html)
		},
	})

	const staticHtml = buildStaticPreview(formState)
	const displayHtml = aiHtml ?? staticHtml

	return (
		<Card style={{ borderColor: "var(--color-primary)", borderWidth: "1px" }}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FlaskConical
							className="w-4 h-4"
							style={{ color: "var(--color-primary)" }}
						/>
						<CardTitle className="text-base">Email Preview</CardTitle>
					</div>
					{aiHtml && (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								setAiHtml(null)
								setRefreshKey((k) => k + 1)
							}}
							title="Reset to static preview"
						>
							<RefreshCw className="w-4 h-4" />
						</Button>
					)}
				</div>
				<p
					className="text-xs mt-0.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{aiHtml
						? "AI-generated HTML preview"
						: "Live static preview — updates as you change colors"}
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<Label
						className="text-xs font-medium"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Sample email text (for AI preview)
					</Label>
					<Textarea
						value={sampleText}
						onChange={(e) => {
							setSampleText(e.target.value)
							setAiHtml(null)
						}}
						className="font-mono text-xs min-h-[120px]"
					/>
				</div>

				<Button
					variant="soft"
					onClick={() => previewMutation.mutate()}
					disabled={previewMutation.isPending}
					className="w-full"
					leadingIcon={
						previewMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Sparkles className="w-4 h-4" />
						)
					}
				>
					{previewMutation.isPending
						? "Generating HTML..."
						: "Generate AI Preview"}
				</Button>

				{previewMutation.isError && (
					<div
						className="rounded-lg border p-3 text-sm"
						style={{
							borderColor: "var(--color-danger)",
							color: "var(--color-danger)",
							background:
								"color-mix(in oklab, var(--color-danger) 8%, transparent)",
						}}
					>
						{previewMutation.error instanceof Error
							? previewMutation.error.message
							: "Failed to generate preview."}
					</div>
				)}

				<div
					className="rounded-lg overflow-hidden border"
					style={{ borderColor: "var(--color-border)" }}
				>
					<iframe
						key={refreshKey}
						srcDoc={displayHtml}
						className="w-full"
						style={{ height: "480px" }}
						title="Email Preview"
						sandbox="allow-same-origin"
					/>
				</div>
			</CardContent>
		</Card>
	)
}

export function EmailTab({ settings, formState, onFieldChange }: TabProps) {
	const emailSettings = settings
		.filter((s) => s.category === "email")
		.sort((a, b) => a.key.localeCompare(b.key))

	const senderSettings = emailSettings.filter(
		(s) =>
			s.key === "email.sender_name" ||
			s.key === "email.sender_company" ||
			s.key === "email.sender_email",
	)
	const colorSettings = emailSettings.filter((s) =>
		s.key.toUpperCase().includes("COLOR"),
	)
	const otherSettings = emailSettings.filter(
		(s) => !senderSettings.includes(s) && !colorSettings.includes(s),
	)

	const leftPanel = (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Email Settings</CardTitle>
			</CardHeader>
			<CardContent className="space-y-8">
				{senderSettings.length > 0 && (
					<div className="space-y-4">
						<p
							className="text-xs font-semibold uppercase tracking-widest"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Sender
						</p>
						{senderSettings.map((setting) => (
							<SettingField
								key={setting.key}
								setting={setting}
								value={formState[setting.key]}
								onChange={(value) => onFieldChange(setting.key, value)}
							/>
						))}
					</div>
				)}

				{colorSettings.length > 0 && (
					<div className="space-y-4">
						<p
							className="text-xs font-semibold uppercase tracking-widest"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Colors
						</p>
						{colorSettings.map((setting) => (
							<SettingField
								key={setting.key}
								setting={setting}
								value={formState[setting.key]}
								onChange={(value) => onFieldChange(setting.key, value)}
							/>
						))}
					</div>
				)}

				{otherSettings.length > 0 && (
					<div className="space-y-4">
						<p
							className="text-xs font-semibold uppercase tracking-widest"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Typography
						</p>
						{otherSettings.map((setting) => (
							<SettingField
								key={setting.key}
								setting={setting}
								value={formState[setting.key]}
								onChange={(value) => onFieldChange(setting.key, value)}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)

	return (
		<div className="mt-4">
			<SandboxShell
				description="Configure sender information, colors, and typography. The preview updates live as you change colors."
				left={leftPanel}
				right={<EmailPreviewPanel formState={formState} />}
			/>
		</div>
	)
}
