/**
 * HTML block injected into outbound emails when company-profile mode is "url".
 * Sits between the AI-generated body and the compliance footer.
 */

const COPY_BY_LANG: Record<string, { line: string; cta: string }> = {
	id: {
		line: "Sebagai konteks tambahan, profil perusahaan kami tersedia di:",
		cta: "Lihat profil perusahaan",
	},
	th: {
		line: "หากต้องการข้อมูลเพิ่มเติม สามารถดูโปรไฟล์บริษัทของเราได้ที่:",
		cta: "ดูโปรไฟล์บริษัท",
	},
	en: {
		line: "For more context, here's our company profile:",
		cta: "View our company profile",
	},
}

function copyFor(language: string | null) {
	const lang = (language ?? "en").toLowerCase().split("-")[0]
	return COPY_BY_LANG[lang] ?? COPY_BY_LANG.en
}

export function buildCompanyProfileCtaHtml(input: {
	url: string
	language: string | null
}): string {
	const c = copyFor(input.language)
	const url = escapeAttr(input.url)
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;padding:12px 16px;background:#f9fafb;border-left:3px solid #2563eb;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#374151;line-height:1.5;">
<tr><td>
${escapeText(c.line)} <a href="${url}" style="color:#2563eb;text-decoration:underline;font-weight:600;">${escapeText(c.cta)}</a>
</td></tr>
</table>`
}

/** Insert the CTA into HTML just before the unsubscribe footer (or </body>). */
export function injectCompanyProfileCta(html: string, cta: string): string {
	const footerMarker = /(<table[^>]*role="presentation"[^>]*margin-top:32px)/i
	if (footerMarker.test(html)) {
		return html.replace(footerMarker, `${cta}$1`)
	}
	if (/<\/body>/i.test(html)) {
		return html.replace(/<\/body>/i, `${cta}</body>`)
	}
	return `${html}\n${cta}`
}

function escapeText(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeAttr(s: string): string {
	return escapeText(s).replace(/"/g, "&quot;")
}
