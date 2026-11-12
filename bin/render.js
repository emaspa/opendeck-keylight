'use strict';
/**
 * Key and dial artwork in the OpenXLR deck style: a skinned card with a
 * button cap, a status lamp and bold labels on keys, and a half-knob with a
 * needle and a level bar on dials. Colours come from the OpenXLR skin. A skin
 * that draws unlit segment cells (one that sets Ox.Text.Ghost) turns keys and
 * dial strips into a vacuum fluorescent display, as OpenXLR's own keys do.
 */

const svgUri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Lettering in OpenXLR's segment face (segment-text.mjs). It is an ES module,
// so the plugin loads it and hands it over; until then every skin draws the
// ordinary artwork.
let seg = null;
function useSegments(module) { seg = module; }
const isDisplay = (c) => !!seg && seg.segmented(c['Ox.Text.Ghost']);

// Centred glyphs in a 144x144 box, coloured when drawn.
const GLYPHS = {
	// A Key Light panel on its stand.
	light: `<g stroke="currentColor" stroke-width="6" stroke-linecap="round">
			<line x1="72" y1="22" x2="72" y2="30"/><line x1="44" y1="27" x2="48" y2="34"/><line x1="100" y1="27" x2="96" y2="34"/></g>
		<rect x="36" y="40" width="72" height="42" rx="9" fill="currentColor"/>
		<line x1="72" y1="82" x2="72" y2="106" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
		<line x1="54" y1="110" x2="90" y2="110" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
	sun: `<circle cx="72" cy="72" r="19" fill="currentColor"/>
		<g stroke="currentColor" stroke-width="8" stroke-linecap="round">
			<line x1="72" y1="28" x2="72" y2="38"/><line x1="72" y1="106" x2="72" y2="116"/>
			<line x1="28" y1="72" x2="38" y2="72"/><line x1="106" y1="72" x2="116" y2="72"/>
			<line x1="41" y1="41" x2="48" y2="48"/><line x1="96" y1="96" x2="103" y2="103"/>
			<line x1="41" y1="103" x2="48" y2="96"/><line x1="96" y1="48" x2="103" y2="41"/></g>`,
	thermo: `<path d="M62 84 V40 a10 10 0 0 1 20 0 V84" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
		<circle cx="72" cy="98" r="17" fill="currentColor"/>
		<rect x="68" y="54" width="8" height="40" rx="4" fill="currentColor"/>
		<g stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.7">
			<line x1="92" y1="40" x2="102" y2="40"/><line x1="92" y1="54" x2="102" y2="54"/><line x1="92" y1="68" x2="102" y2="68"/></g>`,
	scene: `<rect x="44" y="52" width="56" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="6"/>
		<path d="M52 44 h52 a6 6 0 0 1 6 6 v34" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
		<path d="M56 78 l10 -12 l9 8 l8 -14 l11 18" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`,
};

// Seven-segment figures, drawn as shapes so they look the same everywhere.
const SEGMENTS = {
	'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
	'5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcfgd',
	'O': 'abcdef', 'F': 'afge', '-': 'g',
};
function sevenSeg(text, x, y, h, color) {
	const w = h * 0.58, t = h * 0.20, gap = w * 0.40;
	const seg = {
		a: [t * 0.7, 0, w - 1.4 * t, t], b: [w - t, t * 0.6, t, h / 2 - t],
		c: [w - t, h / 2 + t * 0.4, t, h / 2 - t], d: [t * 0.7, h - t, w - 1.4 * t, t],
		e: [0, h / 2 + t * 0.4, t, h / 2 - t], f: [0, t * 0.6, t, h / 2 - t],
		g: [t * 0.7, (h - t) / 2, w - 1.4 * t, t],
	};
	const draw = (cx, names, opacity) => {
		let o = `<g fill="${color}" opacity="${opacity}">`;
		for (const n of names) {
			const [sx, sy, sw, sh] = seg[n];
			o += `<rect x="${(cx + sx).toFixed(1)}" y="${(y + sy).toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" rx="${(t / 2).toFixed(1)}"/>`;
		}
		return o + '</g>';
	};
	let out = '';
	let cx = x - (text.length * w + (text.length - 1) * gap) / 2;
	for (const ch of text) {
		out += draw(cx, 'abcdefg', 0.14);
		out += draw(cx, SEGMENTS[ch.toUpperCase()] || '', 1);
		cx += w + gap;
	}
	return out;
}

/**
 * A 144x144 key face.
 * on: the state the key reports is engaged (lit cap, green lamp)
 * known: the light answered; false greys the key out
 * glyph: a GLYPHS name, or null for a seven-segment badge
 * badge: text for the badge display
 * label: up to two lines under the cap, '' for none
 */
function keyImage(c, { on, known, glyph = null, badge = '', label = '' }) {
	if (isDisplay(c)) return displayKeyImage(c, { on, known, glyph, badge, label });
	const accent = known && on ? c['Ox.Led.On'] : null;
	const ink = !known ? c['Ox.Text.Muted'] : accent || c['Ox.Text.Primary'];
	const lines = label ? String(label).split('\n').slice(0, 2) : [];
	const capY = lines.length ? 52 : 66;

	let face;
	if (glyph) {
		face = `
			<circle cx="72" cy="${capY}" r="38" fill="none" stroke="#000" stroke-opacity="0.4" stroke-width="6"/>
			<circle cx="72" cy="${capY}" r="34" fill="${c['Ox.Card.Background']}" stroke="${c['Ox.Text.Muted']}" stroke-width="4"/>
			${accent ? `<circle cx="72" cy="${capY}" r="37" fill="none" stroke="${accent}" stroke-width="6" opacity="0.6" filter="url(#bloom)"/>` : ''}
			<g transform="translate(72 ${capY}) scale(0.62) translate(-72 -72)">${GLYPHS[glyph].replaceAll('currentColor', ink)}</g>`;
	} else {
		const segColor = known ? (accent || c['Ox.Text.Muted']) : c['Ox.Led.Off'];
		face = `
			<rect x="24" y="${capY - 30}" width="96" height="60" rx="8" fill="${c['Ox.Meter.Track']}" stroke="#000" stroke-opacity="0.5" stroke-width="5"/>
			${accent ? `<g filter="url(#bloom)" opacity="0.65">${sevenSeg(badge, 72, capY - 19, 38, accent)}</g>` : ''}
			${sevenSeg(badge, 72, capY - 19, 38, segColor)}`;
	}

	// Status lamp in the top-right corner, like a channel strip indicator.
	const lamp = glyph
		? `<circle cx="120" cy="24" r="8" fill="${!known ? c['Ox.Led.Off'] : accent || c['Ox.Text.Muted']}" stroke="${c['Ox.Card.Background']}" stroke-width="3"/>` +
			(accent ? `<circle cx="120" cy="24" r="11" fill="${accent}" opacity="0.5" filter="url(#soft)"/>` : '')
		: '';

	const labels = lines.map((line, i) => {
		const size = line.length > 11 ? 19 : line.length > 8 ? 22 : 26;
		const y = lines.length === 1 ? 126 : 106 + i * 24;
		return `<text x="72" y="${y}" text-anchor="middle" fill="${c['Ox.Text.Primary']}" ` +
			`stroke="#000" stroke-width="4" paint-order="stroke" stroke-linejoin="round" ` +
			`font-family="Inter, Noto Sans, DejaVu Sans, sans-serif" font-size="${size}" font-weight="700">${esc(line)}</text>`;
	}).join('');

	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 144 144">
		<defs>
			<linearGradient id="side" x1="138" y1="72" x2="6" y2="72" gradientUnits="userSpaceOnUse">
				<stop stop-opacity="0"/><stop offset="1" stop-opacity="0.2"/>
			</linearGradient>
			<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
			<filter id="bloom" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.5"/></filter>
		</defs>
		<rect x="6" y="6" width="132" height="132" rx="14" fill="${c['Ox.Card.Background']}"/>
		<rect x="6" y="6" width="132" height="132" rx="14" fill="url(#side)"/>
		<rect x="9" y="9" width="126" height="126" rx="12" fill="none" stroke="${c['Ox.Text.Muted']}" stroke-width="4"/>
		${face}${lamp}${labels}
	</svg>`);
}

// A colour scaled toward black, for the glass under a display's lettering.
function darken(hex, amount) {
	const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	return '#' + rgb.map((v) => Math.round(v * amount).toString(16).padStart(2, '0')).join('');
}

// The defs every display face shares: the halo lit lettering wears, the light
// it spills into the glass, and the glass's fine mesh and sheen, as on
// OpenXLR's display keys and the VFD Clock keys.
function displayDefs(lit) {
	return `
		<filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>
		<filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5"/></filter>
		<radialGradient id="spill" cx="72" cy="84" r="80" gradientUnits="userSpaceOnUse">
			<stop stop-color="${lit}" stop-opacity="0.10"/><stop offset="1" stop-color="${lit}" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="72" gradientUnits="userSpaceOnUse">
			<stop stop-color="#ffdcbe" stop-opacity="0.06"/><stop offset="1" stop-color="#ffdcbe" stop-opacity="0"/>
		</linearGradient>
		<pattern id="mesh" width="1.5" height="1.5" patternUnits="userSpaceOnUse">
			<rect width="1.5" height="0.5" fill="#000" opacity="0.27"/><rect width="0.5" height="1.5" fill="#000" opacity="0.18"/>
		</pattern>`;
}

// Something lit on the display: a soft halo of its own colour under it.
const glowing = (inner, colour) =>
	`<g filter="url(#halo)" opacity="0.8" color="${colour}" fill="${colour}">${inner}</g><g color="${colour}" fill="${colour}">${inner}</g>`;

/**
 * A key as a vacuum fluorescent display: near-black glass with a thin frame,
 * the glyph lit with a halo while the light is on and dim while it is off,
 * numbers and labels in the segment face over their unlit cells, a lamp
 * segment in the corner, and the glass's mesh over everything.
 */
function displayKeyImage(c, { on, known, glyph, badge, label }) {
	const ghost = c['Ox.Text.Ghost'];
	const lit = c['Ox.Text.Primary'];
	const unlit = c['Ox.Text.Muted'];
	const accent = known && on ? c['Ox.Led.On'] : null;
	// Off, the glyph is drawn dim so its shape still reads; unknown, only its unlit cells.
	const ink = accent || (known ? unlit : ghost);
	const lines = label ? String(label).split('\n').slice(0, 2) : [];
	const capY = lines.length ? 52 : 66;

	let face;
	if (glyph) {
		const shape = `<g transform="translate(72 ${capY}) scale(0.72) translate(-72 -72)">${GLYPHS[glyph]}</g>`;
		face = accent ? glowing(shape, ink) : `<g color="${ink}" fill="${ink}">${shape}</g>`;
	} else {
		// A brightness level reads as a number with its unit, cell by cell.
		const text = `${badge}%`;
		const size = seg.fittedSize(text, 44, 112);
		face = seg.segmentText(text, 72, capY + size / 2, size, { fill: ink, ghost, glow: accent ? 'halo' : null });
	}

	// The corner lamp is a small segment of the display.
	const lampBar = `<rect x="110" y="18" width="16" height="6" rx="1"/>`;
	const lamp = glyph ? (accent ? glowing(lampBar, accent) : `<g fill="${ghost}">${lampBar}</g>`) : '';

	const labels = lines.map((line, i) => {
		const size = line.length > 11 ? 19 : line.length > 8 ? 22 : 26;
		const y = lines.length === 1 ? 126 : 106 + i * 24;
		return seg.segmentText(line, 72, y - 2, seg.fittedSize(line, size * 0.8, 120),
			{ fill: known ? lit : unlit, ghost, glow: known ? 'soft' : null });
	}).join('');

	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 144 144">
		<defs>${displayDefs(lit)}</defs>
		<rect width="144" height="144" fill="${darken(ghost, 0.25)}"/>
		<rect width="144" height="144" fill="url(#spill)"/>
		<rect x="5" y="5" width="134" height="134" rx="16" fill="none" stroke="${darken(lit, 0.3)}" stroke-width="2"/>
		${face}${lamp}${labels}
		<rect width="144" height="144" fill="url(#mesh)"/>
		<rect width="144" height="144" fill="url(#sheen)"/>
	</svg>`);
}

// 24x24 glyph for the dial's corner slot.
function dialIcon(c, glyph) {
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
		`<g transform="scale(0.1667)">${GLYPHS[glyph].replaceAll('currentColor', c['Ox.Text.Primary'])}</g></svg>`);
}

// The needle over the half-knob: a tick swept -50..+50 degrees around a
// centre below the visible strip.
function needle(c, frac) {
	const angle = clamp01(frac) * 100 - 50;
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="130" height="52" viewBox="0 0 130 52">
		<g transform="rotate(${angle.toFixed(1)}, 65, 61)">
			<rect x="63.5" y="30" width="3" height="16" rx="1.5" fill="${c['Ox.Text.Primary']}"/>
		</g></svg>`);
}

const BAR_W = 130;
// Brightness as a level bar in the meter colour.
function levelBar(c, frac) {
	const w = Math.round(clamp01(frac) * BAR_W);
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_W}" height="6" viewBox="0 0 ${BAR_W} 6">
		<rect width="${BAR_W}" height="6" rx="3" fill="${c['Ox.Meter.Track']}"/>
		${w > 0 ? `<rect width="${w}" height="6" rx="3" fill="${c['Ox.Meter.Fill']}"/>` : ''}</svg>`);
}

// Colour temperature as the warm-to-cool spectrum, lit up to the setting.
function kelvinBar(c, frac) {
	const w = Math.round(clamp01(frac) * BAR_W);
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_W}" height="6" viewBox="0 0 ${BAR_W} 6">
		<defs><linearGradient id="k" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${BAR_W}" y2="0">
			<stop offset="0" stop-color="#ffa94d"/><stop offset="0.45" stop-color="#ffe9cc"/><stop offset="1" stop-color="#a9c8ff"/>
		</linearGradient></defs>
		<rect width="${BAR_W}" height="6" rx="3" fill="${c['Ox.Meter.Track']}"/>
		<rect width="${BAR_W}" height="6" rx="3" fill="url(#k)" opacity="0.22"/>
		${w > 0 ? `<rect width="${w}" height="6" rx="3" fill="url(#k)"/>` : ''}</svg>`);
}

// The dial title, bold like OpenXLR's; long names are squeezed to fit. A
// display letters it in the segment face over unlit cells.
const TITLE_W = 154, TITLE_H = 24, CHAR_W = 8.1, SEGMENT_TITLE = 13;
function dialTitle(c, text) {
	if (isDisplay(c)) {
		const size = seg.fittedSize(text, SEGMENT_TITLE, TITLE_W);
		return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${TITLE_W}" height="${TITLE_H}" viewBox="0 0 ${TITLE_W} ${TITLE_H}">` +
			seg.segmentText(text, 0, 18, size, { fill: c['Ox.Text.Primary'], ghost: c['Ox.Text.Ghost'], anchor: 'start' }) + '</svg>');
	}
	const fit = text.length * CHAR_W > TITLE_W ? ` textLength="${TITLE_W - 2}" lengthAdjust="spacingAndGlyphs"` : '';
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${TITLE_W}" height="${TITLE_H}" viewBox="0 0 ${TITLE_W} ${TITLE_H}">` +
		`<text x="0" y="17" font-family="sans-serif" font-size="14.5" font-weight="700" fill="${c['Ox.Text.Primary']}"${fit}>${esc(text)}</text></svg>`);
}

// The width of a display strip's meter and value, layouts/dial-display.json.
const DISPLAY_W = 168;
// A display has no needle and no level bar above its reading.
const EMPTY_NEEDLE = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${DISPLAY_W}" height="52"/>`);
const EMPTY_METER = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${DISPLAY_W}" height="6"/>`);

// A dial strip's glass and frame, the keys' display stretched to the strip.
function displayStrip(c) {
	const lit = c['Ox.Text.Primary'];
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="92" viewBox="0 0 192 92">
		<defs>${displayDefs(lit)}</defs>
		<rect width="192" height="92" rx="12" fill="${darken(c['Ox.Text.Ghost'], 0.25)}"/>
		<rect width="192" height="92" rx="12" fill="url(#spill)"/>
		<rect x="1" y="1" width="190" height="90" rx="11" fill="none" stroke="${darken(lit, 0.3)}" stroke-width="2"/>
		<rect width="192" height="92" rx="12" fill="url(#mesh)"/>
	</svg>`);
}

// The value as a display shows it: the reading in the segment face, and under
// it a ladder of cells lit up to where the dial stands. Lit while the light is
// on, dim while it is off.
function displayDial(c, fraction, reading, active) {
	const ghost = c['Ox.Text.Ghost'], lit = active ? c['Ox.Text.Primary'] : c['Ox.Text.Muted'];
	const size = seg.fittedSize(reading, 22, DISPLAY_W - 4);
	const text = seg.segmentText(reading, DISPLAY_W - 2, 28, size, { fill: lit, ghost, anchor: 'end', glow: active ? 'soft' : null });
	const w = 3, gap = 2, cells = Math.floor((DISPLAY_W + gap) / (w + gap));
	const x0 = Math.floor((DISPLAY_W - (cells * (w + gap) - gap)) / 2);
	const on = Math.round(clamp01(fraction) * cells);
	let litCells = '', dark = '';
	for (let i = 0; i < cells; i++) {
		const cell = `<rect x="${x0 + i * (w + gap)}" y="38" width="${w}" height="8"/>`;
		if (i < on) litCells += cell; else dark += cell;
	}
	return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${DISPLAY_W}" height="52" viewBox="0 0 ${DISPLAY_W} 52">
		<defs>${displayDefs(lit)}</defs>${text}<g fill="${ghost}">${dark}</g>${litCells ? glowing(litCells, lit) : ''}
	</svg>`);
}

module.exports = {
	GLYPHS, keyImage, dialIcon, needle, levelBar, kelvinBar, dialTitle,
	useSegments, isDisplay, displayStrip, displayDial, EMPTY_NEEDLE, EMPTY_METER,
};
