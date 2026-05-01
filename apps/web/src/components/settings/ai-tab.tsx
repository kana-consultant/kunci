import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Label,
	Separator,
	Skeleton,
	Textarea,
} from "@kana-consultant/ui-kit"
import { useMutation } from "@tanstack/react-query"
import { FlaskConical, GitCompare, Loader2, Play, TestTube } from "lucide-react"
import { useState } from "react"
import { orpcClient } from "~/libs/orpc/client"
import { ModelSelector } from "./shared/model-selector"
import { SandboxShell } from "./shared/sandbox-shell"
import { SettingField } from "./shared/setting-field"
import type { TabProps } from "./types"

interface SandboxState {
	systemPrompt: string
	userInput: string
	userInputLabel?: string
	model: string
	temperature: number
	result: {
		output: string
		durationMs: number
		inputTokensEst: number
	} | null
	error: string | null
	compareMode: boolean
	compareModel: string
	compareResult: { output: string; durationMs: number } | null
	isUrlInput?: boolean
}

function SingleRunPanel({
	state,
	onChange,
	onRun,
	isRunning,
	label,
}: {
	state: {
		systemPrompt: string
		userInput: string
		model: string
		temperature: number
	}
	isUrlInput?: boolean
	onChange: (patch: Partial<typeof state>) => void
	onRun: () => void
	isRunning: boolean
	label: string
	result?: { output: string; durationMs: number; inputTokensEst: number } | null
	error?: string | null
}) {
	return (
		<div className="space-y-3">
			<p
				className="text-xs font-semibold uppercase tracking-widest"
				style={{ color: "var(--color-muted-foreground)" }}
			>
				{label}
			</p>
			<div className="space-y-1.5">
				<Label
					className="text-xs"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Model
				</Label>
				<ModelSelector
					value={state.model}
					onChange={(v) => onChange({ model: v })}
				/>
			</div>
			<div className="flex items-center gap-3">
				<Label
					className="text-xs shrink-0"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Temperature: {state.temperature.toFixed(1)}
				</Label>
				<input
					type="range"
					min={0}
					max={2}
					step={0.1}
					value={state.temperature}
					onChange={(e) =>
						onChange({ temperature: parseFloat(e.target.value) })
					}
					className="flex-1"
				/>
			</div>
			<Button
				className="w-full"
				onClick={onRun}
				disabled={isRunning || !state.systemPrompt || !state.userInput}
				leadingIcon={
					isRunning ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Play className="w-4 h-4" />
					)
				}
			>
				{isRunning ? "Running..." : "Run"}
			</Button>
		</div>
	)
}

function AiSandboxPanel({
	formState,
	externalState,
}: {
	formState: Record<string, any>
	externalState: {
		id: number
		systemPrompt: string
		userInput: string
		userInputLabel?: string
		model: string
		temperature: number
		isUrlInput?: boolean
	}
}) {
	const defaultModel =
		formState["ai.model.email_generator"] || "openai/gpt-4o-mini"

	const [state, setState] = useState<SandboxState>({
		systemPrompt: externalState.systemPrompt,
		userInput: externalState.userInput,
		userInputLabel: externalState.userInputLabel,
		model: externalState.model || defaultModel,
		temperature: externalState.temperature,
		result: null,
		error: null,
		compareMode: false,
		compareModel: externalState.model || defaultModel,
		compareResult: null,
		isUrlInput: externalState.isUrlInput || false,
	})

	// Sync when "Test this prompt" is clicked from left panel
	const [prevExternalId, setPrevExternalId] = useState(externalState.id)
	if (externalState.id !== prevExternalId) {
		setPrevExternalId(externalState.id)
		setState((s) => ({
			...s,
			systemPrompt: externalState.systemPrompt,
			userInput: externalState.userInput,
			userInputLabel: externalState.userInputLabel,
			model: externalState.model || defaultModel,
			temperature: externalState.temperature,
			isUrlInput: externalState.isUrlInput || false,
			result: null,
		}))
	}

	const runMutation = useMutation({
		mutationFn: () =>
			orpcClient.sandbox.runAiPrompt({
				systemPrompt: state.systemPrompt,
				userInput: state.isUrlInput ? undefined : state.userInput,
				urlToScrape: state.isUrlInput ? state.userInput : undefined,
				model: state.model,
				temperature: state.temperature,
			}),
		onSuccess: (data) => {
			setState((s) => ({
				...s,
				result: {
					output: data.output,
					durationMs: data.durationMs,
					inputTokensEst: data.inputTokensEst,
				},
				error: null,
			}))
		},
		onError: (err) => {
			setState((s) => ({
				...s,
				error: err instanceof Error ? err.message : "AI call failed",
				result: null,
			}))
		},
	})

	const compareMutation = useMutation({
		mutationFn: () =>
			orpcClient.sandbox.runAiPrompt({
				systemPrompt: state.systemPrompt,
				userInput: state.isUrlInput ? undefined : state.userInput,
				urlToScrape: state.isUrlInput ? state.userInput : undefined,
				model: state.compareModel,
				temperature: state.temperature,
			}),
		onSuccess: (data) => {
			setState((s) => ({
				...s,
				compareResult: { output: data.output, durationMs: data.durationMs },
			}))
		},
	})

	const patch = (p: Partial<SandboxState>) => setState((s) => ({ ...s, ...p }))

	return (
		<Card style={{ borderColor: "var(--color-primary)", borderWidth: "1px" }}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FlaskConical
							className="w-4 h-4"
							style={{ color: "var(--color-primary)" }}
						/>
						<CardTitle className="text-base">AI Sandbox</CardTitle>
					</div>
					<Button
						variant={state.compareMode ? "soft" : "ghost"}
						size="sm"
						onClick={() => patch({ compareMode: !state.compareMode })}
						leadingIcon={<GitCompare className="w-4 h-4" />}
					>
						Compare
					</Button>
				</div>
				<p
					className="text-xs mt-0.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Test any prompt live. Use "Test this prompt" on any prompt field to
					auto-fill.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-1.5">
					<Label
						className="text-xs font-medium"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						System Prompt
					</Label>
					<Textarea
						value={state.systemPrompt}
						onChange={(e) => patch({ systemPrompt: e.target.value })}
						placeholder="Paste a prompt here, or click 'Test this prompt' on any prompt field below..."
						className="font-mono text-xs min-h-[100px]"
					/>
				</div>

				<div className="space-y-1.5">
					<Label
						className="text-xs font-medium"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{state.userInputLabel || "User Input (test message)"}
					</Label>
					<Textarea
						value={state.userInput}
						onChange={(e) => patch({ userInput: e.target.value })}
						className="text-xs min-h-[80px]"
					/>
				</div>

				<Separator />

				{state.compareMode ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<SingleRunPanel
							label="Variant A"
							state={{
								systemPrompt: state.systemPrompt,
								userInput: state.userInput,
								model: state.model,
								temperature: state.temperature,
							}}
							isUrlInput={state.isUrlInput}
							onChange={(p) => patch(p)}
							onRun={() => runMutation.mutate()}
							isRunning={runMutation.isPending}
						/>
						<SingleRunPanel
							label="Variant B"
							state={{
								systemPrompt: state.systemPrompt,
								userInput: state.userInput,
								model: state.compareModel,
								temperature: state.temperature,
							}}
							isUrlInput={state.isUrlInput}
							onChange={(p) =>
								patch({ compareModel: p.model ?? state.compareModel })
							}
							onRun={() => compareMutation.mutate()}
							isRunning={compareMutation.isPending}
						/>
					</div>
				) : (
					<SingleRunPanel
						label="Model & Temperature"
						state={{
							systemPrompt: state.systemPrompt,
							userInput: state.userInput,
							model: state.model,
							temperature: state.temperature,
						}}
						isUrlInput={state.isUrlInput}
						onChange={(p) => patch(p)}
						onRun={() => runMutation.mutate()}
						isRunning={runMutation.isPending}
					/>
				)}

				{(state.error || runMutation.isError) && (
					<div
						className="rounded-lg border p-3 text-sm"
						style={{
							borderColor: "var(--color-danger)",
							color: "var(--color-danger)",
							background:
								"color-mix(in oklab, var(--color-danger) 8%, transparent)",
						}}
					>
						{state.error ?? "AI call failed"}
					</div>
				)}

				{/* Results */}
				{state.compareMode ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<ResultBlock
							label="Variant A"
							result={state.result}
							isRunning={runMutation.isPending}
						/>
						<ResultBlock
							label="Variant B"
							result={
								state.compareResult
									? {
											...state.compareResult,
											inputTokensEst: 0,
										}
									: null
							}
							isRunning={compareMutation.isPending}
						/>
					</div>
				) : (
					<ResultBlock
						label="Output"
						result={state.result}
						isRunning={runMutation.isPending}
					/>
				)}
			</CardContent>
		</Card>
	)
}

function ResultBlock({
	label,
	result,
	isRunning,
}: {
	label: string
	result: { output: string; durationMs: number; inputTokensEst: number } | null
	isRunning: boolean
}) {
	if (isRunning) {
		return (
			<div className="space-y-2">
				<p
					className="text-xs font-semibold uppercase tracking-widest"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{label}
				</p>
				<Skeleton className="h-28 w-full rounded-lg" />
			</div>
		)
	}
	if (!result) return null

	return (
		<div
			className="space-y-2 rounded-lg p-3"
			style={{ background: "var(--color-surface-alt)" }}
		>
			<p
				className="text-xs font-semibold uppercase tracking-widest"
				style={{ color: "var(--color-muted-foreground)" }}
			>
				{label}
			</p>
			<p className="text-sm whitespace-pre-wrap leading-relaxed">
				{result.output}
			</p>
			<p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
				{(result.durationMs / 1000).toFixed(1)}s
				{result.inputTokensEst > 0 && ` · ~${result.inputTokensEst} tokens`}
			</p>
		</div>
	)
}

const AI_GROUPS = [
	{
		id: "behavior_analyzer",
		title: "Behavior Analysis",
		modelKey: "ai.model.behavior_analyzer",
		promptKey: "ai.prompt.behavior_analyzer",
		tempKey: null,
		limitKeys: [],
		testInputLabel: "Activity Data",
		testInputDefault:
			"User clicked 'Pricing', viewed 'Enterprise Plan' for 3 mins.",
	},
	{
		id: "website_analyzer",
		title: "Website Analyzer",
		modelKey: "ai.model.website_analyzer",
		promptKey: "ai.prompt.website_analyzer",
		tempKey: null,
		limitKeys: ["ai.limit.website_markdown_chars"],
		testInputLabel: "Website URL",
		testInputDefault: "https://acme.com",
		isUrlInput: true,
	},
	{
		id: "company_profiler",
		title: "Company Profiler",
		modelKey: "ai.model.company_profiler",
		promptKey: "ai.prompt.company_profiler",
		tempKey: "ai.temperature.company_profiler",
		limitKeys: ["ai.limit.company_content_chars"],
		testInputLabel: "Raw Company Data",
		testInputDefault: "Acme Corp is a B2B SaaS company that helps...",
	},
	{
		id: "email_generator",
		title: "Email Generator",
		modelKey: "ai.model.email_generator",
		promptKey: "ai.prompt.sequence_generator",
		tempKey: null,
		limitKeys: [],
		testInputLabel: "Lead Context",
		testInputDefault:
			"Lead: Alex Johnson, Acme Corp, alex@acme.com\nCompany: SaaS platform with 50 employees\nPain Points: Manual SDR process, no outreach automation",
	},
	{
		id: "html_converter",
		title: "HTML Converter",
		modelKey: "ai.model.html_converter",
		promptKey: "ai.prompt.html_converter",
		tempKey: "ai.temperature.html_converter",
		limitKeys: [],
		testInputLabel: "Email Text",
		testInputDefault: "Hi Alex,\n\nI noticed your company...\n\nBest, John",
	},
	{
		id: "reply_personalizer",
		title: "Reply Personalizer",
		modelKey: "ai.model.reply_personalizer",
		promptKey: "ai.prompt.reply_personalizer",
		tempKey: null,
		limitKeys: [],
		testInputLabel: "Context & Reply",
		testInputDefault:
			"Previous Email: How about Tuesday?\nLead Reply: I am busy Tuesday, maybe Wednesday?",
	},
	{
		id: "subject_line_picker",
		title: "Subject Line Picker",
		modelKey: "ai.model.subject_line_picker",
		promptKey: "ai.prompt.subject_line_picker",
		tempKey: null,
		limitKeys: [],
		testInputLabel: "Email Body",
		testInputDefault: "Hi Alex,\n\nI noticed your company...\n\nBest, John",
	},
]

export function AiTab({ settings, formState, onFieldChange }: TabProps) {
	const aiSettings = settings.filter((s) => s.category === "ai")

	const [sandboxState, setSandboxState] = useState({
		id: 0,
		systemPrompt: "",
		userInput:
			"Lead: Alex Johnson, Acme Corp, alex@acme.com\nCompany: SaaS platform with 50 employees\nPain Points: Manual SDR process, no outreach automation",
		userInputLabel: "User Input (test message)",
		model: formState["ai.model.email_generator"] || "openai/gpt-4o-mini",
		temperature: 0.7,
	})

	const handleTestPrompt = (group: (typeof AI_GROUPS)[0]) => {
		setSandboxState((s) => ({
			id: s.id + 1,
			systemPrompt: formState[group.promptKey] ?? "",
			userInput: group.testInputDefault,
			userInputLabel: group.testInputLabel,
			isUrlInput: "isUrlInput" in group ? group.isUrlInput : false,
			model: formState[group.modelKey] || "openai/gpt-4o-mini",
			temperature: group.tempKey
				? (formState[group.tempKey] ?? 0.7)
				: (formState["ai.temperature.default"] ?? 0.7),
		}))
	}
	const leftPanel = (
		<div className="space-y-6">
			{AI_GROUPS.map((group) => {
				const modelSetting = aiSettings.find((s) => s.key === group.modelKey)
				const promptSetting = aiSettings.find((s) => s.key === group.promptKey)
				const tempSetting = group.tempKey
					? aiSettings.find((s) => s.key === group.tempKey)
					: null
				const limitSettings = group.limitKeys
					.map((key) => aiSettings.find((s) => s.key === key))
					.filter(Boolean) as typeof aiSettings

				return (
					<Card key={group.id}>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">{group.title}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Model */}
							{modelSetting && (
								<div className="space-y-1.5">
									<Label className="text-sm font-semibold">Model</Label>
									{modelSetting.description && (
										<p
											className="text-xs"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											{modelSetting.description}
										</p>
									)}
									<ModelSelector
										value={formState[group.modelKey] ?? ""}
										onChange={(v) => onFieldChange(group.modelKey, v)}
									/>
								</div>
							)}

							{/* Temperature */}
							{group.tempKey && tempSetting && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-semibold">Temperature</Label>
										<span
											className="text-sm tabular-nums font-medium"
											style={{ color: "var(--color-primary)" }}
										>
											{(formState[group.tempKey] ?? 0.7).toFixed(1)}
										</span>
									</div>
									{tempSetting.description && (
										<p
											className="text-xs"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											{tempSetting.description}
										</p>
									)}
									<input
										type="range"
										min={0}
										max={2}
										step={0.1}
										value={formState[group.tempKey] ?? 0.7}
										onChange={(e) =>
											onFieldChange(group.tempKey, parseFloat(e.target.value))
										}
										className="w-full"
									/>
								</div>
							)}

							{/* Prompt */}
							{promptSetting && (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-semibold">
											System Prompt
										</Label>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleTestPrompt(group)}
											leadingIcon={<TestTube className="w-3.5 h-3.5" />}
										>
											Test this prompt
										</Button>
									</div>
									{promptSetting.description && (
										<p
											className="text-xs"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											{promptSetting.description}
										</p>
									)}
									<Textarea
										value={formState[group.promptKey] ?? ""}
										onChange={(e) =>
											onFieldChange(group.promptKey, e.target.value)
										}
										className="min-h-[180px] font-mono text-xs"
									/>
								</div>
							)}

							{/* Limits */}
							{limitSettings.length > 0 && (
								<div className="space-y-4">
									{limitSettings.map((setting) => {
										let shortLabel = setting.label
										if (setting.key === "ai.limit.website_markdown_chars")
											shortLabel = "Markdown Character Limit"
										if (setting.key === "ai.limit.company_content_chars")
											shortLabel = "Content Character Limit"

										return (
											<SettingField
												key={setting.key}
												setting={{ ...setting, label: shortLabel }}
												value={formState[setting.key]}
												onChange={(value) => onFieldChange(setting.key, value)}
											/>
										)
									})}
								</div>
							)}
						</CardContent>
					</Card>
				)
			})}

			{/* Global Settings Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-base">Global & Default Limits</CardTitle>
					<p
						className="text-xs mt-0.5"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Fallback and global retry settings
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					{aiSettings
						.filter(
							(s) =>
								s.key === "ai.temperature.default" ||
								s.key === "ai.limit.scraper_fallback_chars" ||
								s.key === "ai.retry.max_retries",
						)
						.map((setting) => (
							<div key={setting.key}>
								{setting.key === "ai.temperature.default" ? (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-sm font-semibold">
												Default Temperature
											</Label>
											<span
												className="text-sm tabular-nums font-medium"
												style={{ color: "var(--color-primary)" }}
											>
												{(formState[setting.key] ?? 0.7).toFixed(1)}
											</span>
										</div>
										{setting.description && (
											<p
												className="text-xs"
												style={{ color: "var(--color-muted-foreground)" }}
											>
												{setting.description}
											</p>
										)}
										<input
											type="range"
											min={0}
											max={2}
											step={0.1}
											value={formState[setting.key] ?? 0.7}
											onChange={(e) =>
												onFieldChange(setting.key, parseFloat(e.target.value))
											}
											className="w-full"
										/>
									</div>
								) : (
									<SettingField
										key={setting.key}
										setting={{
											...setting,
											label:
												setting.key === "ai.retry.max_retries"
													? "Max Retries"
													: setting.key === "ai.limit.scraper_fallback_chars"
														? "Scraper Fallback Limit"
														: setting.label,
										}}
										value={formState[setting.key]}
										onChange={(value) => onFieldChange(setting.key, value)}
									/>
								)}
							</div>
						))}
				</CardContent>
			</Card>
		</div>
	)

	return (
		<div className="mt-4">
			<SandboxShell
				description='Configure models, temperatures, and prompts for each pipeline step. Click "Test this prompt" to run it in the sandbox panel.'
				left={leftPanel}
				right={
					<AiSandboxPanel formState={formState} externalState={sandboxState} />
				}
			/>
		</div>
	)
}
