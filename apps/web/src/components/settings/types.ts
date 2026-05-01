export interface Setting {
	key: string
	value?: any
	category: string
	label: string
	description: string | null
	valueType: string
}

export interface TabProps {
	settings: Setting[]
	formState: Record<string, any>
	onFieldChange: (key: string, value: any) => void
	onSave: () => void
	isSaving: boolean
	hasChanges: boolean
}
