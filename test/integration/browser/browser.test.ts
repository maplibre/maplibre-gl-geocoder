import {
  describe,
  beforeEach,
  beforeAll,
  afterEach,
  afterAll,
  test,
  expect,
} from "vitest";
import puppeteer, { Browser, Page } from "puppeteer";
import http, { Server } from "http";
import st from "st";
import { AddressInfo } from "net";

let server: Server;
let browser: Browser;
let page: Page;

describe("Browser tests", () => {
  beforeAll(async () => {
    server = http.createServer(st(process.cwd()));
    await new Promise<void>((resolve) => server.listen(resolve));

    browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    const port = (server.address() as AddressInfo).port;

    await page.goto(
      `http://localhost:${port}/test/integration/browser/fixtures/land-shadow-dom.html`,
      { waitUntil: "domcontentloaded" },
    );
  });

  afterEach(async () => {
    page.close();
  });

  afterAll(async () => {
    await browser.close();
    if (server) {
      server.close();
    }
  });

  test("Input does not clear when used in a nested shadow DOM", async () => {
    await page.focus("div >>> .maplibregl-ctrl-geocoder--input");
    await page.keyboard.type("england");
    await page.keyboard.press("Enter");

    await page.waitForSelector("div >>> .maplibregl-ctrl-geocoder--result", {
      visible: true,
    });

    const results = await page.$$eval(
      "div >>> .maplibregl-ctrl-geocoder--result-title",
      (elements) => elements.map((el) => el.textContent),
    );

    expect(results).toEqual(["Queen Street", "London"]);
  });
});
