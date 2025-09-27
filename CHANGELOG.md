## main

### Features / Improvements 🚀

- Add localization for French https://github.com/maplibre/maplibre-gl-geocoder/pull/412
- Fix mobile Chrome search by changing input type https://github.com/maplibre/maplibre-gl-geocoder/pull/447

### Bug fixes 🐛

## 1.9.0

### Features / Improvements 🚀

- Add localization for Spanish https://github.com/maplibre/maplibre-gl-geocoder/pull/337
- Show search results on click after selection https://github.com/maplibre/maplibre-gl-geocoder/pull/355

## 1.8.0

### Features / Improvements 🚀

- Migrate unit tests to Vitest https://github.com/maplibre/maplibre-gl-geocoder/pull/238
- Make the `reverseGeocode` field in `MaplibreGeocoderAPI` optional https://github.com/maplibre/maplibre-gl-geocoder/pull/245
- Localise error messages https://github.com/maplibre/maplibre-gl-geocoder/pull/258

### Bug fixes 🐛

- Fix _onKeyDown not working when map is inside custom web component https://github.com/maplibre/maplibre-gl-geocoder/pull/234

## 1.7.1

### Features / Improvements 🚀

- Add option to set proximity min zoom by @HarelM in https://github.com/maplibre/maplibre-gl-geocoder/pull/130
- Add `once` event registration capability by @HarelM in https://github.com/maplibre/maplibre-gl-geocoder/pull/127

### Bug fixes 🐛

- fix(build): remove type: module from package.json to fix cjs dist by @thaddmt in https://github.com/maplibre/maplibre-gl-geocoder/pull/140

## 1.7.0

### Features / Improvements 🚀

- Refactored test and `geocode` method heavily to make the code more readable in https://github.com/maplibre/maplibre-gl-geocoder/pull/127
- Added `once` to the public API to support promises and registering to an event once in https://github.com/maplibre/maplibre-gl-geocoder/pull/127

### Bug fixes 🐛

- Some bug fixes related to local and external geocoding in https://github.com/maplibre/maplibre-gl-geocoder/pull/127

## 1.6.0

### Features / Improvements 🚀

- Make the clear button type="button" by @daiwai in https://github.com/maplibre/maplibre-gl-geocoder/pull/116
- Modernize the codebase using typescript typings, rollup, typedoc and jest. by @HarelM in https://github.com/maplibre/maplibre-gl-geocoder/pull/118

### Bug fixes 🐛

- Fixed issues with `events` dependency https://github.com/maplibre/maplibre-gl-geocoder/issues/104
- Fixed links to "Carmen GeoJSON" format reference https://github.com/maplibre/maplibre-gl-geocoder/issues/110
- Fixed a lot of documentation issues by linking the docs to the code itself https://github.com/maplibre/maplibre-gl-geocoder/pull/118

## 1.5.0

### Features / Improvements 🚀

- Update suggestions API to support placeId [#84](https://github.com/maplibre/maplibre-gl-geocoder/pull/84)

## 1.4.2

### Features / Improvements 🚀

### Bug fixes 🐛

- fix: fix bug with fitbounds array, fix bug where clearbutton doesnt show up after pressing enter [#79](https://github.com/maplibre/maplibre-gl-geocoder/pull/79)

## 1.4.1

### Features / Improvements 🚀

### Bug fixes 🐛

- fix: fix bug where search cannot be done without fully clearing input [#72](https://github.com/maplibre/maplibre-gl-geocoder/pull/72)
- Bump sinon from 7.2.7 to 14.0.0 (#66)(https://github.com/maplibre/maplibre-gl-geocoder/pull/66)
- Bump tape from 4.10.1 to 5.5.3 (#56)(https://github.com/maplibre/maplibre-gl-geocoder/pull/56)

## 1.4.0

### Features / Improvements 🚀

- accept any version of MapLibre GL JS greater or equal to 1.14.0 [#49](https://github.com/maplibre/maplibre-gl-geocoder/pull/49)

### Bug fixes 🐛

## 1.3.1

### Features / Improvements 🚀

- N/A

### Bug fixes 🐛

- update vulnerable version of nanoid to 3.2.0 [#35](https://github.com/maplibre/maplibre-gl-geocoder/pull/35)
- remove yarn.lock and prefer using package-lock.json [#40](https://github.com/maplibre/maplibre-gl-geocoder/pull/40)

## 1.3.0

### Features / Improvements 🚀

- Added suggestions API and UI around display suggestions [#27](https://github.com/maplibre/maplibre-gl-geocoder/pull/27)

### Bug fixes 🐛

- N/A

## 1.2.0

### Features / Improvements 🚀

- Switch from `suggestions` library to `suggestions-list`, change enter key logic to support selecting list items with enter key [#14](https://github.com/maplibre/maplibre-gl-geocoder/pull/14)
- Added debounce option [#15](https://github.com/maplibre/maplibre-gl-geocoder/pull/10)

### Bug fixes 🐛

- Use the correct debounce parameter [#13](https://github.com/maplibre/maplibre-gl-geocoder/pull/13)

## 1.1.1

### Features / Improvements 🚀

- Add optional debounceSearch parameter to decide how long to wait before sending Geocoder input box query to server

### Bug fixes 🐛

- N/A

## 1.1.0

### Features / Improvements 🚀

- Updated Geocoder to by default only perform search on enter key press, added option to search when typing [#5](https://github.com/maplibre/maplibre-gl-geocoder/pull/5)

### Bug fixes 🐛

- create cloned html element for multiple marker results [#6](https://github.com/maplibre/maplibre-gl-geocoder/pull/6)

## 1.0.0

### Features / Improvements 🚀

- Initial Launch of forked maplibre-gl-geocoder from mapbox-gl-geocoder

### Bug fixes 🐛

- N/A
