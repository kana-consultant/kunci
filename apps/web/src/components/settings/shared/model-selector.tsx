import { Button, Input } from "@kana-consultant/ui-kit"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const PRESET_MODELS = [
	"openai/gpt-4o",
	"openai/gpt-4o-mini",
	"openai/gpt-4.1-mini",
	"openai/o3-mini",
	"anthropic/claude-3-5-haiku",
	"anthropic/claude-3-5-sonnet",
	"google/gemini-2.0-flash",
]

interface ModelSelectorProps {
	value: string
	onChange: (value: string) => void
	label?: string
}

export function ModelSelector({ value, onChange, label }: ModelSelectorProps) {
	const [showPresets, setShowPresets] = useState(false)

	return (
		<div className="space-y-1.5">
			{label && (
				<p
					className="text-xs font-medium"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{label}
				</p>
			)}
			<div className="flex gap-2">
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="e.g. openai/gpt-4o-mini"
					className="flex-1 font-mono text-sm"
				/>
				<Button
					variant="outline"
					size="icon"
					onClick={() => setShowPresets((v) => !v)}
					type="button"
				>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</div>
			{showPresets && (
				<div
					className="rounded-lg border overflow-hidden"
					style={{ borderColor: "var(--color-border)" }}
				>
					{PRESET_MODELS.map((model) => (
						<Button
							key={model}
							variant="ghost"
							type="button"
							onClick={() => {
								onChange(model)
								setShowPresets(false)
							}}
							className="w-full justify-start text-sm font-mono rounded-none"
							style={
								value === model
									? { background: "var(--color-primary)", color: "#fff" }
									: undefined
							}
						>
							{model}
						</Button>
					))}
				</div>
			)}
		</div>
	)
}
