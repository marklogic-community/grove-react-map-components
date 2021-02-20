import expect from "expect";
import React from "react";
import { render } from "react-dom";
import { act } from "react-dom/test-utils";
import { MapProvider, MapContext, FeatureLayer } from "src/";
import { parseStyleMap } from "src/FeatureLayer";
import { waitFor, MockBaseMap, sleep } from "./test-utils";

import { Circle, Fill, Style } from "ol/style.js";

const TEST_STYLES = {
  Foo: {
    circle: {
      radius: 6,
      fill: {
        color: "#0A0"
      },
      stroke: {
        color: "#FFF",
        width: 1
      }
    },
    text: {
      textAlign: "center",
      textBaseline: "middle",
      font: "10px Arial",
      fill: { color: "#000" },
      offsetX: 0,
      offsetY: 10,
      rotation: 0
    }
  }
};

describe("FeatureLayer", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it("creates a vector layer on the map context", async () => {
    let myMapContext = {};
    let updateContextValue = value => {
      myMapContext.value = value;
    };
    act(() => {
      render(
        <MapProvider>
          <MockBaseMap />
          <FeatureLayer />
          <MapContext.Consumer>{updateContextValue}</MapContext.Consumer>
        </MapProvider>,
        container
      );
    });
    const map = await waitFor(myMapContext, "value.map");
    expect(map.getLayers().getLength()).toEqual(1);
  });

  it("adds features to the layer", async () => {
    let myMapContext = {};
    let updateContextValue = value => {
      myMapContext.value = value;
    };
    const testFeatures = [
      {
        type: "Foo",
        name: "test1",
        featureType: "FooTest",
        location: {
          coordinates: [0, 0]
        },
        data: { properties: { name: "bar" } },
        get: t => "Foo"
      }
    ];
    act(() => {
      render(
        <MapProvider>
          <MockBaseMap />
          <FeatureLayer
            features={testFeatures}
            cluster={true}
            styleMap={TEST_STYLES}
          />
          <MapContext.Consumer>{updateContextValue}</MapContext.Consumer>
        </MapProvider>,
        container
      );
    });
    await sleep(1000);
    act(() => {
      render(
        <MapProvider>
          <MockBaseMap />
          <FeatureLayer
            features={testFeatures}
            cluster={true}
            styleMap={TEST_STYLES}
          />
          <MapContext.Consumer>{updateContextValue}</MapContext.Consumer>
        </MapProvider>,
        container
      );
    });
    const map = await waitFor(myMapContext, "value.map");
    expect(map.getLayers().getLength()).toEqual(1);
    expect(
      map._layers[0].getStyleFunction()({
        values_: testFeatures[0]
      }) instanceof Style
    ).toBeTruthy();
    expect(
      map._layers[0].getStyleFunction()({
        values_: {
          features: [testFeatures[0]]
        }
      }) instanceof Style
    ).toBeTruthy();
  });

  it("parses a style map", async () => {
    const styles = parseStyleMap(TEST_STYLES);
    expect(styles).toIncludeKey("Foo");
    expect(styles.Foo instanceof Style).toBeTruthy();
    expect(styles.Foo.getImage() instanceof Circle).toBeTruthy();
    expect(styles.Foo.getImage().getRadius()).toEqual(6);
    expect(styles.Foo.getText().getFill() instanceof Fill).toBeTruthy();
    expect(
      styles.Foo.getText()
        .getFill()
        .getColor()
    ).toEqual(TEST_STYLES.Foo.text.fill.color);
  });
});
