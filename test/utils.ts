import MaplibreGeocoder, { type MaplibreGeocoderApi } from "../lib/index";
import type { FitBoundsOptions, FlyToOptions, LngLatBoundsLike } from "maplibre-gl";

export class LngLatMock {
    constructor(public lng: number, public lat: number) {}
    wrap() {return this};
}

export class MapMock {
    center = new LngLatMock(0, 0);
    zoom = 1;
    cbMap = {};
    container: HTMLElement;
    constructor(private opts: any) {
        this.container = opts.container;
    }

    addControl(c) { this.container.appendChild(c.onAdd(this))};
    removeControl(c) {c.onRemove(this)};
    getZoom() {return this.zoom};
    on(type: string, cb: (e: any) => void) { this.cbMap[type] = cb; };
    off(type: string, _cb: (e: any) => void) { delete this.cbMap[type]; }
    flyTo(_opts: FlyToOptions) {};
    fitBounds(_bounds: LngLatBoundsLike, _options?: FitBoundsOptions) {};
    getCenter() {return this.center};
    jumpTo(options: { zoom: number; center: number[]; }) {
        this.center = new LngLatMock(options.center[0], options.center[1]);
    }
    setZoom(zoom: number) { 
        this.zoom = zoom;
        this.cbMap['moveend']();
    };
    setCenter(center: number[]) { 
        this.center = new LngLatMock(center[0], center[1]);
        this.cbMap['moveend']();
    }
    getContainer() { return this.container; }
}

export function createMarkerMock() {
    const markerWithSpy = jest.fn();
    markerWithSpy.mockImplementation(() => {
        const obj = {
            setLngLat: () => { return obj; },
            addTo: () => { return obj; },
            remove: () => {},
            setPopup: () => { return obj; },
        }
        return obj;
    });
    return markerWithSpy;
}

export function createPopupMock() {
    const popupWithSpy = jest.fn();
    popupWithSpy.mockImplementation(() => {
        const obj = {
            setHTML: () => { return obj; },
        }
        return obj;
    });
    return popupWithSpy;
}

export class LngLatBoundsMock {
    constructor(private opts: any) {}
    extend() {};
}

export function init(opts?: any) {
    opts = opts || {};
    opts.enableEventLogging = false;
    opts.maplibregl = opts.maplibregl || { Marker: createMarkerMock(), LngLatBounds: LngLatBoundsMock };
    const container = document.createElement("div");
    const map = new MapMock({ container: container });
    const geocoderApi =
      opts.geocoderApi ||
      mockGeocoderApi(opts.features, opts.errorMessage);
    const geocoder = new MaplibreGeocoder(geocoderApi, opts);
    map.addControl(geocoder);
    return { map, geocoder, container };
}

export function initNoMap(opts) {
    opts = opts || {};
    opts.enableEventLogging = false;
    const container = document.createElement("div");
    container.className = "notAMap";
    document.body.appendChild(container);
    const geocoderApi = mockGeocoderApi(opts.features, opts.errorMessage);
    const geocoder = new MaplibreGeocoder(geocoderApi, opts);
    geocoder.addTo(".notAMap");
    return {geocoder, container}
}

export function initHtmlElement(opts?: any) {
    opts = opts || {};
    opts.enableEventLogging = false;
    const container = document.createElement("div");
    container.className = "notAMap";
    document.body.appendChild(container);
    const geocoderApi = mockGeocoderApi(opts.features, opts.errorMessage);
    const geocoder = new MaplibreGeocoder(geocoderApi, opts);
    geocoder.addTo(container);
    return {geocoder, container}
}


export function mockGeocoderApi(features, errorMessage?: string): MaplibreGeocoderApi {
    return {
        forwardGeocode: async () => {
        return new Promise((resolve, reject) => {
            if (errorMessage) reject(errorMessage);
            resolve({ features: features || [] } as any);
        });
        },
        reverseGeocode: async () => {
        return new Promise((resolve, reject) => {
            if (errorMessage) reject(errorMessage);
            resolve({ features: features || [] } as any);
        });
        },
    };
};

export function createMockGeocoderApiWithSuggestions(features, suggestions, errorMessage?: string): MaplibreGeocoderApi {
    return {
        forwardGeocode: () => {
            return new Promise((resolve, reject) => {
                if (errorMessage) reject(errorMessage);
                resolve({ features: (features || []) });
            });
        },
        reverseGeocode: () => {
            return new Promise((resolve, reject) => {
                if (errorMessage) reject(errorMessage);
                resolve({ features: (features || []) });
            });
        },
        getSuggestions: () => {
            return new Promise((resolve, reject) => {
                if (errorMessage) reject(errorMessage);
                resolve({ suggestions: suggestions || [], features: [] });
            });
        },
        searchByPlaceId: () => {
            return new Promise((resolve, reject) => {
                if (errorMessage) reject(errorMessage);
                resolve({ features: features[0] || [] });
            });
        },
    } as any;
}