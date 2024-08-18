## Maplibre GL Geocoder

A geocoder control for [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js).

### Usage

### Usage with a module bundler

```bash
npm install --save @maplibre/maplibre-gl-geocoder
```

```js
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';
...
// Functions should return Carmen GeoJSON, see the relevant type in this project
// View config definitions in our [documentation](https://github.com/maplibre/maplibre-gl-geocoder/blob/master/API.md#setgeocoderapi)
var Geo = {
  // required
  forwardGeocode: async (config) => { /* definition here */ },
  
  // optional
  reverseGeocode: async (config) => { /* definition here */ }, // reverse geocoding API
  getSuggestions: async (config) => { /* definition here */ }, // suggestion API
  searchByPlaceId: async (config) => { /* definition here */ } // search by Place ID API
};

// Pass in or define a geocoding API that matches the above
const geocoder = new MaplibreGeocoder(Geo, { maplibregl: maplibregl });

```

### Using without a Map

It is possible to use the plugin without it being placed as a control on a maplibre-gl map.

### Deeper dive

#### API Documentation

See [API.md](https://github.com/maplibre/maplibre-gl-geocoder/blob/master/API.md) for complete reference.

### Contributing

See [CONTRIBUTING.md](https://github.com/maplibre/maplibre-gl-geocoder/blob/master/CONTRIBUTING.md).

### Licence

ISC © [MapLibre](https://github.com/maplibre) © [Mapbox](https://github.com/mapbox)
