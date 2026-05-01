import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@kana-consultant/ui-kit"
import { SettingField } from "./shared/setting-field"
import type { TabProps } from "./types"

export function PipelineTab({ settings, formState, onFieldChange }: TabProps) {
	const pipelineSettings = settings
		.filter((s) => s.category === "pipeline")
		.sort((a, b) => a.key.localeCompare(b.key))

	return (
		<div className="space-y-6 mt-4">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-base">Pipeline Configuration</CardTitle>
					<p
						className="text-xs mt-0.5"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Control email sequence count and bulk import limits.
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					{pipelineSettings.map((setting) => (
						<SettingField
							key={setting.key}
							setting={setting}
							value={formState[setting.key]}
							onChange={(value) => onFieldChange(setting.key, value)}
						/>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
