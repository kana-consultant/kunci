import {
	Button,
	Card,
	CardContent,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@kana-consultant/ui-kit"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	AlertCircle,
	Brain,
	Briefcase,
	CalendarClock,
	CheckCircle2,
	Loader2,
	type LucideIcon,
	Mail,
	RotateCcw,
	Save,
	Workflow,
} from "lucide-react"
import { useEffect, useState } from "react"
import { AiTab } from "~/components/settings/ai-tab"
import { BusinessTab } from "~/components/settings/business-tab"
import { EmailTab } from "~/components/settings/email-tab"
import { PipelineTab } from "~/components/settings/pipeline-tab"
import { SchedulerTab } from "~/components/settings/scheduler-tab"
import type { TabProps } from "~/components/settings/types"
import { orpc, orpcClient } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsPage,
})

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

type TabMeta = {
	value: string
	label: string
	description: string
	icon: LucideIcon
	tone: string
}

const TABS: TabMeta[] = [
	{
		value: "ai",
		label: "AI Models",
		description: "Provider, model & prompts",
		icon: Brain,
		tone: "var(--color-primary)",
	},
	{
		value: "email",
		label: "Email",
		description: "Sender, Resend & templates",
		icon: Mail,
		tone: "var(--color-info)",
	},
	{
		value: "business",
		label: "Business Profile",
		description: "Your company context",
		icon: Briefcase,
		tone: "var(--color-accent)",
	},
	{
		value: "pipeline",
		label: "Pipeline",
		description: "Outbound automation rules",
		icon: Workflow,
		tone: "var(--color-warning)",
	},
	{
		value: "scheduler",
		label: "Scheduler",
		description: "Follow-up cadence & windows",
		icon: CalendarClock,
		tone: "var(--color-success)",
	},
]

function SettingsPage() {
	const queryClient = useQueryClient()
	const {
		data: settings,
		isPending,
		error,
	} = useQuery(orpc.settings.getAll.queryOptions())

	const updateBulk = useMutation({
		mutationFn: (entries: { key: string; value: unknown }[]) =>
			orpcClient.settings.updateBulk({ entries }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.settings.getAll.queryOptions().queryKey,
			})
		},
	})

	const [formState, setFormState] = useState<Record<string, unknown>>({})
	const [activeCategory, setActiveCategory] = useState("ai")

	useEffect(() => {
		if (settings) {
			const initial: Record<string, unknown> = {}
			for (const s of settings) initial[s.key] = s.value
			setFormState(initial)
		}
	}, [settings])

	if (isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-1/3 rounded-lg" />
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-96 w-full rounded-2xl" />
			</div>
		)
	}

	if (error || !settings) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				</div>
				<Card>
					<CardContent className="flex items-start gap-3 p-5">
						<div
							className="size-9 rounded-lg flex items-center justify-center shrink-0"
							style={{
								background: softBg("var(--color-danger)"),
								color: "var(--color-danger)",
							}}
						>
							<AlertCircle className="size-4" />
						</div>
						<div>
							<p className="font-semibold text-sm">Failed to load settings</p>
							<p
								className="text-xs mt-1"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Ensure the API server is running and try again.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	const changedKeys = settings
		.filter((s) => {
			const current = formState[s.key]
			const original = s.value
			if (typeof original === "object") {
				return JSON.stringify(current) !== JSON.stringify(original)
			}
			return current !== original
		})
		.map((s) => s.key)
	const hasChanges = changedKeys.length > 0

	const handleSave = () => {
		if (!hasChanges) return
		const changedEntries = changedKeys.map((key) => ({
			key,
			value: formState[key],
		}))
		updateBulk.mutate(changedEntries)
	}

	const handleDiscard = () => {
		const initial: Record<string, unknown> = {}
		for (const s of settings) initial[s.key] = s.value
		setFormState(initial)
		updateBulk.reset()
	}

	const onFieldChange = (key: string, value: unknown) => {
		setFormState((prev) => ({ ...prev, [key]: value }))
	}

	const tabProps: TabProps = {
		settings,
		formState,
		onFieldChange,
		onSave: handleSave,
		isSaving: updateBulk.isPending,
		hasChanges,
	}

	const activeTab = TABS.find((t) => t.value === activeCategory) ?? TABS[0]
	const ActiveIcon = activeTab.icon

	return (
		<div className="space-y-6 pb-24">
			{/* ── Header ── */}
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span
							className="text-[11px] font-semibold uppercase tracking-widest"
							style={{ color: "var(--color-primary)" }}
						>
							Settings
						</span>
						<span
							className="size-1 rounded-full"
							style={{ background: "var(--color-muted-foreground)" }}
						/>
						<span
							className="text-[11px] uppercase tracking-widest"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{settings.length} field{settings.length === 1 ? "" : "s"}
						</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
					<p
						className="text-sm"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Tune AI providers, prompts, email senders, business context, and
						pipeline cadence.
					</p>
				</div>
				{updateBulk.isSuccess && !hasChanges && (
					<div
						className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
						style={{
							background: softBg("var(--color-success)"),
							color: "var(--color-success)",
						}}
					>
						<CheckCircle2 className="size-3.5" />
						All changes saved
					</div>
				)}
			</div>

			{/* ── Active section banner ── */}
			<div
				className="rounded-2xl border p-4 flex items-center gap-4"
				style={{
					background: "var(--color-surface)",
					borderColor: "var(--color-border)",
				}}
			>
				<div
					className="size-10 rounded-xl flex items-center justify-center shrink-0"
					style={{
						background: softBg(activeTab.tone),
						color: activeTab.tone,
					}}
				>
					<ActiveIcon className="size-5" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold leading-tight">
						{activeTab.label}
					</p>
					<p
						className="text-xs mt-0.5"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{activeTab.description}
					</p>
				</div>
				{hasChanges && (
					<span
						className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
						style={{
							background: softBg("var(--color-warning)"),
							color: "var(--color-warning)",
						}}
					>
						{changedKeys.length} unsaved
					</span>
				)}
			</div>

			{/* ── Tabs ── */}
			<Tabs value={activeCategory} onValueChange={setActiveCategory}>
				<div className="overflow-x-auto -mx-1 px-1">
					<TabsList>
						{TABS.map((tab) => {
							const Icon = tab.icon
							return (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									className="flex items-center gap-2"
								>
									<Icon className="size-3.5" />
									{tab.label}
								</TabsTrigger>
							)
						})}
					</TabsList>
				</div>

				<div className="mt-4">
					<TabsContent value="ai">
						<AiTab {...tabProps} />
					</TabsContent>
					<TabsContent value="email">
						<EmailTab {...tabProps} />
					</TabsContent>
					<TabsContent value="business">
						<BusinessTab {...tabProps} />
					</TabsContent>
					<TabsContent value="pipeline">
						<PipelineTab {...tabProps} />
					</TabsContent>
					<TabsContent value="scheduler">
						<SchedulerTab {...tabProps} />
					</TabsContent>
				</div>
			</Tabs>

			{/* ── Sticky save bar ── */}
			{hasChanges && (
				<div
					className="fixed left-0 right-0 bottom-4 z-20 pointer-events-none px-4"
					role="region"
					aria-label="Unsaved changes"
				>
					<div
						className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border shadow-lg flex items-center justify-between gap-3 px-4 py-3"
						style={{
							background: "var(--color-surface)",
							borderColor: "var(--color-border)",
							boxShadow:
								"0 1px 2px rgba(0,0,0,.06), 0 12px 32px -8px rgba(0,0,0,.16)",
						}}
					>
						<div className="flex items-center gap-3 min-w-0">
							<div
								className="size-9 rounded-lg flex items-center justify-center shrink-0"
								style={{
									background: softBg("var(--color-warning)"),
									color: "var(--color-warning)",
								}}
							>
								<AlertCircle className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-sm font-semibold leading-tight">
									{changedKeys.length} unsaved change
									{changedKeys.length === 1 ? "" : "s"}
								</p>
								<p
									className="text-xs leading-tight mt-0.5"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Review or save your edits to apply across the pipeline.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							{updateBulk.isError && (
								<span
									className="text-xs font-medium px-2 py-1 rounded-md hidden sm:inline-flex"
									style={{
										color: "var(--color-danger)",
										background: softBg("var(--color-danger)"),
									}}
								>
									Save failed
								</span>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDiscard}
								disabled={updateBulk.isPending}
								leadingIcon={<RotateCcw className="size-3.5" />}
							>
								Discard
							</Button>
							<Button
								size="sm"
								onClick={handleSave}
								disabled={updateBulk.isPending}
								leadingIcon={
									updateBulk.isPending ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<Save className="size-3.5" />
									)
								}
							>
								{updateBulk.isPending ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
