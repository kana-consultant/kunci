/**
 * Compliance footer appended to every outbound HTML email.
 * Includes one-click unsubscribe link + sender identification
 * (CAN-SPAM / UU PDP ID / PDPC SG baseline).
 */
export interface FooterContext {
	unsubscribeUrl: string
	senderName: string
	senderCompany: string
	language: string | null
}

const COPY_BY_LANG: Record<
	string,
	{ notInterested: string; unsubscribe: string; sentTo: string }
> = {
	id: {
		notInterested: "Tidak tertarik?",
		unsubscribe: "Berhenti berlangganan",
		sentTo: "Email ini dikirim oleh",
	},
	th: {
		notInterested: "ไม่สนใจ?",
		unsubscribe: "ยกเลิกการรับอีเมล",
		sentTo: "อีเมลนี้ส่งโดย",
	},
	en: {
		notInterested: "Not interested?",
		unsubscribe: "Unsubscribe",
		sentTo: "This email was sent by",
	},
}

function copyFor(language: string | null) {
	const lang = (language ?? "en").toLowerCase().split("-")[0]
	return COPY_BY_LANG[lang] ?? COPY_BY_LANG.en
}

export function buildFooterHtml(ctx: FooterContext): string {
	const c = copyFor(ctx.language)
	const url = escapeAttr(ctx.unsubscribeUrl)
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;line-height:1.5;">
<tr><td style="text-align:center;padding:8px 0;">
${escapeText(c.sentTo)} <strong>${escapeText(ctx.senderName)}</strong> · ${escapeText(ctx.senderCompany)}
</td></tr>
<tr><td style="text-align:center;padding:4px 0;">
${escapeText(c.notInterested)} <a href="${url}" style="color:#6b7280;text-decoration:underline;">${escapeText(c.unsubscribe)}</a>
</td></tr>
</table>`
}

export function buildFooterPlainText(ctx: FooterContext): string {
	const c = copyFor(ctx.language)
	return `\n\n---\n${c.sentTo} ${ctx.senderName} · ${ctx.senderCompany}\n${c.notInterested} ${ctx.unsubscribeUrl}\n`
}

/** Append HTML footer to an existing HTML body, before closing </body> if present. */
export function appendFooterToHtml(html: string, footer: string): string {
	if (/<\/body>/i.test(html)) {
		return html.replace(/<\/body>/i, `${footer}</body>`)
	}
	return `${html}\n${footer}`
}

function escapeText(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeAttr(s: string): string {
	return escapeText(s).replace(/"/g, "&quot;")
}
