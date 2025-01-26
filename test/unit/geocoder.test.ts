import { describe, test, expect, vi } from 'vitest';
import MaplibreGeocoder from "../../lib/index";
import Features from "./mockFeatures";
import { createMarkerMock, createPopupMock, LngLatBoundsMock, MapMock, init, createMockGeocoderApiWithSuggestions } from "./utils";

describe("geocoder", () => {
  let map: MapMock, geocoder: any;

  function setup(opts?: any) {
    const initResults = init(opts);
    map = initResults.map;
    geocoder = initResults.geocoder;
  }

    test("initialized", () => {
        setup();
        expect(geocoder).toBeDefined();
    });

    test("set/get input", async () => {
        setup({
            proximity: { longitude: -79.45, latitude: 43.65 },
            features: [Features.QUEEN_STREET],
        });
        geocoder.query("Queen Street");
        const mapMoveSpy = vi.spyOn(map, "flyTo");
        await geocoder.once("result");
        expect(mapMoveSpy).toHaveBeenCalledTimes(1);
        const mapMoveArgs = mapMoveSpy.mock.calls[0][0];
        expect(mapMoveArgs.center[0]).not.toBe(0);
        expect(mapMoveArgs.center[1]).not.toBe(0);
    });

    test("Selected value is reset after a result is selected", async () => {
        setup({
            proximity: { longitude: -79.45, latitude: 43.65 },
            features: [Features.QUEEN_STREET],
        });
        geocoder.query("Queen Street");
        await geocoder.once("result");
        expect(geocoder.lastSelected).toBeDefined();
        expect(geocoder._typeahead.selected).toBeNull();
    });

    test("options", async () => {
        setup({
          flyTo: false,
          country: "fr",
          types: "region",
          features: [Features.PARIS],
        });
    
        geocoder.query("Paris");
    
        let e = await geocoder.once("results");
        expect(e.features.length).toBe(1);
        expect(geocoder.fresh).toBe(false);
        
        e = await geocoder.once("result")
        const center = map.getCenter();
        expect(center.lng).toBe(0);
        expect(center.lat).toBe(0);
        expect(e.result.place_name).toBe("Paris, France");
      });

      test("options.bbox", async () => {
        const bbox = [
          -122.71901248631752, 37.62347223479118, -122.18070124967602,
          37.87996631184369,
        ];
        setup({
          bbox,
          features: [Features.LONDON],
        });
    
        geocoder.query("London");
        const e = await geocoder.once("results")
        expect(e.features.length).toBe(1);
        expect(e.config.bbox).toBe(bbox);
        expect(e.features[0].text).toBe("London, Greater London, England, GBR");
      });

      test("options.reverseGeocode - true", async () => {
        setup({
          reverseGeocode: true,
          features: [Features.TANZANIA],
        });
        geocoder.query("-6.1933875, 34.5177548");
        const e = await geocoder.once("results");
        expect(e.features.length).toBe(1);
        expect(e.features[0].place_name.indexOf("Tanzania")).toBeGreaterThan(-1);
        expect(e.features[0].place_name.indexOf("Singida")).toBeGreaterThan(-1);
        expect(e.config.limit).toBe(1);
      });

      test("options.reverseGeocode - false by default", async () => {
        setup();
        geocoder.query("-6.1933875, 34.5177548");
        expect(geocoder.options.reverseGeocode).toBeFalsy();
        const e = await geocoder.once("results");
        expect(e.features.length).toBe(0);
      });

      test("options.reverseGeocode: true with trackProximity: true", async () => {
          setup({
            reverseGeocode: true,
            trackProximity: true,
          });
          map.jumpTo({
            zoom: 16,
            center: [10, 10],
          });
          geocoder.query("-6.1933875, 34.5177548");
          const e = await geocoder.once("results");
          expect(e.features.length).toBe(0);
        }
      );

      test("parses options correctly", async () => {
        setup({
          language: "en,es,zh",
          types: "district, locality, neighborhood, postcode",
          countries: "us, mx",
        });
    
        geocoder.query("Hartford");
        const e = await geocoder.once("results");
        expect(e.config.language).toEqual(["en", "es", "zh"]);
        expect(e.config.types).toEqual(["district", "locality", "neighborhood", "postcode"]);
        expect(e.config.countries).toEqual(["us", "mx"]);
      });

      test("options.limit", async () => {
        setup({
          flyTo: false,
          limit: 2,
        });
    
        geocoder.query("London");
        const e = await geocoder.once("results");
        expect(e.config.limit).toBe(2);
      });

      test("options:zoom", async () => {
        setup({ zoom: 12, features: [Features.BELLINGHAM] });
        const q = geocoder.query("1714 14th St NW");
        const mapMoveSpy = vi.spyOn(map, "flyTo");
        await geocoder.once("results");
        await q;
        const mapMoveArgs = mapMoveSpy.mock.calls[0][0];
        expect(mapMoveArgs.zoom).toBe(12);
      });

      test("options.localGeocoder", async () => {
        setup({
          flyTo: false,
          limit: 6,
          localGeocoder: (q) => {
            return [{text: q}];
          },
        });
        let q = geocoder.query("-30,150");
        let e = await geocoder.once("results");
        await q;
        expect(e.features).toHaveLength(1);
        q = geocoder.query("London");
        e = await geocoder.once("results");
        await q;
        expect(e.features).toHaveLength(1);
        q = geocoder.query("London");
        e = await geocoder.once("results");
        await q;
        expect(e.features[0].text).toBe("London");
    });

    test("options.externalGeocoder", async () => {
        setup({
          flyTo: false,
          limit: 6,
          externalGeocoder: () => {
            return Promise.resolve([
              {
                id: "place.7673410831246050",
                type: "Feature",
                place_name:
                  "Promise: Washington, District of Columbia, United States of America",
                geometry: { type: "Point", coordinates: [-77.0366, 38.895] },
              },
            ]);
          },
        });
    
        let q = geocoder.query("Washington, DC");
        let e = await geocoder.once("results");
        await q;
        expect(e.features.length).toBe(1);

    
        q = geocoder.query("DC");
        e = await geocoder.once("results");
        await q;
        expect(e.features.length).toBe(1);
    
        q = geocoder.query("District of Columbia");
        e = await geocoder.once("results");
        expect(e.features[0].place_name).toBe(
          "Promise: Washington, District of Columbia, United States of America");
      });

      test("country bbox", async () => {
        setup({ features: [Features.CANADA] });
        const q = geocoder.query("Canada");
        const fitBoundsSpy = vi.spyOn(map, "fitBounds");
        await geocoder.once("results");
        await q;
        expect(fitBoundsSpy).toHaveBeenCalledTimes(2);
        const fitBoundsArgs = fitBoundsSpy.mock.calls[1][0];
        // flatten
        const mapBBox = [
          fitBoundsArgs[0][0],
          fitBoundsArgs[0][1],
          fitBoundsArgs[1][0],
          fitBoundsArgs[1][1],
        ];
        for (let i = 0; i <  mapBBox.length; i++) {
            expect(mapBBox[i]).toBeCloseTo(Features.CANADA.bbox[i]);
        }
      });

      test("country bbox exception", async () => {
        setup({ features: [Features.CANADA] });
        const q = geocoder.query("Canada");
        const fitBoundsSpy = vi.spyOn(map, "fitBounds");
        await geocoder.once("results");
        await q;
        expect(fitBoundsSpy).toHaveBeenCalledTimes(2);
        const fitBoundsArgs = fitBoundsSpy.mock.calls[1][0];
        // flatten
        const mapBBox = [
          fitBoundsArgs[0][0],
          fitBoundsArgs[0][1],
          fitBoundsArgs[1][0],
          fitBoundsArgs[1][1],
        ];
        const expectedBBoxFlat = [-140.99778, 41.675105, -52.648099, 83.23324];
        for (let i = 0; i <  mapBBox.length; i++) {
            expect(mapBBox[i]).toBeCloseTo(expectedBBoxFlat[i]);
        }
      });

      test("options.filter", async () => {
        const features = [
          {
            geometry: {
              type: "Point",
              coordinates: [151.00669000000005, -34.087129999999945],
            },
            place_name: "Heathcote, Sydney, New South Wales, AUS",
            properties: {
              Country: "AUS",
              Label: "Heathcote, Sydney, New South Wales, AUS",
              Municipality: "Sydney",
              Region: "New South Wales",
            },
            type: "Feature",
            text: "Heathcote, Sydney, New South Wales, AUS",
            place_type: ["place"],
            center: [151.00669000000005, -34.087129999999945],
          },
          {
            geometry: {
              type: "Point",
              coordinates: [144.7001100000001, -36.914169999999956],
            },
            place_name: "Heathcote, Victoria, AUS",
            properties: {
              Country: "AUS",
              Label: "Heathcote, Victoria, AUS",
              Municipality: "Heathcote",
              Region: "Victoria",
            },
            type: "Feature",
            text: "Heathcote, Victoria, AUS",
            place_type: ["place"],
            center: [144.7001100000001, -36.914169999999956],
          },
        ];
        /* testing filter by searching for a place Heathcote in New South Wales, Australia,
         * which also exists in a part of Victoria which is still inside the New South Wales bbox. */
        setup({
          country: "au",
          types: "locality",
          features,
          bbox: [140.99926, -37.595494, 159.51677, -28.071477], // bbox for New South Wales, but Heathcote, Victoria is still within this bbox
          filter: (item) => {
            // returns true if item contains 'New South Wales' as the region
            return item.text === "Heathcote, Sydney, New South Wales, AUS";
          },
        });
    
        geocoder.query("Heathcote");
        const e = await geocoder.once("results");
        expect(e.features.some(f => f.place_name === "Heathcote, Sydney, New South Wales, AUS")).toBeTruthy();
        expect(e.features.some(f => f.place_name === "Heathcote, Victoria, AUS")).toBeFalsy();
      });

      test("options.trackProximity", () => {
        setup({
          trackProximity: true,
        });
    
        map.setZoom(10);
        map.setCenter([15, 10]);
        expect(geocoder.getProximity()).toEqual({ longitude: 15, latitude: 10 });
    
        map.setZoom(9);
        expect(geocoder.getProximity()).toBeNull();
      });

      test("options.trackProximity=false", () => {
    
        setup({
          trackProximity: false,
        });
        expect(geocoder.options.trackProximity).toBeFalsy();
        expect(geocoder.getProximity()).toBeUndefined();
      });

      test("options.setProximity", async () => {
        const features = [];
        setup({ features });
    
        map.setZoom(13);
        map.setCenter([-79.4512, 43.6568]);
        geocoder.setProximity({ longitude: -79.4512, latitude: 43.6568 });
    
        geocoder.query("high");
        const e = await geocoder.once("results");
        expect(e.config.proximity[0]).toBe(-79.4512);
        expect(e.config.proximity[1]).toBe(43.6568);
      });

      test("set proximity to null for world zoom level", async () => {
        setup({});
    
        geocoder.setProximity({ longitude: 10, latitude: 11 });

        map.setZoom(5);
        expect(geocoder.getProximity()).toBeNull();
      });

      test("set proximity to null for world zoom level", async () => {
        setup({proximityMinZoom: 4});
    
        geocoder.setProximity({ longitude: 10, latitude: 11 });

        map.setZoom(5);
        expect(geocoder.getProximity()).not.toBeNull();
      });

      test("options.render", () => {
        setup({
          render: (feature) => {
            return "feature id is " + feature.id;
          },
        });
    
        const fixture = {
          id: "abc123",
          place_name: "San Francisco, California",
        };
    
        expect(geocoder._typeahead.render).toBeDefined();
        expect(typeof geocoder._typeahead.render).toBe("function");
        expect(geocoder._typeahead.render(fixture)).toBe("feature id is abc123");
      });

      test("setRenderFunction with no input", () => {
        setup({});
        const result = geocoder.setRenderFunction();
        expect(typeof geocoder._typeahead.render).toBe("function");
        expect(result instanceof MaplibreGeocoder).toBeTruthy();
      });

      test("setRenderFunction with function input", () => {
        setup({});
        const result = geocoder.setRenderFunction(function (item) {
          return item.place_name;
        });
        expect(typeof geocoder._typeahead.render).toBe("function");
        expect(result instanceof MaplibreGeocoder).toBeTruthy();
      });

      test("getRenderFunction default", () => {
        setup({});
        const result = geocoder.getRenderFunction();
        expect(result).toBeDefined();
        expect(typeof result).toBe("function");
      });

      test("getRenderFunction", () => {
        setup({
          render: (item) => {
            return item.place_name;
          },
        });
        const result = geocoder.getRenderFunction();
        expect(result).toBeDefined();
        expect(typeof result).toBe("function");
      });

      test("options.getItemValue", () => {
        setup({
          getItemValue: (feature) => {
            return "feature id is " + feature.id;
          },
        });
    
        const fixture = {
          id: "abc123",
          place_name: "San Francisco, California",
        };
    
        expect(geocoder._typeahead.getItemValue).toBeDefined();
        expect(typeof geocoder._typeahead.getItemValue).toBe("function");
        expect(geocoder._typeahead.getItemValue(fixture)).toBe("feature id is abc123");
      });

      test("options.getItemValue default", () => {
        setup({});
    
        const fixture = {
          id: "abc123",
          place_name: "San Francisco, California",
        };
    
        expect(geocoder._typeahead.getItemValue).toBeDefined();
        expect(typeof geocoder._typeahead.getItemValue).toBe("function");
        expect(geocoder._typeahead.getItemValue(fixture)).toBe("San Francisco, California");
      });

      test("options.flyTo [false]", async () => {
        setup({
          flyTo: false,
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
        const mapFlyMethod = vi.spyOn(map, "flyTo");
        geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        expect(mapFlyMethod).not.toHaveBeenCalled();
      });
 
      test("options.flyTo [true]", async () => {
        setup({
          flyTo: true,
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        const mapFlyMethod = vi.spyOn(map, "flyTo");
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        expect(mapFlyMethod).toHaveBeenCalledTimes(1);
        const calledWithArgs = mapFlyMethod.mock.calls[0][0];
        expect(calledWithArgs.center[0]).toBeCloseTo(-122.4785);
        expect(calledWithArgs.center[1]).toBeCloseTo(37.8191);
        expect(calledWithArgs.zoom).toBe(16);
      });

      test("options.flyTo [object]", async () => {
        setup({
          flyTo: {
            speed: 5,
            zoom: 4,
            center: [0, 0],
          },
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
        const mapFlyMethod = vi.spyOn(map, "flyTo");
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        expect(mapFlyMethod).toHaveBeenCalledTimes(1);
        const calledWithArgs = mapFlyMethod.mock.calls[0][0];
        expect(calledWithArgs.center[0]).toBeCloseTo(-122.4785);
        expect(calledWithArgs.center[1]).toBeCloseTo(37.8191);
        expect(calledWithArgs.zoom).toBe(4);
        expect(calledWithArgs.speed).toBe(5);
      });
               
      test("options.flyTo object on feature with bounding box", async () => {
        setup({
          features: [Features.CANADA],
          flyTo: {
            speed: 5,
          },
        });
        const mapFlyMethod = vi.spyOn(map, "fitBounds");
        const q = geocoder.query("Brazil");
        await geocoder.once("results");
        await q;
        expect(mapFlyMethod).toHaveBeenCalledTimes(2);
        const calledWithArgs = mapFlyMethod.mock.calls[1][1];
        expect(calledWithArgs.speed).toBe(5);
      });
    
      test("options.flyTo object on bounding box excepted feature", async () => {
          setup({
            features: [Features.CANADA],
            flyTo: {
              speed: 5,
            },
          });
          const mapFlyMethod = vi.spyOn(map, "fitBounds");
          const q = geocoder.query("Canada");
          await geocoder.once("results");
          await q;
          expect(mapFlyMethod).toHaveBeenCalledTimes(2);
          const calledWithArgs = mapFlyMethod.mock.calls[1][1];
          expect(calledWithArgs.speed).toBe(5);
        }
      );
    
      test("options.marker [true]", async () => {
        const markerConstructorSpy = createMarkerMock();
        setup({
          features: [Features.GOLDEN_GATE_BRIDGE],
          marker: true,
          maplibregl: { Marker: markerConstructorSpy, LngLatBounds: LngLatBoundsMock }
        });
    
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        expect(markerConstructorSpy).toHaveBeenCalledTimes(2);
        const calledWithOptions = markerConstructorSpy.mock.calls[1][0];
        expect(calledWithOptions.color).toBe("#4668F2");
      });

      test("options.marker  [constructor properties]", async () => {
        const markerConstructorSpy = createMarkerMock();
        setup({
          features: [Features.GOLDEN_GATE_BRIDGE],
          marker: {
            color: "purple",
            draggable: true,
            anchor: "top",
          },
          maplibregl: { Marker: markerConstructorSpy, LngLatBounds: LngLatBoundsMock },
        });
    
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        expect(markerConstructorSpy).toHaveBeenCalledTimes(2);
        const calledWithOptions = markerConstructorSpy.mock.calls[1][0];
        expect(calledWithOptions.color).toBe("purple");
        expect(calledWithOptions.draggable).toBe(true);
        expect(calledWithOptions.anchor).toBe("top");
      });
        
      test("options.marker [false]", async () => {
        const markerConstructorSpy = createMarkerMock();
        setup({
          features: [Features.GOLDEN_GATE_BRIDGE],
          marker: false,
        });
    
        geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        expect(markerConstructorSpy).not.toHaveBeenCalled();
      });
     
      test("options.popup [true]", async () => {
        const popupConstructorSpy = createPopupMock();
        setup({
          marker: true,
          popup: true,
          maplibregl: { Popup: popupConstructorSpy, Marker: createMarkerMock(), LngLatBounds: LngLatBoundsMock },
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        expect(popupConstructorSpy).toHaveBeenCalledTimes(2);
      });
  
      test("options.popup  [constructor properties]", async () => {
        const popupConstructorSpy = createPopupMock();
        setup({
          marker: true,
          popup: {
            closeOnMove: true,
          },
          maplibregl: { Popup: popupConstructorSpy, Marker: createMarkerMock(), LngLatBounds: LngLatBoundsMock },
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        expect(popupConstructorSpy).toHaveBeenCalledTimes(2);
        const calledWithOptions = popupConstructorSpy.mock.calls[1][0];
        expect(calledWithOptions.closeOnMove).toBe(true);
      });
      
      test("options.popup [false]", async () => {
        const popupConstructorSpy = createPopupMock();
        setup({
          popup: false,
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        expect(popupConstructorSpy).not.toHaveBeenCalled();
      });
       
      test("geocode#onRemove", () => {
        setup({ marker: true });
    
        const removeMarkerMethod = vi.spyOn(geocoder, "_removeMarker");
    
        geocoder.onRemove();
    
        expect(removeMarkerMethod).toHaveBeenCalledTimes(1);
        expect(geocoder._map).toBeNull();
      });
      
      test("geocoder#setLanguage", () => {
        setup({ language: "de-DE" });
        expect(geocoder.options.language).toBe("de-DE");
        geocoder.setLanguage("en-US");
        expect(geocoder.options.language).toBe("en-US");
      });
    
      test("geocoder#getLanguage", () => {
        setup({ language: "de-DE" });
        expect(geocoder.getLanguage()).toBe("de-DE");
      });
    
      test("geocoder#getZoom", () => {
        setup({ zoom: 12 });
        expect(geocoder.getZoom()).toBe(12);
      });
    
      test("geocoder#setZoom", () => {
        setup({ zoom: 14 });
        expect(geocoder.options.zoom).toBe(14);
        geocoder.setZoom(17);
        expect(geocoder.options.zoom).toBe(17);
      });
    
      test("geocoder#getFlyTo", () => {
        setup({ flyTo: false });
        expect(geocoder.getFlyTo()).toBe(false);
      });
    
      test("geocoder#setFlyTo", () => {
        setup({ flyTo: false });
        expect(geocoder.options.flyTo).toBe(false);
        geocoder.setFlyTo({ speed: 25 });
        expect(geocoder.options.flyTo).toEqual({ speed: 25 });
      });
    
      test("geocoder#getPlaceholder", () => {
        setup({ placeholder: "Test" });
        expect(geocoder.getPlaceholder()).toBe("Test");
      });
      
      test("geocoder#setPlaceholder", () => {
        setup({ placeholder: "Test" });
        expect(geocoder._inputEl.placeholder).toBe("Test");
        geocoder.setPlaceholder("Search");
        expect(geocoder._inputEl.placeholder).toBe("Search");
      });
    
      test("geocoder#getBbox", () => {
        setup({ bbox: [-1, -1, 1, 1] });
        expect(geocoder.getBbox()).toEqual([-1, -1, 1, 1]);
      });
    
      test("geocoder#setBbox", () => {
        setup({ bbox: [-1, -1, 1, 1] });
        expect(geocoder.options.bbox).toEqual([-1, -1, 1, 1]);
        geocoder.setBbox([-2, -2, 2, 2]);
        expect(geocoder.options.bbox).toEqual([-2, -2, 2, 2]);
      });
    
      test("geocoder#getCountries", () => {
        setup({ countries: "ca,us" });
        expect(geocoder.getCountries()).toBe("ca,us");
      });

      test("geocoder#setCountries", () => {
        setup({ countries: "ca" });
        expect(geocoder.options.countries).toBe("ca");
        geocoder.setCountries("ca,us");
        expect(geocoder.options.countries).toBe("ca,us");
      });
      
      test("geocoder#getTypes", () => {
        setup({ types: "poi" });
        expect(geocoder.getTypes()).toBe("poi");
      });
      
      test("geocoder#setTypes", () => {
        setup({ types: "poi" });
        expect(geocoder.options.types).toBe("poi");
        geocoder.setTypes("place,poi");
        expect(geocoder.options.types).toBe("place,poi");
      });
      
      test("geocoder#getLimit", () => {
        setup({ limit: 4 });
        expect(geocoder.getLimit()).toBe(4);
      });
    
      test("geocoder#setLimit", () => {
        setup({ limit: 1 });
        expect(geocoder.options.limit).toBe(1);
        expect(geocoder._typeahead.options.limit).toBe(1);
        geocoder.setLimit(4);
        expect(geocoder.options.limit).toBe(4);
        expect(geocoder._typeahead.options.limit).toBe(4);
      });
      
      test("geocoder#getFilter", () => {
        setup({
          filter: () => {
            return false;
          },
        });
        const filter = geocoder.getFilter();
        expect(typeof filter).toBe("function");
        expect(["a", "b", "c"].filter(filter)).toEqual([]);
      });
      
      test("geocoder#setFilter", () => {
        setup({
          filter: () => {
            return true;
          },
        });
        const initialFilter = geocoder.getFilter();
        const filtered = ["a", "b", "c"].filter(initialFilter);
        expect(typeof initialFilter).toBe("function");
        expect(filtered).toEqual(["a", "b", "c"]);
        geocoder.setFilter(() => {
          return false;
        });
        const nextFilter = geocoder.options.filter;
        const nextFiltered = ["a", "b", "c"].filter(nextFilter);
        expect(typeof nextFilter).toBe("function");
        expect(nextFiltered).toEqual([]);
      });
      
      test("geocoder#_renderMessage", async () => {
        setup({ features: [Features.GOLDEN_GATE_BRIDGE] });
        const typeaheadRenderErrorSpy = vi.spyOn(geocoder._typeahead, "renderError");
    
        const q = geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        await q;
        // setTimeout
        expect(geocoder._typeahead.data.length).not.toBe(0);
        geocoder._renderMessage("<h1>This is a test</h1>");
        expect(geocoder._typeahead.data.length).toBe(0);
        expect(geocoder._typeahead.selected).toBeNull();
        expect(typeaheadRenderErrorSpy).toHaveBeenCalledTimes(1);
        const calledWithArgs = typeaheadRenderErrorSpy.mock.calls[0][0];
        expect(calledWithArgs).toBe("<h1>This is a test</h1>");
      });
      
      test("geocoder#_renderError", async () => {
        setup({ features: [Features.GOLDEN_GATE_BRIDGE] });
        const renderMessageSpy = vi.spyOn(geocoder, "_renderMessage");
    
        geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        geocoder._renderError();
        expect(renderMessageSpy).toHaveBeenCalledTimes(1);
        const calledWithArgs = renderMessageSpy.mock.calls[0][0] as any;
        expect(calledWithArgs.indexOf("maplibre-gl-geocoder--error") > -1).toBeTruthy();
      });
      
      test("geocoder#_renderNoResults", async () => {
        setup({ features: [Features.GOLDEN_GATE_BRIDGE] });
        const renderMessageSpy = vi.spyOn(geocoder, "_renderMessage");
    
        geocoder.query("Golden Gate Bridge");
        await geocoder.once("results");
        geocoder._renderNoResults();
        expect(renderMessageSpy).toHaveBeenCalledTimes(1);
        const calledWithArgs = renderMessageSpy.mock.calls[0][0] as any;
        expect(calledWithArgs.indexOf("maplibre-gl-geocoder--error") > -1).toBeTruthy();
        expect(calledWithArgs.indexOf("maplibre-gl-geocoder--no-results") > -1).toBeTruthy();
      });

      test("error is shown after an error occurred", async () => {
        setup({ errorMessage: "A mock error message" });
        const renderMessageSpy = vi.spyOn(geocoder, "_renderMessage");
        const q = geocoder.query("12,");
        await geocoder.once("error");
        expect(renderMessageSpy).toHaveBeenCalledTimes(1);
        const calledWithArgs = renderMessageSpy.mock.calls[0][0] as any;
        expect(calledWithArgs.indexOf("maplibre-gl-geocoder--error") > -1).toBeTruthy();
        expect(calledWithArgs.indexOf("There was an error reaching the server") > -1).toBeTruthy();
        await expect(q).rejects.toBe("A mock error message");
      });

      test("error is shown after an error occurred [with local geocoder]", async () => {
          setup({
            errorMessage: "mock error",
            localGeocoder: () => {
              return [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [-122, 37] },
                  properties: {},
                  place_name: "Golden Gate Bridge",
                  text: "Golden Gate Bridge",
                  center: [-122, 37],
                },
              ];
            },
          });
          const renderErrorSpy = vi.spyOn(geocoder, "_renderError");
          const q = geocoder.query("12,");
          await geocoder.once("error");
          expect(renderErrorSpy).not.toHaveBeenCalled();
          await expect(q).rejects.toBe("mock error");
        }
      );

      test("message is shown if no results are returned", async () => {
        setup({});
        const renderMessageSpy = vi.spyOn(geocoder, "_renderNoResults");
        geocoder.query("abcdefghijkl"); //this will return no results
        await geocoder.once("results");
        expect(renderMessageSpy).toHaveBeenCalledTimes(1);
      });
      
    
      test("throws an error if localGeocoderOnly mode is active but no localGeocoder is supplied", () => {
          const opts = {
            localGeocoderOnly: true,
          };
          // no access token here
          const map = new MapMock({});
          geocoder = new MaplibreGeocoder({} as any, opts);
          expect(() => map.addControl(geocoder)).toThrow();
        }
      );
    
      test("geocoder.lastSelected is reset on input", () => {
        setup();
        geocoder.lastSelected = "abc123";
        geocoder._onKeyDown(new KeyboardEvent("KeyDown"));
        expect(geocoder.lastSelected).toBeNull();
      });
    
      test("geocoder#onPaste", () => {
        setup({
          showResultsWhileTyping: true,
        });
        const searchMock = vi.spyOn(geocoder, "_geocode");
        const event = {
            clipboardData: {
                getData: () => "Golden Gate Bridge",
            },
        } as any;
        geocoder._onPaste(event);
        expect(searchMock).toHaveBeenCalledTimes(1);
        const queryArg = searchMock.mock.calls[0][0];
        expect(queryArg).toBe("Golden Gate Bridge");
      });
    
      test("geocoder#onPaste not triggered when text is too short", () => {
        setup({
        minLength: 5,
        });
        const searchMock = vi.spyOn(geocoder, "_geocode");
        const event = {
            clipboardData: {
                getData: () => "abc",
            },
        } as any;
        geocoder._onPaste(event);
        expect(searchMock).not.toHaveBeenCalled();
    });

      test("geocoder#onPaste not triggered when there is no text", () => {
        setup();
        const searchMock = vi.spyOn(geocoder, "_geocode");
        const event = {
            clipboardData: {
                getData: () => "",
            },
        } as any;
        geocoder._onPaste(event);
        expect(searchMock).not.toHaveBeenCalled();
      });
    
      test("query with suggestions", async () => {
        
        setup({
          geocoderApi: createMockGeocoderApiWithSuggestions(
            [Features.QUEEN_STREET],
            [{ text: "starbucks" }]
          ),
          proximity: { longitude: -79.45, latitude: 43.65 },
          features: [Features.QUEEN_STREET],
        });
        
        geocoder.query("Queen Street");
        const e = await geocoder.once("results");
        expect(e.features).not.toBeNull();
        expect(e.suggestions).not.toBeNull();
      });

      
      test("set input with suggestions", async () => {
        setup({
          geocoderApi: createMockGeocoderApiWithSuggestions(
            [Features.QUEEN_STREET],
            [{ text: "starbucks" }]
          ),
          proximity: { longitude: -79.45, latitude: 43.65 },
          features: [Features.QUEEN_STREET],
          showResultsWhileTyping: true,
        });
        geocoder.setInput("anything");
        const e = await geocoder.once("results");
        expect(e.features).toBeDefined();
        expect(e.suggestions).toBeDefined();
      });
    
      test("query with suggestions", async () => {
        setup({
          geocoderApi: createMockGeocoderApiWithSuggestions(
            [Features.QUEEN_STREET],
            [{ text: "starbucks" }]
          ),
          proximity: { longitude: -79.45, latitude: 43.65 },
          features: [Features.QUEEN_STREET],
          showResultsWhileTyping: false,
        });
        geocoder.query("anything");
        const e = await geocoder.once("results");
        expect(e.features).toBeDefined();
        expect(e.suggestions).toBeDefined();
      });
});
