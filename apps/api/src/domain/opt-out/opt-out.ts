export interface OptOut {
	email: string
	token: string
	reason: string | null
	source: OptOutSource
	optedOutAt: Date
}

export const OPT_OUT_SOURCES = [
	"unsubscribe_link",
	"reply_classification",
	"manual",
	"bounce",
] as const

export type OptOutSource = (typeof OPT_OUT_SOURCES)[number]
