import Typeahead from "suggestions-list";
import subtag from "subtag";
import debounce from "lodash.debounce";
import extend from "xtend";
import {EventEmitter} from "events";
import type {Marker, Popup, Map, FlyToOptions, MarkerOptions, default as MaplibreGl} from "maplibre-gl";

import {exceptions} from "./exceptions";
import localization from "./localization";

/**
 * A regular expression to match coordinates.
 */
const COORDINATES_REGEXP = /(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)[ ]*$/;

/**
 * A Carmen GeoJSON Feature.
 * @see https://web.archive.org/web/20210224184722/https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
 */
export type CarmenGeojsonFeature = GeoJSON.Feature & {
  id: string;
  /**
   * Text representing the feature (e.g. "Austin").
   */
  text: string;
  /**
   * Optional. The language code of the text returned in text.
   */
  language?: string;
  /**
   * Human-readable text representing the full result hierarchy (e.g. "Austin, Texas, United States").
   */
  place_name: string;
  /**
   * An array of index types that this feature may be returned as. Most features have only one type matching its id.
   */
  place_type: string[];
  /**
   * Optional. Array bounding box of the form [minx,miny,maxx,maxy].
   */
  bbox?: [number, number, number, number];
};

export type MaplibreGeocoderOptions = {
  /**
   * On geocoded result what zoom level should the map animate to when a `bbox` isn't found in the response. If a `bbox` is found the map will fit to the `bbox`.
   * @default 16
   */
  zoom?: number;
  /**
   * If `false`, animating the map to a selected result is disabled. If `true`, animating the map will use the default animation parameters. If an object, it will be passed as `options` to the map [`flyTo`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map#flyto) or [`fitBounds`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map#map#fitbounds) method providing control over the animation of the transition.
   * @default true
   */
  flyTo?: boolean | FlyToOptions;
  /**
   * If `true`, the geocoder proximity will automatically update based on the map view.
   * @default true
   */
  trackProximity?: boolean;
  /**
   * If `false`, indicates that search will only occur on enter key press. If `true`, indicates that the Geocoder will search on the input box being updated above the minLength option.
   * @default false
   */
  showResultsWhileTyping?: boolean;
  /**
   * Minimum number of characters to enter before results are shown.
   * @default 2
   */
  minLength?: number;
  /**
   * If `true`, enable reverse geocoding mode. In reverse geocoding, search input is expected to be coordinates in the form `lat, lon`, with suggestions being the reverse geocodes.
   * @default false
   */
  reverseGeocode?: boolean;
  /**
   * Maximum number of results to show.
   * @default 5
   */
  limit?: number;
  /**
   * Allow Maplibre to collect anonymous usage statistics from the plugin.
   * @default true
   */
  enableEventLogging?: boolean;
  /**
   * If `true`, a [Marker](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/) will be added to the map at the location of the user-selected result using a default set of Marker options.  If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.maplibregl` also be set.
   * @default true
   */
  marker?: boolean | Marker;
  /**
   * If `true`, a [Popup](https://maplibre.org/maplibre-gl-js/docs/API/classes/Popup) will be added to the map when clicking on a marker using a default set of popup options.  If the value is an object, the popup will be constructed using these options. If `false`, no popup will be added to the map. Requires that `options.maplibregl` also be set.
   * @default false
   */
  popup?: boolean | Popup;
  /**
   * A [maplibre-gl](https://github.com/maplibre/maplibre-gl-js) instance to use when creating [Markers](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/). Required if `options.marker` is `true`.
   * @default false
   */
  maplibregl?: typeof MaplibreGl;
  /**
   * If `true`, the geocoder control will collapse until hovered or in focus.
   * @default false
   */
  collapsed?: boolean;
  /** 
   * If `true`, the geocoder control will clear it's contents and blur when user presses the escape key. 
   * @default false
   */
  clearAndBlurOnEsc?: boolean;
  /**
   * If `true`, the geocoder control will clear its value when the input blurs.
   * @default false
   */
  clearOnBlur?: boolean;
  /**
   * If `true`, indicates that the `localGeocoder` results should be the only ones returned to the user. If `false`, indicates that the `localGeocoder` results should be combined with those from the Maplibre API with the `localGeocoder` results ranked higher.
   * @default false
   */
  localGeocoderOnly?: boolean;
  /**
   * Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box. This parameter may be useful for reducing the total number of API calls made for a single query.
   * @default 200
   */
  debounceSearch?: number;
  /** 
   * If `true`, [Markers](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/) will be added to the map at the location the top results for the query. If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.maplibregl` also be set.
   * @default true
   */
  showResultMarkers?: boolean | MarkerOptions;
  /**
   * Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas. Defaults to the browser's language settings.
   */
  language?: string;
  /**
   * Override the default placeholder attribute value.
   * @default "Search"
   */
  placeholder?: string;
  /**
   * a proximity argument: this is a geographical point given as an object with `latitude` and `longitude` properties. 
   * Search results closer to this point will be given higher priority.
   */
  proximity?: { longitude: number; latitude: number };
  /**
   * A comma seperated list of types that filter results to match those specified. See https://docs.mapbox.com/api/search/#data-types for available types.
   * If reverseGeocode is enabled, you should specify one type. If you configure more than one type, the first type will be used.
   */
  types?: string;
  /**
   * A comma separated list of country codes to limit results to specified country or countries.
   */
  countries?: string;
  /**
   * A bounding box argument: this is a bounding box given as an array in the format `[minX, minY, maxX, maxY]`.
   * Search results will be limited to the bounding box.
   */
  bbox?: number[];
  /**
   * Set the factors that are used to sort nearby results.
   */
  reverseMode?: "distance" | "score"
  /**
   * If setting promiximity, this is the minimum zoom level at which to start taking it into account.
   * @default 9
   */
  proximityMinZoom?: number;
  /**
   * A function that specifies how the selected result should be rendered in the search bar. HTML tags in the output string will not be rendered. Defaults to `(item) => item.place_name`.
   * @example
   *
   * const GeoApi = {
   *   forwardGeocode: (config) => { return { features: [] } },
   *   reverseGeocode: (config) => { return { features: [] } }
   *   getSuggestions: (config) => { return { suggestions: {text: string, placeId?: string}[] }}
   *   searchByPlaceId: (config) => { return { place: {type: string, geometry: {type: string, coordinates: [number]} place_name: string, text: string, center: [number] }[] }}
   * }
   * const geocoder = new MaplibreGeocoder(GeoApi, {});
   * map.addControl(geocoder);
   */
  getItemValue?: (item: CarmenGeojsonFeature) => string;
  /**
   * A function that specifies how the results should be rendered in the dropdown menu. Any HTML in the returned string will be rendered.
   */
  render?: (item: CarmenGeojsonFeature) => string;
  /**
   * A function that specifies how the results should be rendered in the popup menu. Any HTML in the returned string will be rendered.
   */
  popupRender?: (item: CarmenGeojsonFeature) => string;
  /**
   * A function accepting the query string which performs local geocoding to supplement results from the Maplibre Geocoding API. Expected to return an Array of {@link CarmenGeojsonFeature}.
   */
  localGeocoder?: (query: string) => CarmenGeojsonFeature[];
  /**
   * A function accepting the query string, current features list, and geocoder options which performs geocoding to supplement results from the Maplibre Geocoding API. Expected to return a Promise which resolves to an Array of {@link CarmenGeojsonFeature}.
   */
  externalGeocoder?: (query: string, features: CarmenGeojsonFeature[], confic: MaplibreGeocoderApiConfig) => Promise<CarmenGeojsonFeature[]>;
  /**
   * A function which accepts a {@link CarmenGeojsonFeature} to filter out results from the Geocoding API response before they are included in the suggestions list. Return `true` to keep the item, `false` otherwise.
   */
  filter?: (item: CarmenGeojsonFeature) => boolean;
};

export type MaplibreGeocoderApiConfig = {
  /**
   * A comma separated list of country codes to limit results to specified country or countries.
   */
  countries?: string;
  /**
   * A comma seperated list of types that filter results to match those specified. See https://docs.mapbox.com/api/search/#data-types for available types. If reverseGeocode is enabled, you should specify one type. If you configure more than one type, the first type will be used.
   */
  types?: string;
  /**
   * Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas. Defaults to the browser's language settings.
   */
  language?: string;
  /**
   * A bounding box given as an array in the format `[minX, minY, maxX, maxY]`. Search results will be limited to the bounding box.
   */
  bbox?: number[]; 
  /**
   * Number of results to limit by
   */
  limit?: number;
  /**
   * A geographical point given as an object with `latitude` and `longitude` properties. Search results closer to this point will be given higher priority.
   */
  proximity?: number[];
  /**
   * Set the factors that are used to sort nearby results.
   */
  reverseMode?: "distance" | "score"
  /**
   * Search query string
   */
  query?: string | number[];
}

export type MaplibreGeocoderFeatureResults = { type: "FeatureCollection", features: CarmenGeojsonFeature[]};
export type MaplibreGeocoderSuggestionResults = { suggestions: { text: string, placeId?: string }[] };
export type MaplibreGeocoderPlaceResults = { place: CarmenGeojsonFeature[] };
export type MaplibreGeocoderResults = MaplibreGeocoderFeatureResults | MaplibreGeocoderSuggestionResults | MaplibreGeocoderPlaceResults;

/**
 * An API which contains reverseGeocode and forwardGeocode functions to be used by this plugin
 */
export type MaplibreGeocoderApi = {
  /**
   * Forward geocode function should return an object including a collection of {@link CarmenGeojsonFeature}.
   * @param config - Query parameters
   */
  forwardGeocode: (config: MaplibreGeocoderApiConfig) => Promise<MaplibreGeocoderFeatureResults>;
  /**
   * Reverse geocode function should return an object including a collection of {@link CarmenGeojsonFeature}.
   */
  reverseGeocode?: (config: MaplibreGeocoderApiConfig) => Promise<MaplibreGeocoderFeatureResults>;
  getSuggestions?: (config: MaplibreGeocoderApiConfig) => Promise<MaplibreGeocoderSuggestionResults>;
  searchByPlaceId?: (config: MaplibreGeocoderApiConfig) => Promise<MaplibreGeocoderPlaceResults>;
};

/**
 * A geocoder component that works with maplibre
 */
export default class MaplibreGeocoder {
  
  private options: MaplibreGeocoderOptions = {
    zoom: 16,
    flyTo: true,
    trackProximity: true,
    showResultsWhileTyping: false,
    minLength: 2,
    reverseGeocode: false,
    limit: 5,
    enableEventLogging: true,
    marker: true,
    popup: false,
    maplibregl: undefined,
    collapsed: false,
    clearAndBlurOnEsc: false,
    clearOnBlur: false,
    proximityMinZoom: 9,

    getItemValue: (item) => {
      return item.text !== undefined ? item.text : item.place_name;
    },
    render: function (item: CarmenGeojsonFeature) {
      // Render as a suggestion
      if (!item.geometry) {
        const suggestionString = item.text;
        const indexOfMatch = suggestionString
          .toLowerCase()
          .indexOf(this.query.toLowerCase());
        const lengthOfMatch = this.query.length;
        const beforeMatch = suggestionString.substring(0, indexOfMatch);
        const match = suggestionString.substring(
          indexOfMatch,
          indexOfMatch + lengthOfMatch
        );
        const afterMatch = suggestionString.substring(
          indexOfMatch + lengthOfMatch
        );

        return (
          '<div class="maplibregl-ctrl-geocoder--suggestion">' +
          '<svg class="maplibregl-ctrl-geocoder--suggestion-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22.8702 20.1258H21.4248L20.9125 19.6318C22.7055 17.546 23.785 14.8382 23.785 11.8925C23.785 5.32419 18.4608 0 11.8925 0C5.32419 0 0 5.32419 0 11.8925C0 18.4608 5.32419 23.785 11.8925 23.785C14.8382 23.785 17.546 22.7055 19.6318 20.9125L20.1258 21.4248V22.8702L29.2739 32L32 29.2739L22.8702 20.1258ZM11.8925 20.1258C7.33676 20.1258 3.65923 16.4483 3.65923 11.8925C3.65923 7.33676 7.33676 3.65923 11.8925 3.65923C16.4483 3.65923 20.1258 7.33676 20.1258 11.8925C20.1258 16.4483 16.4483 20.1258 11.8925 20.1258Z" fill="#687078"/></svg>' +
          '<div class="maplibregl-ctrl-geocoder--suggestion-info">' +
          '<div class="maplibregl-ctrl-geocoder--suggestion-title">' +
          beforeMatch +
          '<span class="maplibregl-ctrl-geocoder--suggestion-match">' +
          match +
          "</span>" +
          afterMatch +
          "</div>" +
          "</div>" +
          "</div>"
        );
      }
      // render as a search result
      const placeName = item.place_name.split(",");

      return (
        '<div class="maplibregl-ctrl-geocoder--result">' +
        '<svg class="maplibregl-ctrl-geocoder--result-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.36571 0 0 5.38676 0 12.0471C0 21.0824 12 32 12 32C12 32 24 21.0824 24 12.0471C24 5.38676 18.6343 0 12 0ZM12 16.3496C9.63428 16.3496 7.71429 14.4221 7.71429 12.0471C7.71429 9.67207 9.63428 7.74454 12 7.74454C14.3657 7.74454 16.2857 9.67207 16.2857 12.0471C16.2857 14.4221 14.3657 16.3496 12 16.3496Z" fill="#687078"/></svg>' +
        "<div>" +
        '<div class="maplibregl-ctrl-geocoder--result-title">' +
        placeName[0] +
        "</div>" +
        '<div class="maplibregl-ctrl-geocoder--result-address">' +
        placeName.splice(1, placeName.length).join(",") +
        "</div>" +
        "</div>" +
        "</div>"
      );
    },
    popupRender: (item) => {
      const placeName = item.place_name.split(",");
      return (
        '<div class="maplibregl-ctrl-geocoder--suggestion popup-suggestion"><div class="maplibregl-ctrl-geocoder--suggestion-title popup-suggestion-title">' +
        placeName[0] +
        '</div><div class="maplibregl-ctrl-geocoder--suggestion-address popup-suggestion-address">' +
        placeName.splice(1, placeName.length).join(",") +
        "</div></div>"
      );
    },
    showResultMarkers: true,
    debounceSearch: 200,
  };
  
  private _eventEmitter: EventEmitter;
  private _map: Map | null;
  private _maplibregl: typeof MaplibreGl | undefined;
  private _inputEl: HTMLInputElement;
  private _clearEl: HTMLButtonElement;
  private _loadingEl: SVGElement;
  private _typeahead: Typeahead;
  private container: HTMLElement;
  private mapMarker: Marker | null;
  private resultMarkers: Marker[];
  private placeholder: string;
  private fresh: boolean;
  private lastSelected: string | null;
  private geocoderApi: MaplibreGeocoderApi;

  constructor(geocoderApi: MaplibreGeocoderApi, options: MaplibreGeocoderOptions) {
    this._eventEmitter = new EventEmitter();
    this.options = extend({}, this.options, options);
    this.fresh = true;
    this.lastSelected = null;
    this.geocoderApi = geocoderApi;
  }    

  /**
   * Add the geocoder to a container. The container can be either a `Map`, an `HTMLElement` or a CSS selector string.
   *
   * If the container is a [`Map`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map), this function will behave identically to [`Map.addControl(geocoder)`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map#addcontrol).
   * If the container is an instance of [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement), then the geocoder will be appended as a child of that [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement).
   * If the container is a [CSS selector string](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors), the geocoder will be appended to the element returned from the query.
   *
   * This function will throw an error if the container is none of the above.
   * It will also throw an error if the referenced HTML element cannot be found in the `document.body`.
   *
   * For example, if the HTML body contains the element `<div id='geocoder-container'></div>`, the following script will append the geocoder to `#geocoder-container`:
   * @example
   * ```js
   * const GeoApi = {
   *   forwardGeocode: (config) => { return { features: [] } },
   *   reverseGeocode: (config) => { return { features: [] } }
   * }
   * const geocoder = new MaplibreGeocoder(GeoAPI, {});
   * geocoder.addTo('#geocoder-container');
   * ```
   * @param container - A reference to the container to which to add the geocoder
   */
  public addTo(container: string | HTMLElement | Map): void {
    function addToExistingContainer(geocoder: MaplibreGeocoder, container: Element) {
      if (!document.body.contains(container)) {
        throw new Error(
          "Element provided to #addTo() exists, but is not in the DOM"
        );
      }
      const el = geocoder.onAdd(); //returns the input elements, which are then added to the requested html container
      container.appendChild(el);
    }

    // if the container is an HTMLElement, then set the parent to be that element
    if (container instanceof HTMLElement) {
      addToExistingContainer(this, container);
    }
    // if the container is a string, treat it as a CSS query
    else if (typeof container == "string") {
      const parent = document.querySelectorAll(container);
      if (parent.length === 0) {
        throw new Error("Element " + container + "not found.");
      }

      if (parent.length > 1) {
        throw new Error("Geocoder can only be added to a single html element");
      }

      addToExistingContainer(this, parent[0]);
    } 
    // if the container is a map, add the control like normal
    else if ('addControl' in container) {
      //  it's a maplibre-gl map, add like normal
      container.addControl(this);
    } else {
      throw new Error(
        "Error: addTo must be a maplibre-gl-js map, an html element, or a CSS selector query for a single html element"
      );
    }
  }

  onAdd(map?: Map): HTMLElement {
    if (map && typeof map != "string") {
      this._map = map;
    }

    this.setLanguage();

    if (this.options.localGeocoderOnly && !this.options.localGeocoder) {
      throw new Error(
        "A localGeocoder function must be specified to use localGeocoderOnly mode"
      );
    }

    this._onChange = this._onChange.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPaste = this._onPaste.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._showButton = this._showButton.bind(this);
    this._hideButton = this._hideButton.bind(this);
    this._onQueryResult = this._onQueryResult.bind(this);
    this.clear = this.clear.bind(this);
    this._updateProximity = this._updateProximity.bind(this);
    this._collapse = this._collapse.bind(this);
    this._unCollapse = this._unCollapse.bind(this);
    this._clear = this._clear.bind(this);
    this._clearOnBlur = this._clearOnBlur.bind(this);

    const el = (this.container = document.createElement("div"));
    el.className =
      "maplibregl-ctrl-geocoder maplibregl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl";

    const searchIcon = this.createIcon(
      "search",
      '<path d="M7.4 2.5c-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9c1 0 1.8-.2 2.5-.8l3.7 3.7c.2.2.4.3.8.3.7 0 1.1-.4 1.1-1.1 0-.3-.1-.5-.3-.8L11.4 10c.4-.8.8-1.6.8-2.5.1-2.8-2.1-5-4.8-5zm0 1.6c1.8 0 3.2 1.4 3.2 3.2s-1.4 3.2-3.2 3.2-3.3-1.3-3.3-3.1 1.4-3.3 3.3-3.3z"/>'
    );

    this._inputEl = document.createElement("input");
    this._inputEl.type = "text";
    this._inputEl.className =
      "maplibregl-ctrl-geocoder--input";

    this.setPlaceholder();

    if (this.options.collapsed) {
      this._collapse();
      this.container.addEventListener("mouseenter", this._unCollapse);
      this.container.addEventListener("mouseleave", this._collapse);
      this._inputEl.addEventListener("focus", this._unCollapse);
    }

    if (this.options.collapsed || this.options.clearOnBlur) {
      this._inputEl.addEventListener("blur", this._onBlur);
    }

    this._inputEl.addEventListener(
      "keydown",
      debounce(this._onKeyDown, this.options.debounceSearch)
    );
    this._inputEl.addEventListener("paste", this._onPaste);
    this._inputEl.addEventListener("change", this._onChange);
    this.container.addEventListener("mouseenter", this._showButton);
    this.container.addEventListener("mouseleave", this._hideButton);

    const actions = document.createElement("div");
    actions.classList.add(
      "maplibregl-ctrl-geocoder--pin-right"
    );

    this._clearEl = document.createElement("button");
    this._clearEl.setAttribute("type", "button");
    this._clearEl.setAttribute("aria-label", "Clear");
    this._clearEl.addEventListener("click", this.clear);
    this._clearEl.className = "maplibregl-ctrl-geocoder--button";

    const buttonIcon = this.createIcon(
      "close",
      '<path d="M3.8 2.5c-.6 0-1.3.7-1.3 1.3 0 .3.2.7.5.8L7.2 9 3 13.2c-.3.3-.5.7-.5 1 0 .6.7 1.3 1.3 1.3.3 0 .7-.2 1-.5L9 10.8l4.2 4.2c.2.3.7.3 1 .3.6 0 1.3-.7 1.3-1.3 0-.3-.2-.7-.3-1l-4.4-4L15 4.6c.3-.2.5-.5.5-.8 0-.7-.7-1.3-1.3-1.3-.3 0-.7.2-1 .3L9 7.1 4.8 2.8c-.3-.1-.7-.3-1-.3z"/>'
    );
    this._clearEl.appendChild(buttonIcon);

    this._loadingEl = this.createIcon(
      "loading",
      '<path fill="#333" d="M4.4 4.4l.8.8c2.1-2.1 5.5-2.1 7.6 0l.8-.8c-2.5-2.5-6.7-2.5-9.2 0z"/><path opacity=".1" d="M12.8 12.9c-2.1 2.1-5.5 2.1-7.6 0-2.1-2.1-2.1-5.5 0-7.7l-.8-.8c-2.5 2.5-2.5 6.7 0 9.2s6.6 2.5 9.2 0 2.5-6.6 0-9.2l-.8.8c2.2 2.1 2.2 5.6 0 7.7z"/>'
    );

    actions.appendChild(this._clearEl);
    actions.appendChild(this._loadingEl);

    el.appendChild(searchIcon);
    el.appendChild(this._inputEl);
    el.appendChild(actions);

    this._typeahead = new Typeahead(this._inputEl, [], {
      filter: false,
      minLength: this.options.minLength,
      limit: this.options.limit,
      noInitialSelection: true,
    });

    this.container.addEventListener("click", () => {
      this._typeahead.update(this._typeahead.data);
    });

    this.setRenderFunction(this.options.render);
    this._typeahead.getItemValue = this.options.getItemValue;

    this.mapMarker = null;
    this.resultMarkers = [];
    this._handleMarker = this._handleMarker.bind(this);
    this._handleResultMarkers = this._handleResultMarkers.bind(this);
    if (this._map) {
      if (this.options.trackProximity) {
        this._updateProximity();
        this._map.on("moveend", this._updateProximity);
      }
      this._maplibregl = this.options.maplibregl;
      if (!this._maplibregl && this.options.marker) {
         
        console.error(
          "No maplibregl detected in options. Map markers are disabled. Please set options.maplibregl."
        );
        this.options.marker = false;
      }
    }
    return el;
  }

  createIcon(name: string, path: string) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute(
      "class",
      "maplibregl-ctrl-geocoder--icon maplibregl-ctrl-geocoder--icon-" + name
    );
    icon.setAttribute("viewBox", "0 0 18 18");
    icon.setAttribute("xml:space", "preserve");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    // IE does not have innerHTML for SVG nodes
    if (!("innerHTML" in icon)) {
      const SVGNodeContainer = document.createElement("div");
      SVGNodeContainer.innerHTML =
        "<svg>" + path.valueOf().toString() + "</svg>";
      const SVGNode = SVGNodeContainer.firstChild,
        SVGPath = SVGNode.firstChild;
      (icon as any).appendChild(SVGPath);
    } else {
      icon.innerHTML = path;
    }
    return icon;
  }

  onRemove() {
    this.container.remove();

    if (this.options.trackProximity && this._map) {
      this._map.off("moveend", this._updateProximity);
    }

    this._removeMarker();

    this._map = null;

    return this;
  }

  _onPaste(e) {
    const value = (e.clipboardData || (window as any).clipboardData).getData("text");
    if (
      value.length >= this.options.minLength &&
      this.options.showResultsWhileTyping
    ) {
      this._geocode(value);
    }
  }

  _onKeyDown(e) {
    const ESC_KEY_CODE = 27;
    const TAB_KEY_CODE = 9;
    const ENTER_KEY_CODE = 13;

    if (e.keyCode === ESC_KEY_CODE && this.options.clearAndBlurOnEsc) {
      this._clear(e);
      return this._inputEl.blur();
    }

    const value = this._inputEl.value;

    if (!value) {
      this.fresh = true;
      // the user has removed all the text
      if (e.keyCode !== TAB_KEY_CODE) this.clear(e);
      return (this._clearEl.style.display = "none");
    }

    // TAB, ESC, LEFT, RIGHT, UP, DOWN
    if (
      e.metaKey ||
      [TAB_KEY_CODE, ESC_KEY_CODE, 37, 39, 38, 40].indexOf(e.keyCode) !== -1
    )
      return;

    // ENTER
    if (e.keyCode === ENTER_KEY_CODE) {
      if (!this.options.showResultsWhileTyping) {
        if (!this._typeahead.selected) {
          this._geocode(value);
        }
      } else {
        // Pressing enter on the search box will do a search for the currently string input
        if (
          this._typeahead.selected == null &&
          this.geocoderApi.getSuggestions
        ) {
          this._geocode(value, true);

          // If suggestions API is not defined pressing enter while the input box is selected will try to fit the results into the current map view
        } else if (this._typeahead.selected == null) {
          if (this.options.showResultMarkers) {
            this._fitBoundsForMarkers();
          }
        }
        return;
      }
    }

    // Show results while typing and greater than min length
    if (
      value.length >= this.options.minLength &&
      this.options.showResultsWhileTyping
    ) {
      this._geocode(value);
    }
  }

  _showButton() {
    if (this._inputEl.value.length > 0) this._clearEl.style.display = "block";
  }

  _hideButton() {
    if (this._typeahead.selected) this._clearEl.style.display = "none";
  }

  _onBlur(e) {
    if (this.options.clearOnBlur) {
      this._clearOnBlur(e);
    }
    if (this.options.collapsed) {
      this._collapse();
    }
  }
  // Change events are fire by suggestions library whenever the enter key is pressed or input is blurred
  // This can sometimes cause strange behavior as this function is called before our own onKeyDown handler and thus
  //  we cannot depend on some internal values of the suggestion state like `selected` as those will change or before
  //  our onKeyDown handler.
  _onChange() {
    const selected = this._typeahead.selected;

    // If a suggestion was selected
    if (selected && !selected.geometry) {
      if (selected.placeId) this._geocode(selected.placeId, true, true);
      else this._geocode(selected.text, true);
    } else if (selected && JSON.stringify(selected) !== this.lastSelected) {
      this._clearEl.style.display = "none";
      if (this.options.flyTo) {
        let flyOptions;
        this._removeResultMarkers();
        if (selected.properties && exceptions[selected.properties.short_code]) {
          // Certain geocoder search results return (and therefore zoom to fit)
          // an unexpectedly large bounding box: for example, both Russia and the
          // USA span both sides of -180/180, or France includes the island of
          // Reunion in the Indian Ocean. An incomplete list of these exceptions
          // at ./exceptions.json provides "reasonable" bounding boxes as a
          // short-term solution; this may be amended as necessary.
          flyOptions = extend({}, this.options.flyTo as any);
          if (this._map) {
            this._map.fitBounds(
              exceptions[selected.properties.short_code].bbox,
              flyOptions
            );
          }
        } else if (selected.bbox) {
          const bbox = selected.bbox;
          flyOptions = extend({}, this.options.flyTo as any);
          if (this._map) {
            this._map.fitBounds(
              [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]],
              ],
              flyOptions
            );
          }
        } else {
          const defaultFlyOptions = {
            zoom: this.options.zoom,
          };
          flyOptions = extend({}, defaultFlyOptions, this.options.flyTo as any);
          //  ensure that center is not overriden by custom options
          if (selected.center) {
            flyOptions.center = selected.center;
          } else if (
            selected.geometry &&
            selected.geometry.type &&
            selected.geometry.type === "Point" &&
            selected.geometry.coordinates
          ) {
            flyOptions.center = selected.geometry.coordinates;
          }

          if (this._map) {
            this._map.flyTo(flyOptions);
          }
        }
      }
      if (this.options.marker && this._maplibregl) {
        this._handleMarker(selected);
      }

      // After selecting a feature, re-focus the textarea and set
      // cursor at start, and reset the selected feature.
      this._inputEl.focus();
      this._inputEl.scrollLeft = 0;
      this._inputEl.setSelectionRange(0, 0);
      this.lastSelected = JSON.stringify(selected);
      this._typeahead.selected = null; // reset selection current selection value and set it to last selected
      this._eventEmitter.emit("result", { result: selected });
    }
  }

  _getConfigForRequest(): MaplibreGeocoderApiConfig {
    // Possible config proprerties to pass to client
    const keys = [
      "bbox",
      "limit",
      "proximity",
      "countries",
      "types",
      "language",
      "reverseMode",
    ];
    // Create config object
    const config: MaplibreGeocoderApiConfig = keys.reduce((config, key) => {
      if (this.options[key]) {
        if (["countries", "types", "language"].indexOf(key) > -1) {
          (config[key] = this.options[key].split(/[\s,]+/));
        } else {
          (config[key] = this.options[key]);
        }

        if (
          key === "proximity" &&
          this.options[key] &&
          typeof this.options[key].longitude === "number" &&
          typeof this.options[key].latitude === "number"
        ) {
          config[key] = [
            this.options[key].longitude,
            this.options[key].latitude,
          ];
        }
      }
      return config;
    }, {});

    return config;
  }

  async _geocode(searchInput: string, isSuggestion = false, isPlaceId = false): Promise<MaplibreGeocoderResults> {
    this._loadingEl.style.display = "block";
    this._eventEmitter.emit("loading", { query: searchInput });

    const config = this._getConfigForRequest();
    const request = this._createGeocodeRequest(config, searchInput, isSuggestion, isPlaceId);

    const localGeocoderResults = this.options.localGeocoder
      ? (this.options.localGeocoder(searchInput) || [])
      : [];
    try {
      const response = await request;
      await this._handleGeocodeResponse(
        response, 
        config,
        searchInput,
        isSuggestion,
        localGeocoderResults);
    } catch (err) {
      this._handleGeocodeErrorResponse(err, localGeocoderResults);
    }
    return request;
  }

  private _createGeocodeRequest(config: MaplibreGeocoderApiConfig, searchInput: string, isSuggestion: boolean, isPlaceId: boolean): Promise<MaplibreGeocoderResults> {
    if (this.options.localGeocoderOnly) {
      return Promise.resolve({} as any);
    }
    if (this.options.reverseGeocode && COORDINATES_REGEXP.test(searchInput)) {
      // searchInput resembles coordinates, make the request a reverseGeocode
      return this._createReverseGeocodeRequest(searchInput, config);
    } 
    config.query = searchInput;
    if (!this.geocoderApi.getSuggestions) {
      return this.geocoderApi.forwardGeocode(config);
    }
    if (!isSuggestion) {
      // user typed in text and should receive suggestions
      return this.geocoderApi.getSuggestions(config);
    }
    // user clicked on a suggestion
    if (this.geocoderApi.searchByPlaceId && isPlaceId) {
      // suggestion has place Id
      return this.geocoderApi.searchByPlaceId(config);
    } 
    return this.geocoderApi.forwardGeocode(config);
  }

  private _createReverseGeocodeRequest(searchInput: string, config: MaplibreGeocoderApiConfig) {
    // parse coordinates
    const coords = searchInput
      .split(/[\s(,)?]+/)
      .map((c) => parseFloat(c))
      .reverse();

    // client only accepts one type for reverseGeocode, so
    // use first config type if one, if not default to poi
    config.query = coords;
    config.limit = 1;

    // drop proximity which may have been set by trackProximity since it's not supported by the reverseGeocoder
    if ("proximity" in config) {
      delete config.proximity;
    }

    return this.geocoderApi.reverseGeocode(config);
  }

  private async _handleGeocodeResponse(
    response: MaplibreGeocoderResults,
    config: MaplibreGeocoderApiConfig,
    searchInput: string,
    isSuggestion: boolean,
    localGeocoderResults: CarmenGeojsonFeature[]
  ) {
    this._loadingEl.style.display = "none";

    let res = {} as MaplibreGeocoderResults & { config?: MaplibreGeocoderApiConfig, features?: CarmenGeojsonFeature[] };

    if (!response) {
      res = {
        type: "FeatureCollection",
        features: [],
      };
    } else {
      res = response;
    }

    res.config = config;
    if (this.fresh) {
      this.fresh = false;
    }

    // supplement Maplibre Geocoding API results with locally populated results
    res.features = res.features
      ? localGeocoderResults.concat(res.features)
      : localGeocoderResults;

    const externalGeocoderResultsPromise = this.options.externalGeocoder 
      ? (this.options.externalGeocoder(searchInput, res.features, config) || Promise.resolve([]))
      : Promise.resolve([]);
      // supplement Geocoding API results with features returned by a promise
    try {
      const features = await externalGeocoderResultsPromise;
      res.features = res.features
          ? features.concat(res.features)
          : features;
    } catch {
      // on error, display the original result
    }
    // apply results filter if provided
    if (this.options.filter && res.features.length) {
      res.features = res.features.filter(this.options.filter);
    }

    let results = [];
    if ('suggestions' in res) {
      results = res.suggestions;
    } else if ('place' in res) {
      results = [res.place];
    } else {
      results = res.features;
    }

    if (results.length) {
      this._clearEl.style.display = "block";
      this._typeahead.update(results);
      if (
        (!this.options.showResultsWhileTyping || isSuggestion) &&
        this.options.showResultMarkers &&
        (res.features.length > 0 || 'place' in res)
      ) {
        this._fitBoundsForMarkers();
      }
      
      this._eventEmitter.emit("results", res);
    } else {
      this._clearEl.style.display = "none";
      this._typeahead.selected = null;
      this._renderNoResults();
      
      this._eventEmitter.emit("results", res);
    }
  }

  private _handleGeocodeErrorResponse(error: Error, localGeocoderResults: CarmenGeojsonFeature[]) {
    this._loadingEl.style.display = "none";

      // in the event of an error in the Geocoding API still display results from the localGeocoder
      if (localGeocoderResults.length && this.options.localGeocoder) {
        this._clearEl.style.display = "block";
        this._typeahead.update(localGeocoderResults);
      } else {
        this._clearEl.style.display = "none";
        this._typeahead.selected = null;
        this._renderError();
      }

      this._eventEmitter.emit("results", { features: localGeocoderResults });
      this._eventEmitter.emit("error", { error });
  }

  /**
   * Shared logic for clearing input
   * @param ev - the event that triggered the clear, if available
   */
  private _clear(ev?: Event) {
    if (ev) ev.preventDefault();
    this._inputEl.value = "";
    this._typeahead.selected = null;
    this._typeahead.clear();
    this._onChange();
    this._clearEl.style.display = "none";
    this._removeMarker();
    this._removeResultMarkers();
    this.lastSelected = null;
    this._eventEmitter.emit("clear");
    this.fresh = true;
  }

  /**
   * Clear and then focus the input.
   * @param ev - the event that triggered the clear, if available
   *
   */
  clear(ev?: Event) {
    this._clear(ev);
    this._inputEl.focus();
  }

  /**
   * Clear the input, without refocusing it. Used to implement clearOnBlur
   * constructor option.
   * @param ev - the blur event
   */
  private _clearOnBlur(ev?: Event & { relatedTarget: Element }) {
    /*
     * If relatedTarget is not found, assume user targeted the suggestions list.
     * In that case, do not clear on blur. There are other edge cases where
     * ev.relatedTarget could be null. Clicking on list always results in null
     * relatedtarget because of upstream behavior in `suggestions`.
     *
     * The ideal solution would be to check if ev.relatedTarget is a child of
     * the list. See issue #258 for details on why we can't do that yet.
     */
    if (ev.relatedTarget) {
      this._clear(ev);
    }
  }

  _onQueryResult(results: MaplibreGeocoderResults) {
    if (!('features' in results)) {
      return;
    }
    if (!results.features.length) return;
    const result = results.features[0];
    this._typeahead.selected = result;
    this._inputEl.value = result.place_name;
    this._onChange();
  }

  _updateProximity() {
    // proximity is designed for local scale, if the user is looking at the whole world,
    // it doesn't make sense to factor in the arbitrary centre of the map
    if (!this._map) {
      return;
    }
    if (this._map.getZoom() > this.options.proximityMinZoom) {
      const center = this._map.getCenter().wrap();
      this.setProximity({ longitude: center.lng, latitude: center.lat });
    } else {
      this.setProximity(null);
    }
  }

  _collapse() {
    // do not collapse if input is in focus
    if (!this._inputEl.value && this._inputEl !== document.activeElement)
      this.container.classList.add(
        "maplibregl-ctrl-geocoder--collapsed"
      );
  }

  _unCollapse() {
    this.container.classList.remove(
      "maplibregl-ctrl-geocoder--collapsed"
    );
  }

  /**
   * Set & query the input
   * @param searchInput - location name or other search input
   */
  async query(searchInput: string) {
    const results = await this._geocode(searchInput);
    this._onQueryResult(results);
  }

  _renderError() {
    const errorMessage =
      `<div class='maplibre-gl-geocoder--error'>${this._localize("errorConnectionFailed")}</div>`;
    this._renderMessage(errorMessage);
  }

  _renderNoResults() {
    const errorMessage =
      `<div class='maplibre-gl-geocoder--error maplibre-gl-geocoder--no-results'>
        ${this._localize("errorNoResults")}</div>`;
    this._renderMessage(errorMessage);
  }

  _renderMessage(msg) {
    this._typeahead.update([]);
    this._typeahead.selected = null;
    this._typeahead.clear();
    this._typeahead.renderError(msg);
  }

  /**
   * Get a localised string for a given key
   *
   * If language is provided in options, attempt to return localized string (defaults to English)
   * @param key - key in the localization object
   * @returns localized string
   */
  private _localize(key: keyof typeof localization): string {
    const language = subtag.language(this.options.language.split(',')[0]);
    return this.options.language && localization?.[key][language] ? localization[key][language] : localization[key]['en']
  }

  /**
   * Fits the map to the current bounds for the searched results
   */
  private _fitBoundsForMarkers(): this {
    if (this._typeahead.data.length < 1) return;

    // Filter out suggestions and restrict to limit
    const results = this._typeahead.data
      .filter((result) => {
        return typeof result === "string" ? false : true;
      })
      .slice(0, this.options.limit);

    this._clearEl.style.display = "none";

    if (this.options.flyTo && this._maplibregl) {
      if (this._map) {
        const defaultFlyOptions = { padding: 100 };
        const flyOptions = extend({}, defaultFlyOptions, this.options.flyTo as any);
        const bounds = new this._maplibregl.LngLatBounds();
        for (const feature of results) {
          bounds.extend(feature.geometry.coordinates);
        }
        this._map.fitBounds(bounds, flyOptions);
      }
    }

    if (results.length > 0 && this._maplibregl) {
      this._handleResultMarkers(results);
    }

    return this;
  }

  /**
   * Set input
   * @param searchInput - location name or other search input
   */
  setInput(searchInput: string): this {
    // Set input value to passed value and clear everything else.
    this._inputEl.value = searchInput;
    this._typeahead.selected = null;
    this._typeahead.clear();
    if (
      searchInput.length >= this.options.minLength &&
      this.options.showResultsWhileTyping
    ) {
      this._geocode(searchInput);
    }
    return this;
  }

  /**
   * Set proximity
   * @param proximity - The new `options.proximity` value. This is a geographical point given as an object with `latitude` and `longitude` properties.
   */
  setProximity(proximity: { longitude: number; latitude: number }): this {
    this.options.proximity = proximity;
    return this;
  }

  /**
   * Get proximity
   * @returns The geocoder proximity
   */
  getProximity(): { longitude: number; latitude: number } {
    return this.options.proximity;
  }

  /**
   * Set the render function used in the results dropdown
   * @param fn - The function to use as a render function. This function accepts a single {@link CarmenGeojsonFeature} object as input and returns a string.
   */
  setRenderFunction(fn: (feature: CarmenGeojsonFeature) => string): this {
    if (fn && typeof fn == "function") {
      this._typeahead.render = fn;
    }
    return this;
  }

  /**
   * Get the function used to render the results dropdown
   *
   * @returns the render function
   */
  getRenderFunction(): (feature: CarmenGeojsonFeature) => string {
    return this._typeahead.render;
  }

  /**
   * Get the language to use in UI elements and when making search requests
   *
   * Look first at the explicitly set options otherwise use the browser's language settings
   * @param language - Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas.
   */
  setLanguage(language?: string): this {
    this.options.language = language || this.options.language || navigator.language;;
    return this;
  }

  /**
   * Get the language to use in UI elements and when making search requests
   * @returns The language(s) used by the plugin, if any
   */
  getLanguage(): string {
    return this.options.language;
  }

  /**
   * Get the zoom level the map will move to when there is no bounding box on the selected result
   * @returns the map zoom
   */
  getZoom(): number {
    return this.options.zoom;
  }

  /**
   * Set the zoom level
   * @param zoom - The zoom level that the map should animate to when a `bbox` isn't found in the response. If a `bbox` is found the map will fit to the `bbox`.
   * @returns this
   */
  setZoom(zoom: number): this {
    this.options.zoom = zoom;
    return this;
  }

  /**
   * Get the parameters used to fly to the selected response, if any
   * @returns The `flyTo` option
   */
  getFlyTo(): boolean | FlyToOptions {
    return this.options.flyTo;
  }

  /**
   * Set the flyTo options
   * @param flyTo - If false, animating the map to a selected result is disabled. If true, animating the map will use the default animation parameters. If an object, it will be passed as `options` to the map [`flyTo`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map#flyto) or [`fitBounds`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map#fitbounds) method providing control over the animation of the transition.
   */
  setFlyTo(flyTo: boolean | FlyToOptions): this {
    this.options.flyTo = flyTo;
    return this;
  }

  /**
   * Get the value of the placeholder string
   * @returns The input element's placeholder value
   */
  getPlaceholder(): string {
    return this.options.placeholder;
  }

  /**
   * Set the value of the input element's placeholder
   * @param placeholder - the text to use as the input element's placeholder
   */
  setPlaceholder(placeholder?: string): this {
    this.placeholder = placeholder ? placeholder : this.options.placeholder || this._localize("placeholder");
    this._inputEl.placeholder = this.placeholder;
    this._inputEl.setAttribute("aria-label", this.placeholder);
    return this;
  }

  /**
   * Get the bounding box used by the plugin
   * @returns the bounding box, if any
   */
  getBbox(): number[] {
    return this.options.bbox;
  }

  /**
   * Set the bounding box to limit search results to
   * @param bbox - a bounding box given as an array in the format [minX, minY, maxX, maxY].
   */
  setBbox(bbox: [number, number, number, number]): this {
    this.options.bbox = bbox;
    return this;
  }

  /**
   * Get a list of the countries to limit search results to
   * @returns a comma separated list of countries to limit to, if any
   */
  getCountries(): string {
    return this.options.countries;
  }

  /**
   * Set the countries to limit search results to
   * @param countries - a comma separated list of countries to limit to
   */
  setCountries(countries: string):this {
    this.options.countries = countries;
    return this;
  }

  /**
   * Get a list of the types to limit search results to
   * @returns a comma separated list of types to limit to
   */
  getTypes(): string {
    return this.options.types;
  }

  /**
   * Set the types to limit search results to
   * @param types - a comma separated list of types to limit to
   */
  setTypes(types: string): this {
    this.options.types = types;
    return this;
  }

  /**
   * Get the minimum number of characters typed to trigger results used in the plugin
   * @returns The minimum length in characters before a search is triggered
   */
  getMinLength(): number {
    return this.options.minLength;
  }

  /**
   * Set the minimum number of characters typed to trigger results used by the plugin
   * @param minLength - the minimum length in characters
   */
  setMinLength(minLength: number): this {
    this.options.minLength = minLength;
    if (this._typeahead) this._typeahead.options.minLength = minLength;
    return this;
  }

  /**
   * Get the limit value for the number of results to display used by the plugin
   * @returns The limit value for the number of results to display used by the plugin
   */
  getLimit(): number {
    return this.options.limit;
  }

  /**
   * Set the limit value for the number of results to display used by the plugin
   * @param limit - the number of search results to return
   */
  setLimit(limit: number): this {
    this.options.limit = limit;
    if (this._typeahead) this._typeahead.options.limit = limit;
    return this;
  }

  /**
   * Get the filter function used by the plugin
   * @returns the filter function
   */
  getFilter(): (feature: CarmenGeojsonFeature) => boolean {
    return this.options.filter;
  }

  /**
   * Set the filter function used by the plugin.
   * @param filter - A function which accepts a {@link CarmenGeojsonFeature} to filter out results from the Geocoding API response before they are included in the suggestions list. Return `true` to keep the item, `false` otherwise.
   */ 
  setFilter(filter: (feature: CarmenGeojsonFeature) => boolean): this {
    this.options.filter = filter;
    return this;
  }

  /**
   * Set the geocoding api used by the plugin.
   */
  setGeocoderApi(geocoderApi: MaplibreGeocoderApi): this {
    this.geocoderApi = geocoderApi;
    return this;
  }

  /**
   * Get the geocoding endpoint the plugin is currently set to
   * @returns the geocoding API
   */
  getGeocoderApi(): MaplibreGeocoderApi {
    return this.geocoderApi;
  }

  /**
   * Handle the placement of a result marking the selected result
   * @param selected - the selected geojson feature
   */
  private _handleMarker(selected: any): this {
    // clean up any old marker that might be present
    if (!this._map) {
      return;
    }
    this._removeMarker();
    const defaultMarkerOptions = {
      color: "#4668F2",
    };
    const markerOptions = extend({}, defaultMarkerOptions, this.options.marker as any);
    this.mapMarker = new this._maplibregl.Marker(markerOptions);

    let popup;
    if (this.options.popup) {
      const defaultPopupOptions = {};
      const popupOptions = extend({}, defaultPopupOptions, this.options.popup as any);
      popup = new this._maplibregl.Popup(popupOptions).setHTML(
        this.options.popupRender(selected)
      );
    }

    if (selected.center) {
      this.mapMarker.setLngLat(selected.center).addTo(this._map);

      if (this.options.popup) this.mapMarker.setPopup(popup);
    } else if (
      selected.geometry &&
      selected.geometry.type &&
      selected.geometry.type === "Point" &&
      selected.geometry.coordinates
    ) {
      this.mapMarker.setLngLat(selected.geometry.coordinates).addTo(this._map);

      if (this.options.popup) this.mapMarker.setPopup(popup);
    }
    return this;
  }

  /**
   * Handle the removal of a result marker
   */
  private _removeMarker() {
    if (this.mapMarker) {
      this.mapMarker.remove();
      this.mapMarker = null;
    }
  }

  /**
   * Handle the placement of a result marking the selected result
   * @param results - the top results to display on the map
   */
  private _handleResultMarkers(results: any[]): this {
    // clean up any old marker that might be present
    if (!this._map) {
      return;
    }
    this._removeResultMarkers();
    const defaultMarkerOptions = {
      color: "#4668F2",
    };
    let markerOptions = extend(
      {},
      defaultMarkerOptions,
      this.options.showResultMarkers as any
    );

    for (const result of results) {
      let el: Node;
      if (this.options.showResultMarkers) {
        if (
          this.options.showResultMarkers &&
          (this.options.showResultMarkers as MarkerOptions).element
        ) {
          el = (this.options.showResultMarkers as MarkerOptions).element.cloneNode(true);
          markerOptions = extend(markerOptions, { element: el });
        }

        const marker = new this._maplibregl.Marker(
          extend({}, markerOptions, { element: el })
        );

        let popup;
        if (this.options.popup) {
          const defaultPopupOptions = {};
          const popupOptions = extend(
            {},
            defaultPopupOptions,
            this.options.popup as any
          );
          popup = new this._maplibregl.Popup(popupOptions).setHTML(
            this.options.popupRender(result)
          );
        }
        if (result.center) {
          marker.setLngLat(result.center).addTo(this._map);
          if (this.options.popup) marker.setPopup(popup);
        } else if (
          result.geometry &&
          result.geometry.type &&
          result.geometry.type === "Point" &&
          result.geometry.coordinates
        ) {
          marker.setLngLat(result.geometry.coordinates).addTo(this._map);
          if (this.options.popup) marker.setPopup(popup);
        }
        this.resultMarkers.push(marker);
      }
    }
    return this;
  }

  /**
   * Handle the removal of a result marker
   */
  private _removeResultMarkers() {
    if (this.resultMarkers && this.resultMarkers.length > 0) {
      this.resultMarkers.forEach(function (marker) {
        marker.remove();
      });
      this.resultMarkers = [];
    }
  }

  /**
   * Subscribe to events that happen within the plugin.
   * @param type - name of event. Available events and the data passed into their respective event objects are:
   *
   * - __clear__ `Emitted when the input is cleared`
   * - __loading__ `{ query } Emitted when the geocoder is looking up a query`
   * - __results__ `{ results } Fired when the geocoder returns a response`
   * - __result__ `{ result } Fired when input is set`
   * - __error__ `{ error } Error as string`
   * @param fn - function that's called when the event is emitted.
   */
  on(type: string, fn: (e: any) => void): this {
    this._eventEmitter.on(type, fn);
    return this;
  }

  /**
   * Subscribe to events that happen within the plugin only once.
   * @param type - Event name.
   * Available events and the data passed into their respective event objects are:
   *
   * - __clear__ `Emitted when the input is cleared`
   * - __loading__ `{ query } Emitted when the geocoder is looking up a query`
   * - __results__ `{ results } Fired when the geocoder returns a response`
   * - __result__ `{ result } Fired when input is set`
   * - __error__ `{ error } Error as string`
   * @returns a Promise that resolves when the event is emitted.
   */
  once(type: string): Promise<any> {
    return new Promise((resolve) => {
      this._eventEmitter.once(type, resolve);
    });
  }

  /**
   * Remove an event
   * @param type - Event name.
   * @param fn - Function that should unsubscribe to the event emitted.
   */
  off(type: string, fn: (e: any) => void): this {
    this._eventEmitter.removeListener(type, fn);
    return this;
  }
}
