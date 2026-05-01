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
	Skeleton,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from "@kana-consultant/ui-kit"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { orpc, orpcClient } from "~/libs/orpc/client"
import { OfferingsEditor } from "~/components/offerings-editor"

export const Route = createFileRoute("/_authenticated/settings")({
	component: SettingsPage,
})

function SettingsPage() {
	const queryClient = useQueryClient()
	const {
		data: settings,
		isPending,
		error,
	} = useQuery(orpc.settings.getAll.queryOptions())

	const updateBulk = useMutation({
		mutationFn: (entries: { key: string; value: any }[]) =>
			orpcClient.settings.updateBulk({ entries }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.settings.getAll.queryOptions().queryKey,
			})
		},
	})

	const [formState, setFormState] = useState<Record<string, any>>({})
	const [activeCategory, setActiveCategory] = useState<string>("ai")

	useEffect(() => {
		if (settings) {
			const initial: Record<string, any> = {}
			for (const s of settings) {
				initial[s.key] = s.value
			}
			setFormState(initial)
		}
	}, [settings])

	if (isPending) {
		return (
			<div className="space-y-6 max-w-5xl mx-auto">
				<Skeleton className="h-12 w-1/3 rounded-lg" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		)
	}

	if (error || !settings) {
		return (
			<div className="text-[var(--color-danger)] p-6 bg-[var(--color-danger-muted)] rounded-lg border border-[var(--color-danger)]">
				Failed to load settings. Ensure the server is running.
			</div>
		)
	}

	// Extract unique categories and filter settings for the active category
	const categories = Array.from(new Set(settings.map((s) => s.category)))
	const settingsByCategory = settings.filter((s) => s.category === activeCategory)

	const handleSave = () => {
		const changedEntries = settings
			.filter((s) => formState[s.key] !== s.value)
			.map((s) => ({ key: s.key, value: formState[s.key] }))

		if (changedEntries.length > 0) {
			updateBulk.mutate(changedEntries)
		}
	}

	const hasChanges = settings.some((s) => formState[s.key] !== s.value)

	return (
		<div className="space-y-6 max-w-5xl mx-auto pb-12">
			<div>
				<h1 className="text-2xl font-bold flex items-center gap-2">
					<SettingsIcon className="w-6 h-6 text-[var(--color-primary)]" />
					System Settings
				</h1>
				<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
					Configure AI models, prompts, email templates, and pipeline parameters.
				</p>
			</div>

			<Tabs value={activeCategory} onValueChange={setActiveCategory}>
				<TabsList className="mb-4">
					{categories.map((cat) => (
						<TabsTrigger key={cat} value={cat} className="capitalize">
							{cat}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value={activeCategory}>
					<Card>
						<CardHeader>
							<CardTitle className="capitalize text-lg">{activeCategory} Configuration</CardTitle>
							<CardDescription>
								Update global system configuration for the {activeCategory} context.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
					{settingsByCategory.map((setting) => (
						<div key={setting.key} className="space-y-2">
							<Label className="text-sm font-semibold">
								{setting.label}
							</Label>
							{setting.description && (
								<p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 mb-2">
									{setting.description}
								</p>
							)}

							{setting.valueType === "text" ? (
								<Textarea
									value={formState[setting.key] ?? ""}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											[setting.key]: e.target.value,
										}))
									}
									className="min-h-[160px] font-mono"
								/>
							) : setting.valueType === "boolean" ? (
								<div className="flex items-center gap-3 pt-1">
									<Switch
										checked={
											formState[setting.key] === true ||
											formState[setting.key] === "true"
										}
										onCheckedChange={(checked) =>
											setFormState((prev) => ({
												...prev,
												[setting.key]: checked,
											}))
										}
									/>
									<span className="text-sm text-[var(--color-foreground)] font-medium">Enabled</span>
								</div>
							) : setting.valueType === "number" ? (
								<Input
									type="number"
									step={setting.key.includes("TEMPERATURE") ? "0.1" : "1"}
									value={formState[setting.key] ?? ""}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											[setting.key]: parseFloat(e.target.value),
										}))
									}
								/>
							) : setting.valueType === "json" ? (
								<OfferingsEditor
									value={formState[setting.key] ?? []}
									onChange={(newValue) =>
										setFormState((prev) => ({
											...prev,
											[setting.key]: newValue,
										}))
									}
								/>
							) : (
								<div className="flex items-center gap-2">
									{setting.key.includes("COLOR") && (
										<Input
											type="color"
											value={formState[setting.key] ?? "#000000"}
											onChange={(e) =>
												setFormState((prev) => ({
													...prev,
													[setting.key]: e.target.value,
												}))
											}
											className="h-10 w-12 p-1 cursor-pointer"
										/>
									)}
									<Input
										type="text"
										value={formState[setting.key] ?? ""}
										onChange={(e) =>
											setFormState((prev) => ({
												...prev,
												[setting.key]: e.target.value,
											}))
										}
										className="flex-1"
									/>
								</div>
							)}
						</div>
					))}
				</CardContent>
				<CardFooter className="flex justify-end gap-3 border-t p-6 bg-[var(--color-muted-subtle)]">
					<div className="mr-auto flex items-center">
						{updateBulk.isSuccess && (
							<span className="text-sm font-medium text-[var(--color-success)] bg-[var(--color-success-muted)] px-3 py-1.5 rounded-md flex items-center gap-2">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
								Settings saved successfully
							</span>
						)}
						{updateBulk.isError && (
							<span className="text-sm font-medium text-[var(--color-danger)] bg-[var(--color-danger-muted)] px-3 py-1.5 rounded-md flex items-center gap-2">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
								Failed to save settings
							</span>
						)}
					</div>
					
					<Button
						variant="ghost"
						onClick={() => {
							const initial: Record<string, any> = {}
							for (const s of settings) initial[s.key] = s.value
							setFormState(initial)
							updateBulk.reset()
						}}
						disabled={!hasChanges || updateBulk.isPending}
					>
						Discard Changes
					</Button>
					<Button
						onClick={handleSave}
						disabled={!hasChanges || updateBulk.isPending}
						leadingIcon={
							updateBulk.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Save className="w-4 h-4" />
							)
						}
					>
						{updateBulk.isPending ? "Saving..." : "Save Settings"}
					</Button>
				</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
