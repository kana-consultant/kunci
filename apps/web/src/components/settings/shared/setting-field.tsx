import { Input, Label, Switch, Textarea } from "@kana-consultant/ui-kit"
import { OfferingsEditor } from "~/components/offerings-editor"

interface SettingFieldProps {
	setting: {
		key: string
		label: string
		description: string | null
		valueType: string
	}
	value: any
	onChange: (value: any) => void
}

export function SettingField({ setting, value, onChange }: SettingFieldProps) {
	return (
		<div className="space-y-2">
			<Label className="text-sm font-semibold">{setting.label}</Label>
			{setting.description && (
				<p
					className="text-xs mt-0.5 mb-2"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{setting.description}
				</p>
			)}

			{setting.valueType === "text" ? (
				<Textarea
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					className="min-h-[160px] font-mono"
				/>
			) : setting.valueType === "boolean" ? (
				<div className="flex items-center gap-3 pt-1">
					<Switch
						checked={value === true || value === "true"}
						onCheckedChange={onChange}
					/>
					<span className="text-sm font-medium">Enabled</span>
				</div>
			) : setting.valueType === "number" ? (
				<Input
					type="number"
					step={setting.key.includes("temperature") ? "0.1" : "1"}
					value={value ?? ""}
					onChange={(e) => onChange(parseFloat(e.target.value))}
				/>
			) : setting.valueType === "json" ? (
				<OfferingsEditor value={value ?? []} onChange={onChange} />
			) : (
				<div className="flex items-center gap-2">
					{setting.key.toUpperCase().includes("COLOR") && (
						<Input
							type="color"
							value={value ?? "#000000"}
							onChange={(e) => onChange(e.target.value)}
							className="h-10 w-12 p-1 cursor-pointer"
						/>
					)}
					<Input
						type="text"
						value={value ?? ""}
						onChange={(e) => onChange(e.target.value)}
						className="flex-1"
					/>
				</div>
			)}
		</div>
	)
}
