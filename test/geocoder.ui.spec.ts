import Features from "./mockFeatures";
import { init, initHtmlElement, initNoMap, mockGeocoderApi } from "./utils";
import once from "lodash.once";

describe("Geocoder#inputControl", () => {
    let container, map, geocoder;  
    const clickEvent = new Event('click', {bubbles: true, cancelable: false});
  
    function setup(opts?: any) {
        const initResults = init(opts);
        container = initResults.container;
        map = initResults.map;
        geocoder = initResults.geocoder;
    }

    function setupNoMap(opts?: any) {
        const initResults = initNoMap(opts);
        container = initResults.container;
        geocoder = initResults.geocoder;
    }
  
    test("input", (done) => {
      setup({
        types: "place",
        features: [Features.GOLDEN_GATE_BRIDGE],
      });
      const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
      const clearEl = container.querySelector(".maplibregl-ctrl-geocoder button");
  
      geocoder.on(
        "loading",
        once((e) => {
            expect(e.query).toBe("-122.47846999999996, 37.81914000000006");
        })
      );
  
      geocoder.on(
        "result",
        once(() => {
            expect(inputEl.value).toBeTruthy();
            expect(geocoder.mapMarker).toBeTruthy();
            clearEl.dispatchEvent(clickEvent);
        })
      );
  
      geocoder.on(
        "clear",
        once(() => {
          setTimeout(() => {
            expect(geocoder.fresh).toBeTruthy();
            expect(geocoder.mapMarker).toBeNull();
            geocoder.setInput("Paris");
            expect(inputEl.value).toBe("Paris");
            geocoder.setInput("90,45");
            expect(inputEl.value).toBe("90,45");
            done();
          }, 0);
        })
      );
  
      geocoder.query("-122.47846999999996, 37.81914000000006");
    });
  
    test("placeholder", () => {
      setup({ placeholder: "foo to the bar" });
      expect(
        container.querySelector(".maplibregl-ctrl-geocoder input").placeholder
      ).toBe("foo to the bar");
    });

    
    test("get language when a language obtained from the browser", () => {
        setup({});
        expect(geocoder.options.language).toBeDefined();
        expect(typeof geocoder.options.language).toBe("string");
        expect(geocoder.options.language).toBe(navigator.language);
      }
    );

    test("placeholder language localization", () => {
      setup({ language: "de-DE" });
      expect(map.getContainer().querySelector(".maplibregl-ctrl-geocoder input").placeholder).toBe("Suche");
    });
    
    test("placeholder language localization with more than one language specified",() => {
        setup({ language: "de-DE,lv" });
        expect(map.getContainer().querySelector(".maplibregl-ctrl-geocoder input").placeholder).toBe("Suche");
      }
    );
  
    test("clear is not called on keydown (tab), no focus trap", () => {
        setup({});
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        const focusSpy = jest.spyOn(inputEl, "focus");
        inputEl.focus();
        expect(focusSpy).toHaveBeenCalled();
        const keySpy = jest.spyOn(geocoder, "_onKeyDown");
        const clearSpy = jest.spyOn(geocoder, "clear");
        geocoder._onKeyDown(new KeyboardEvent("keydown", { code: "9", keyCode: 9 }));
        expect(keySpy).toHaveBeenCalled();
        expect(clearSpy).not.toHaveBeenCalled();
    });
  
    test("clear is called on keydown (not tab)", () => {
        setup({});
  
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        const focusSpy = jest.spyOn(inputEl, "focus");
        inputEl.focus();
        expect(focusSpy).toHaveBeenCalled();
        const keySpy = jest.spyOn(geocoder, "_onKeyDown");
        const clearSpy = jest.spyOn(geocoder, "clear");
        geocoder._onKeyDown(new KeyboardEvent("keydown", { code: "1", keyCode: 1 }));
        expect(keySpy).toHaveBeenCalled();
        expect(clearSpy).toHaveBeenCalled();
    });
  
    test("options.clearAndBlurOnEsc=true clears and blurs on escape", () => {
        setup({
          clearAndBlurOnEsc: true,
        });
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        const focusSpy = jest.spyOn(inputEl, "focus");
        const blurSpy = jest.spyOn(inputEl, "blur");
  
        inputEl.focus();
        expect(focusSpy).toHaveBeenCalled();
  
        geocoder.setInput("testval");
        expect(inputEl.value).toBe("testval");
  
        geocoder._onKeyDown(
          new KeyboardEvent("keydown", { code: "1", keyCode: 27 })
        );
  
        expect(inputEl.value).toBe("");
        expect(blurSpy).toHaveBeenCalled();
      }
    );
  
    test("options.clearAndBlurOnEsc=false does not clear and blur on escape", () => {
        setup({
          clearAndBlurOnEsc: false,
        });
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        const focusSpy = jest.spyOn(inputEl, "focus");
        const blurSpy = jest.spyOn(inputEl, "blur");
  
        inputEl.focus();
        expect(focusSpy).toHaveBeenCalled();
  
        geocoder._onKeyDown(
          new KeyboardEvent("keydown", { code: "1", keyCode: 27 })
        );
        expect(blurSpy).not.toHaveBeenCalled();
      }
    );

    test("options.collapsed=true", () => {
        setup({
            collapsed: true,
        });
        const wrapper = container.querySelector(".maplibregl-ctrl-geocoder");
        expect(wrapper.classList.contains("maplibregl-ctrl-geocoder--collapsed")).toBeTruthy();
    });
    
    test("options.collapsed=true, focus", () => {
        setup({
            collapsed: true,
        });
        const wrapper = container.querySelector(".maplibregl-ctrl-geocoder");
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        // focus input, remove maplibregl-ctrl-geocoder--collapsed
        const focusEvent = new Event("focus", { bubbles: true, cancelable: false });
        inputEl.dispatchEvent(focusEvent);
        expect(wrapper.classList.contains("maplibregl-ctrl-geocoder--collapsed")).toBeFalsy();
    });
  
    // This test is imperfect, because I cannot get smokestack to call the blur
    // listener no matter what I do. As a workaround, I'm:
    // 1. Testing that the option was set correctly.
    // 2. directly calling _clearOnBlur and asserting that it behaves as expected.
    test("options.clearOnBlur=true", () => {
        setup({
            clearOnBlur: true,
        });
        expect(geocoder.options.clearOnBlur).toBeTruthy();
  
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        const focusSpy = jest.spyOn(inputEl, "focus");
  
        geocoder.setInput("testval");
        expect(inputEl.value).toBe("testval");
  
        inputEl.focus();
  
        // Call _clearOnBlur(), without a relatedTarget;
        geocoder._clearOnBlur({
            relatedTarget: null,
            preventDefault: () => {
                return null;
            },
        });
  
        expect(inputEl.value).toBe("testval");
    
        // Directly call _clearOnBlur(), with a relatedTarget;
        geocoder._clearOnBlur({
            relatedTarget: document.body,
            preventDefault: () => {
                return null;
            },
        });
  
        expect(focusSpy).toHaveBeenCalled();
        expect(inputEl.value).toBe("");
    });
  
    test("options.clearOnBlur=false by default", () => {
        setup();
        expect(geocoder.options.clearOnBlur).toBeFalsy();
    });
  
    test("clear button shows up", () => {
        setup({
            clearOnBlur: true,
        });
    
        geocoder.setInput("testval");
    
        const wrapper = container.querySelector(".maplibregl-ctrl-geocoder");
        const hoverEvent = new Event("mouseenter", { bubbles: true, cancelable: true });
        wrapper.dispatchEvent(hoverEvent);
        const clearbutton = container.querySelector(
            ".maplibregl-ctrl-geocoder--button"
        );
        expect(clearbutton.style.display).toBe("block");
  
    });
  
    test("options.collapsed=true, hover", () => {
        setup({
            collapsed: true,
        });
        const wrapper = container.querySelector(".maplibregl-ctrl-geocoder");
        // hover input, remove maplibregl-ctrl-geocoder--collapsed
        const hoverEvent = new Event("mouseenter", { bubbles: true, cancelable: true });
        wrapper.dispatchEvent(hoverEvent);
        expect(wrapper.classList.contains("maplibregl-ctrl-geocoder--collapsed")).toBeFalsy();
    });
  
    test("options.collapsed=false", () => {
        setup({
            collapsed: false,
        });
        const wrapper = container.querySelector(".maplibregl-ctrl-geocoder");
        expect(wrapper.classList.contains("maplibregl-ctrl-geocoder--collapsed")).toBeFalsy();
    });
  
    test(
      "options.showResultsWhileTyping=false, enter key press",
      () => {
        setup({
          features: [Features.QUEEN_STREET],
          collapsed: true,
          showResultsWhileTyping: false,
        });
  
        const wrapper = container.querySelector(".maplibregl-ctrl-geocoder input");
        const searchMock = jest.spyOn(geocoder, "_geocode");
        const mapFitBoundsMock = jest.spyOn(map, "fitBounds");
  
        geocoder.setInput("Paris");
        expect(searchMock).not.toHaveBeenCalled();
  
        wrapper.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 13 }));
        geocoder.on(
          "results",
          once(() => {
            const boundsArray = mapFitBoundsMock.mock.calls[0][0];
            expect(mapFitBoundsMock).toHaveBeenCalled();
            expect(boundsArray[0].length).toBe(2);
            expect(boundsArray[1].length).toBe(2);
          })
        );
      }
    );
  
    test("options.showResultsWhileTyping=true, geocodes when setting input", () => {
        setup({
          collapsed: true,
          showResultsWhileTyping: true,
        });
  
        const searchMock = jest.spyOn(geocoder, "_geocode");
  
        geocoder.setInput("Paris");
        expect(searchMock).toHaveBeenCalled();
      }
    );
  
    test("createIcon", () => {
      setup({});
      const icon = geocoder.createIcon("search", "<path/>");
      expect(icon.outerHTML).toBe(
        '<svg class="maplibregl-ctrl-geocoder--icon maplibregl-ctrl-geocoder--icon-search" viewBox="0 0 18 18" xml:space="preserve" width="18" height="18"><path></path></svg>'
      );
    });
  
    test("event deduplication", (done) => {
      setup({
        features: [Features.GOLDEN_GATE_BRIDGE],
        types: "place",
      });
      const clearEl = container.querySelector(".maplibregl-ctrl-geocoder button");
  
      let checkVal = null;
  
      geocoder.on("result", once(() => {
        expect(typeof geocoder.lastSelected).toBe("string");
        expect(geocoder.lastSelected).not.toBe(checkVal);
        checkVal = geocoder.lastSelected;
        clearEl.dispatchEvent(clickEvent);
        done();
      }));
      geocoder.query("Golden Gate Bridge");
  
      const newMock = mockGeocoderApi([Features.CANADA]);
      geocoder.setGeocoderApi(newMock);
      geocoder.query("Canada");
    });
  
    test("event deduplication even when IDs are shared", (done) => {
      setup({
        types: "place",
        features: [Features.GOLDEN_GATE_BRIDGE],
      });
      const clearEl = container.querySelector(".maplibregl-ctrl-geocoder button");
  
      const lastID = "test.abc123";
  
      geocoder.on("result", once(() => {
        const selected = JSON.parse(geocoder.lastSelected);
        selected.id = lastID;
        clearEl.dispatchEvent(clickEvent);
        done();
      }));
      geocoder.query("Golden Gate Bridge");
      geocoder.query("usa");
    });
  
    test("paste event", (done) => {
        setup({
            showResultsWhileTyping: true,
        });
        const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as any;
        pasteEvent.clipboardData = {
          getData () { return 'Golden Gate Bridge' }
        }
        const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
        inputEl.dispatchEvent(pasteEvent);
    
        geocoder.on("results",
            once(() => {
                done();
            })
        );
    });

    test("result was added to container", () => {
        setupNoMap();
        const geocoderRef = document.getElementsByClassName(
            "maplibregl-ctrl-geocoder"
        );
        expect(Object.keys(geocoderRef).length).toBeDefined()
        const containerChildRef = container.getElementsByClassName(
            "maplibregl-ctrl-geocoder"
        );
        expect(Object.keys(containerChildRef).length).toBeDefined();
        container.remove();
    });
 
    test("input works without a map", (done) => {
      setupNoMap({
        types: "place",
        features: [Features.GOLDEN_GATE_BRIDGE],
      });
      const inputEl = container.querySelector(".maplibregl-ctrl-geocoder input");
      const clearEl = container.querySelector(".maplibregl-ctrl-geocoder button");
  
      geocoder.on(
        "loading",
        once((e) => {
            expect(e.query).toBe("-122.47846999999996 37.81914000000006");
        })
      );
  
      geocoder.on(
        "result",
        once(() => {
            expect(inputEl.value).toBeDefined()
            clearEl.dispatchEvent(clickEvent);
        })
      );
  
      geocoder.on(
        "clear",
        once(() => {
          setTimeout(() => {
            expect(geocoder.fresh).toBeTruthy();
            geocoder.setInput("Paris");
            expect(inputEl.value).toBe("Paris")
            geocoder.setInput("90,45");
            expect(inputEl.value).toBe("90,45");
            done();
            container.remove();
          });
        })
      );
  
      geocoder.query("-122.47846999999996 37.81914000000006");
    });
  
  
    test("add to an existing HTMLElement", () => {
        initHtmlElement()
        expect(Object.keys(
            container.getElementsByClassName("maplibregl-ctrl-geocoder--input")
        ).length).toBeGreaterThan(0);
    });
  });
  