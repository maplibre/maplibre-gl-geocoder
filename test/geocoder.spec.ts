import MaplibreGeocoder from "../dist/maplibre-gl-geocoder.js";
import once from "lodash.once";
import Features from "./mockFeatures";
import { createMarkerMock, createPopupMock, LngLatBoundsMock, MapMock, init, createMockGeocoderApiWithSuggestions } from "./utils";

describe("geocoder", () => {
  let container: HTMLElement, map: MapMock, geocoder: any;

  function setup(opts?: any) {
    const initResults = init(opts);
    container = initResults.container;
    map = initResults.map;
    geocoder = initResults.geocoder;
  }

    test("initialized", () => {
        setup();
        expect(geocoder).toBeDefined();
    });

    test("set/get input", () => {
        expect.assertions(3);
        setup({
            proximity: { longitude: -79.45, latitude: 43.65 },
            features: [Features.QUEEN_STREET],
        });
        geocoder.query("Queen Street");
        var mapMoveSpy = jest.spyOn(map, "flyTo");
        geocoder.on(
            "result",
            (e) => {
                expect(mapMoveSpy).toHaveBeenCalledTimes(1);
                var mapMoveArgs = mapMoveSpy.mock.calls[0][0];
                expect(mapMoveArgs.center[0]).not.toBe(0);
                expect(mapMoveArgs.center[1]).not.toBe(0);
            }
        );
    });

    test("Selected value is reset after a result is selected", () => {
        expect.assertions(2);
        setup({
            proximity: { longitude: -79.45, latitude: 43.65 },
            features: [Features.QUEEN_STREET],
        });
        geocoder.query("Queen Street");
        geocoder.on(
            "result",
            (e) => {
            expect(geocoder.lastSelected).toBeDefined();
            expect(geocoder._typeahead.selected).toBeNull();
            }
        );
    });

    test("options", (done) => {
        setup({
          flyTo: false,
          country: "fr",
          types: "region",
          features: [Features.PARIS],
        });
    
        geocoder.query("Paris");
    
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features.length).toBe(1);
            expect(geocoder.fresh).toBe(false);
          }
        ));
    
        geocoder.on(
          "result",
          once((e) => {
            var center = map.getCenter();
            expect(center.lng).toBe(0);
            expect(center.lat).toBe(0);
            expect(e.result.place_name).toBe("Paris, France");
            done();
          })
        );
      });

      test("options.bbox", () => {
        expect.assertions(3);
        var bbox = [
          -122.71901248631752, 37.62347223479118, -122.18070124967602,
          37.87996631184369,
        ];
        setup({
          bbox,
          features: [Features.LONDON],
        });
    
        geocoder.query("London");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features.length).toBe(1);
            expect(e.config.bbox).toBe(bbox);
            expect(e.features[0].text).toBe("London, Greater London, England, GBR");
          })
        );
      });

      test("options.reverseGeocode - true", () => {
        expect.assertions(4);
        setup({
          reverseGeocode: true,
          features: [Features.TANZANIA],
        });
        geocoder.query("-6.1933875, 34.5177548");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features.length).toBe(1);
            expect(e.features[0].place_name.indexOf("Tanzania")).toBeGreaterThan(-1);
            expect(e.features[0].place_name.indexOf("Singida")).toBeGreaterThan(-1);
            expect(e.config.limit).toBe(1);
          })
        );
      });

      test("options.reverseGeocode - false by default", () => {
        expect.assertions(2);
        setup();
        geocoder.query("-6.1933875, 34.5177548");
        expect(geocoder.options.reverseGeocode).toBeFalsy();
        geocoder.on(
          "results",
          once((e) =>{
            expect(e.features.length).toBe(0);
          })
        );
      });

      test("options.reverseGeocode: true with trackProximity: true", () => {
        expect.assertions(1);
          setup({
            reverseGeocode: true,
            trackProximity: true,
          });
          map.jumpTo({
            zoom: 16,
            center: [10, 10],
          });
          geocoder.query("-6.1933875, 34.5177548");
            geocoder.on(
                "results",
                once((e) => {
                expect(e.features.length).toBe(0);
                })
            );
        }
      );

      test("parses options correctly", () => {
        expect.assertions(3);
        setup({
          language: "en,es,zh",
          types: "district, locality, neighborhood, postcode",
          countries: "us, mx",
        });
    
        geocoder.query("Hartford");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.config.language).toEqual(["en", "es", "zh"]);
            expect(e.config.types).toEqual(["district", "locality", "neighborhood", "postcode"]);
            expect(e.config.countries).toEqual(["us", "mx"]);
          })
        );
      });

      test("options.limit", () => {
        expect.assertions(1);
        setup({
          flyTo: false,
          limit: 2,
        });
    
        geocoder.query("London");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.config.limit).toBe(2);
          })
        );
      });

      test("options:zoom", () => {
        expect.assertions(1);
        setup({ zoom: 12, features: [Features.BELLINGHAM] });
        geocoder.query("1714 14th St NW");
        var mapMoveSpy = jest.spyOn(map, "flyTo");
        geocoder.on(
          "result",
          once(() => {
            var mapMoveArgs = mapMoveSpy.mock.calls[0][0];
            expect(mapMoveArgs.zoom).toBe(12);
          })
        );
      });

      test("options.localGeocoder", (done) => {
        setup({
          flyTo: false,
          limit: 6,
          localGeocoder: (q) => {
            return [q];
          },
        });
        geocoder.query("-30,150");
        geocoder.on(
            "results",
            once((e) => {
                expect(e.features).toHaveLength(1);
                geocoder.query("London");
                geocoder.on(
                    "results",
                    once((e) => {
                        expect(e.features).toHaveLength(1);
                        geocoder.query("London");
                        geocoder.on(
                            "results",
                            once((e) => {
                                expect(e.features[0]).toBe("London");
                                done();
                            })
                        );
                    })
                );
            })
        );
    });

    test("options.externalGeocoder", (done) => {
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
    
        geocoder.query("Washington, DC");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features.length).toBe(1);
    
            geocoder.query("DC");
            geocoder.on(
              "results",
              once((e) => {
                expect(e.features.length).toBe(1);
    
                geocoder.query("District of Columbia");
                geocoder.on(
                  "results",
                  once((e) => {
                    expect(e.features[0].place_name).toBe(
                      "Promise: Washington, District of Columbia, United States of America",
                    );
                    done();
                  })
                );
              })
            );
          })
        );
      });

      test("country bbox", () => {
        expect.assertions(5);
        setup({ features: [Features.CANADA] });
        geocoder.query("Canada");
        const fitBoundsSpy = jest.spyOn(map, "fitBounds");
        geocoder.on(
          "result",
          once((e) => {
            expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
            var fitBoundsArgs = fitBoundsSpy.mock.calls[0][0];
            // flatten
            var mapBBox = [
              fitBoundsArgs[0][0],
              fitBoundsArgs[0][1],
              fitBoundsArgs[1][0],
              fitBoundsArgs[1][1],
            ];
            for (let i = 0; i <  mapBBox.length; i++) {
                expect(mapBBox[i]).toBeCloseTo(Features.CANADA.bbox[i]);
            }
          })
        );
      });

      test("country bbox exception", () => {
        expect.assertions(5);
        setup({ features: [Features.CANADA] });
        geocoder.query("Canada");
        const fitBoundsSpy = jest.spyOn(map, "fitBounds");
        geocoder.on(
          "result",
          once(() => {
            expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
            var fitBoundsArgs = fitBoundsSpy.mock.calls[0][0];
            // flatten
            var mapBBox = [
              fitBoundsArgs[0][0],
              fitBoundsArgs[0][1],
              fitBoundsArgs[1][0],
              fitBoundsArgs[1][1],
            ];
            var expectedBBoxFlat = [-140.99778, 41.675105, -52.648099, 83.23324];
            for (let i = 0; i <  mapBBox.length; i++) {
                expect(mapBBox[i]).toBeCloseTo(expectedBBoxFlat[i]);
            }
          })
        );
      });

      test("options.filter", () => {
        expect.assertions(2);
        var features = [
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
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features.some(f => f.place_name === "Heathcote, Sydney, New South Wales, AUS")).toBeTruthy();
            expect(e.features.some(f => f.place_name === "Heathcote, Victoria, AUS")).toBeFalsy();
          })
        );
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
        expect.assertions(2);
    
        setup({
          trackProximity: false,
        });
        expect(geocoder.options.trackProximity).toBeFalsy();
        expect(geocoder.getProximity()).toBeUndefined();
      });

      test("options.setProximity", () => {
        expect.assertions(2);
        var features = [];
        setup({ features });
    
        map.setZoom(13);
        map.setCenter([-79.4512, 43.6568]);
        geocoder.setProximity({ longitude: -79.4512, latitude: 43.6568 });
    
        geocoder.query("high");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.config.proximity[0]).toBe(-79.4512);
            expect(e.config.proximity[1]).toBe(43.6568);
          }
        ));
      });

      test("options.render", () => {
        expect.assertions(3);
        setup({
          render: (feature) => {
            return "feature id is " + feature.id;
          },
        });
    
        var fixture = {
          id: "abc123",
          place_name: "San Francisco, California",
        };
    
        expect(geocoder._typeahead.render).toBeDefined();
        expect(typeof geocoder._typeahead.render).toBe("function");
        expect(geocoder._typeahead.render(fixture)).toBe("feature id is abc123");
      });

      test("setRenderFunction with no input", () => {
        expect.assertions(2);
        setup({});
        var result = geocoder.setRenderFunction();
        expect(typeof geocoder._typeahead.render).toBe("function");
        expect(result instanceof MaplibreGeocoder).toBeTruthy();
      });

      test("setRenderFunction with function input", () => {
        expect.assertions(2);
        setup({});
        var result = geocoder.setRenderFunction(function (item) {
          return item.place_name;
        });
        expect(typeof geocoder._typeahead.render).toBe("function");
        expect(result instanceof MaplibreGeocoder).toBeTruthy();
      });

      test("getRenderFunction default", () => {
        expect.assertions(2);
        setup({});
        var result = geocoder.getRenderFunction();
        expect(result).toBeDefined();
        expect(typeof result).toBe("function");
      });

      test("getRenderFunction", () => {
        expect.assertions(2);
        setup({
          render: (item) => {
            return item.place_name;
          },
        });
        var result = geocoder.getRenderFunction();
        expect(result).toBeDefined();
        expect(typeof result).toBe("function");
      });

      test("options.getItemValue", () => {
        setup({
          getItemValue: (feature) => {
            return "feature id is " + feature.id;
          },
        });
    
        var fixture = {
          id: "abc123",
          place_name: "San Francisco, California",
        };
    
        expect(geocoder._typeahead.getItemValue).toBeDefined();
        expect(typeof geocoder._typeahead.getItemValue).toBe("function");
        expect(geocoder._typeahead.getItemValue(fixture)).toBe("feature id is abc123");
      });

      test("options.getItemValue default", () => {
        setup({});
    
        var fixture = {
          id: "abc123",
          place_name: "San Francisco, California",
        };
    
        expect(geocoder._typeahead.getItemValue).toBeDefined();
        expect(typeof geocoder._typeahead.getItemValue).toBe("function");
        expect(geocoder._typeahead.getItemValue(fixture)).toBe("San Francisco, California");
      });

      test("options.flyTo [false]", () => {
        expect.assertions(1);
        setup({
          flyTo: false,
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
        const mapFlyMethod = jest.spyOn(map, "flyTo");
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(mapFlyMethod).not.toHaveBeenCalled();
          })
        );
      });
 
      test("options.flyTo [true]", () => {
        expect.assertions(4);
        setup({
          flyTo: true,
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        const mapFlyMethod = jest.spyOn(map, "flyTo");
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(mapFlyMethod).toHaveBeenCalledTimes(1);
            var calledWithArgs = mapFlyMethod.mock.calls[0][0];
            expect(calledWithArgs.center[0]).toBeCloseTo(-122.4785);
            expect(calledWithArgs.center[1]).toBeCloseTo(37.8191);
            expect(calledWithArgs.zoom).toBe(16);
          })
        );
      });

      test("options.flyTo [object]", () => {
        expect.assertions(5);
        setup({
          flyTo: {
            speed: 5,
            zoom: 4,
            center: [0, 0],
          },
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
        const mapFlyMethod = jest.spyOn(map, "flyTo");
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(mapFlyMethod).toHaveBeenCalledTimes(1);
            var calledWithArgs = mapFlyMethod.mock.calls[0][0];
            expect(calledWithArgs.center[0]).toBeCloseTo(-122.4785);
            expect(calledWithArgs.center[1]).toBeCloseTo(37.8191);
            expect(calledWithArgs.zoom).toBe(4);
            expect(calledWithArgs.speed).toBe(5);
          })
        );
      });
               
      test("options.flyTo object on feature with bounding box", () => {
        expect.assertions(2);
        setup({
          features: [Features.CANADA],
          flyTo: {
            speed: 5,
          },
        });
        const mapFlyMethod = jest.spyOn(map, "fitBounds");
        geocoder.query("Brazil");
        geocoder.on(
          "result",
          once(() => {
            expect(mapFlyMethod).toHaveBeenCalledTimes(1);
            var calledWithArgs = mapFlyMethod.mock.calls[0][1];
            expect(calledWithArgs.speed).toBe(5);
          })
        );
      });
    
      test("options.flyTo object on bounding box excepted feature", () => {
          expect.assertions(2);
          setup({
            features: [Features.CANADA],
            flyTo: {
              speed: 5,
            },
          });
          const mapFlyMethod = jest.spyOn(map, "fitBounds");
          geocoder.query("Canada");
          geocoder.on(
            "result",
            once(() => {
                expect(mapFlyMethod).toHaveBeenCalledTimes(1);
                var calledWithArgs = mapFlyMethod.mock.calls[0][1];
                expect(calledWithArgs.speed).toBe(5);
            })
          );
        }
      );
    
      test("options.marker [true]", () => {
        expect.assertions(2);
        const markerConstructorSpy = createMarkerMock();
        setup({
          features: [Features.GOLDEN_GATE_BRIDGE],
          marker: true,
          maplibregl: { Marker: markerConstructorSpy, LngLatBounds: LngLatBoundsMock }
        });
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(markerConstructorSpy).toHaveBeenCalledTimes(1);
            var calledWithOptions = markerConstructorSpy.mock.calls[0][0];
            expect(calledWithOptions.color).toBe("#4668F2");
          })
        );
      });

      test("options.marker  [constructor properties]", () => {
        expect.assertions(4);
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
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(markerConstructorSpy).toHaveBeenCalledTimes(1);
            var calledWithOptions = markerConstructorSpy.mock.calls[0][0];
            expect(calledWithOptions.color).toBe("purple");
            expect(calledWithOptions.draggable).toBe(true);
            expect(calledWithOptions.anchor).toBe("top");
          })
        );
      });
        
      test("options.marker [false]", () => {
        expect.assertions(1);
        const markerConstructorSpy = createMarkerMock();
        setup({
          features: [Features.GOLDEN_GATE_BRIDGE],
          marker: false,
        });
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(markerConstructorSpy).not.toHaveBeenCalled();
          })
        );
      });
     
      test("options.popup [true]", () => {
        expect.assertions(1);
        const popupConstructorSpy = createPopupMock();
        setup({
          marker: true,
          popup: true,
          maplibregl: { Popup: popupConstructorSpy, Marker: createMarkerMock(), LngLatBounds: LngLatBoundsMock },
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(popupConstructorSpy).toHaveBeenCalledTimes(1);
          })
        );
      });
  
      test("options.popup  [constructor properties]", () => {
        expect.assertions(2);
        const popupConstructorSpy = createPopupMock();
        setup({
          marker: true,
          popup: {
            closeOnMove: true,
          },
          maplibregl: { Popup: popupConstructorSpy, Marker: createMarkerMock(), LngLatBounds: LngLatBoundsMock },
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(popupConstructorSpy).toHaveBeenCalledTimes(1);
            var calledWithOptions = popupConstructorSpy.mock.calls[0][0];
            expect(calledWithOptions.closeOnMove).toBe(true);
          })
        );
      });
      
      test("options.popup [false]", () => {
        expect.assertions(1);
        const popupConstructorSpy = createPopupMock();
        setup({
          popup: false,
          features: [Features.GOLDEN_GATE_BRIDGE],
        });
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            expect(popupConstructorSpy).not.toHaveBeenCalled();
          })
        );
      });
       
      test("geocode#onRemove", () => {
        setup({ marker: true });
    
        const removeMarkerMethod = jest.spyOn(geocoder, "_removeMarker");
    
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
        var filter = geocoder.getFilter();
        expect(typeof filter).toBe("function");
        expect(["a", "b", "c"].filter(filter)).toEqual([]);
      });
      
      test("geocoder#setFilter", () => {
        setup({
          filter: () => {
            return true;
          },
        });
        var initialFilter = geocoder.getFilter();
        var filtered = ["a", "b", "c"].filter(initialFilter);
        expect(typeof initialFilter).toBe("function");
        expect(filtered).toEqual(["a", "b", "c"]);
        geocoder.setFilter(() => {
          return false;
        });
        var nextFilter = geocoder.options.filter;
        var nextFiltered = ["a", "b", "c"].filter(nextFilter);
        expect(typeof nextFilter).toBe("function");
        expect(nextFiltered).toEqual([]);
      });
      
      test("geocoder#_renderMessage", (done) => {
        setup({ features: [Features.GOLDEN_GATE_BRIDGE] });
        const typeaheadRenderErrorSpy = jest.spyOn(geocoder._typeahead, "renderError");
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            setTimeout(() => {
                expect(geocoder._typeahead.data.length).not.toBe(0);
                geocoder._renderMessage("<h1>This is a test</h1>");
                expect(geocoder._typeahead.data.length).toBe(0);
                expect(geocoder._typeahead.selected).toBeNull();
                expect(typeaheadRenderErrorSpy).toHaveBeenCalledTimes(1);
                var calledWithArgs = typeaheadRenderErrorSpy.mock.calls[0][0];
                expect(calledWithArgs).toBe("<h1>This is a test</h1>");
                done();
            }, 0);
          })
        );
      });
      
      test("geocoder#_renderError", () => {
        setup({ features: [Features.GOLDEN_GATE_BRIDGE] });
        const renderMessageSpy = jest.spyOn(geocoder, "_renderMessage");
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            geocoder._renderError();
            expect(renderMessageSpy).toHaveBeenCalledTimes(1);
            var calledWithArgs = renderMessageSpy.mock.calls[0][0] as any;
            expect(calledWithArgs.indexOf("maplibre-gl-geocoder--error") > -1).toBeTruthy();            
          })
        );
      });
      
      test("geocoder#_renderNoResults", () => {
        setup({ features: [Features.GOLDEN_GATE_BRIDGE] });
        const renderMessageSpy = jest.spyOn(geocoder, "_renderMessage");
    
        geocoder.query("Golden Gate Bridge");
        geocoder.on(
          "result",
          once(() => {
            geocoder._renderNoResults();
            expect(renderMessageSpy).toHaveBeenCalledTimes(1);
            var calledWithArgs = renderMessageSpy.mock.calls[0][0] as any;
            expect(calledWithArgs.indexOf("maplibre-gl-geocoder--error") > -1).toBeTruthy();
            expect(calledWithArgs.indexOf("maplibre-gl-geocoder--no-results") > -1).toBeTruthy();
          })
        );
      });
      /* HM TODO: Need to figure out how to test this
      test("error is shown after an error occurred", () => {
        setup({ errorMessage: "A mock error message" });
        const renderMessageSpy = jest.spyOn(geocoder, "_renderMessage");
        geocoder.query("12,");
        geocoder.on(
          "error",
          once(() => {
            expect(renderMessageSpy).toHaveBeenCalledTimes(1);
            var calledWithArgs = renderMessageSpy.mock.calls[0][0] as any;
            expect(calledWithArgs.indexOf("maplibre-gl-geocoder--error") > -1).toBeTruthy();
            expect(calledWithArgs.indexOf("There was an error reaching the server") > -1).toBeTruthy();
          })
        );
      });
      
    
      test(
        "error is shown after an error occurred [with local geocoder]",
        () => {
          setup({
            errorMessage: "mock error",
            localGeocoder: function () {
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
          var renderErrorSpy = sinon.spy(geocoder, "_renderError");
          geocoder.query("12,");
          geocoder.on(
            "error",
            once(() => {
              t.notOk(
                renderErrorSpy.called,
                "the error message is not rendered when the local geocoder returns successfully"
              );
              
            })
          );
        }
      );
      */
    
      test("message is shown if no results are returned", () => {
        setup({});
        const renderMessageSpy = jest.spyOn(geocoder, "_renderNoResults");
        geocoder.query("abcdefghijkl"); //this will return no results
        geocoder.on(
          "results",
          once(() => {
            expect(renderMessageSpy).toHaveBeenCalledTimes(1);
          })
        );
      });
      
    
      test("throws an error if localGeocoderOnly mode is active but no localGeocoder is supplied", () => {
          var opts = {
            localGeocoderOnly: true,
          };
          // no access token here
          container = document.createElement("div");
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
        const searchMock = jest.spyOn(geocoder, "_geocode");
        var event = {
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
        const searchMock = jest.spyOn(geocoder, "_geocode");
        var event = {
            clipboardData: {
                getData: () => "abc",
            },
        } as any;
        geocoder._onPaste(event);
        expect(searchMock).not.toHaveBeenCalled();
    });

      test("geocoder#onPaste not triggered when there is no text", () => {
        setup();
        const searchMock = jest.spyOn(geocoder, "_geocode");
        var event = {
            clipboardData: {
                getData: () => "",
            },
        } as any;
        geocoder._onPaste(event);
        expect(searchMock).not.toHaveBeenCalled();
      });
    
      test("query with suggestions", () => {
        expect.assertions(2);
        
        setup({
          geocoderApi: createMockGeocoderApiWithSuggestions(
            [Features.QUEEN_STREET],
            [{ text: "starbucks" }]
          ),
          proximity: { longitude: -79.45, latitude: 43.65 },
          features: [Features.QUEEN_STREET],
        });
        
        geocoder.query("Queen Street");
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features).not.toBeNull();
            expect(e.suggestions).not.toBeNull();
          })
        );
      });

      
      test("set input with suggestions", () => {
        expect.assertions(2);
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
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features).toBeDefined();
            expect(e.suggestions).toBeDefined();
          })
        );
      });
    
      test("query with suggestions", () => {
        expect.assertions(2);
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
        geocoder.on(
          "results",
          once((e) => {
            expect(e.features).toBeDefined();
            expect(e.suggestions).toBeDefined();
          })
        );
      });
});
