# Changelog

All notable changes to this plugin. Versions match `manifest.json` and the `vX.Y.Z` git tags.

## Unreleased

### Added
- Keys and dials draw as a vacuum fluorescent display while OpenXLR wears VFD Amber, VFD
  Blue or VFD Classic, so they match OpenXLR's own keys. Keys show near-black glass with the
  glyph lit while the light is on and dim while it is off. Labels and Set Brightness levels
  are in segment lettering. Dial strips letter the title and reading the same way, over a
  row of cells lit up to the value that runs the strip's full width. Other skins look as
  before.

## 0.6.0

### Added
- Dial press and screen tap are configurable per dial. Each can turn the lights on or off,
  switch the dial between brightness and colour temperature, reset the temperature, or do
  nothing. Both dials share one settings page with separate brightness and temperature steps.
  Dials set up before this keep their old behaviour and step.

### Changed
- New key and dial artwork. Keys show a dark card with a round button, a status lamp and a
  bold label, and the button glows when the light is on. Set Brightness keys show their level
  on a seven-segment display. Apply Scene keys light up when the lights already match the
  scene. Dials show a half knob with a needle, a brightness bar or a warm-to-cool temperature
  bar, and read OFF while the lights are off.
- Colours follow the active [OpenXLR](https://github.com/emaspa/openxlr) skin when OpenXLR
  is installed, and its Broadcast palette otherwise.
- Action icons are flat dark tiles with a coloured glyph. `tools/icons.js` draws them and
  replaces `icons/make_icons.py`. OpenDeck keeps the old icon path for actions placed before
  this update, so place those again to get the new icons.
- Temperature dials snap to the step size, so they read 5500K rather than 5537K.

### Fixed
- Dropdowns in the settings pages were white text on white.

## 0.5.3

### Changed
- Renamed to **Key Light Direct** (was "Elgato Key Light") so it can't be confused with
  Elgato's official plugin. The bundle ID stays `me.dwot.keylight`, so existing keys and
  settings carry over; the actions now appear under "Key Light Direct" in OpenDeck's sidebar.
- README and manifest description state platform support: tested on Linux, untested on
  Windows and macOS.
- README: Node.js 20+ requirement (was 18+) and install steps for the plugin store and release
  files.

## 0.5.2

### Changed
- Release workflow: actions pinned to full commit SHAs (Dependabot keeps them current), and the
  workflow token is read-only except for `contents: write` on the release job.
- Example values in the settings panel and code comments are now generic (the Manual IPs
  placeholder and the example light ID).

## 0.5.1

### Changed
- Release workflow: `actions/checkout@v7` (without persisted credentials), `actions/setup-node@v7`
  building on Node 24, `softprops/action-gh-release@v3`. All run on GitHub's Node 24 runtime.

## 0.5.0

### Changed
- Real icons replace the placeholder circles: amber glyphs on a dark ground for keys, white
  glyphs for the action list and category, and a 256/512 plugin icon.

## 0.4.1

### Fixed
- New Scene, Set Brightness and dial keys no longer fail until the device dropdown is changed.
  A key with no device saved now targets "All lights", as its settings already showed.
- Brightness and temperature dials pick up changes made elsewhere (phone app, other keys)
  instead of continuing from their own last value.
- Scene brightness slider starts at 1%, matching what the lights accept.

### Changed
- Manifest passes `streamdeck validate`: `Software.MinimumVersion` 6.9, Category matches the
  plugin name, 4-part `Version` (`0.4.1.0`). Linux support moved to `manifest.linux.json`,
  which OpenDeck merges over `manifest.json` on Linux (Elgato's schema only allows mac/windows).
- `ws` is pinned with `package-lock.json`; release zips bundle `node_modules` (OpenDeck never
  runs `npm install`) and leave out dev scripts.
- Tag-driven GitHub release workflow.

## 0.4.0

### Changed
- Talks to the lights directly over their HTTP API (port 9123) instead of going through
  keylight-control, which is no longer needed.
- Finds lights with built-in mDNS discovery (`_elg._tcp`), with a Rescan button and a
  Manual IPs fallback in every action's settings.
- Lights are identified by MAC address, and the last-known lights are cached so keys work at
  startup before discovery finishes.
- Light names come from the lights themselves.
- `install.sh` installs to OpenDeck 2.x's plugin folder (`~/.config/opendeck/plugins`) and
  skips `npm install` when `ws` is already available.

## 0.3.0

- Initial release: Toggle, Set Brightness, Apply Scene, and Stream Deck+ brightness and
  temperature dials, via keylight-control's local API.
