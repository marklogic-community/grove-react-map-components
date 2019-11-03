import expect from "expect";
import React from "react";
import { render } from "react-dom";
import { act } from "react-dom/test-utils";
import { MapProvider, MapContext, LineStringLayer } from "src/";
import { waitFor, MockBaseMap, sleep } from "./test-utils";
import LineString from "ol/geom/LineString";

import { Stroke } from "ol/style.js";

describe("LineStringLayer", () => {
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
          <LineStringLayer />
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
    const testFeatures = [[-8154636, 5194235], [-8153922, 5195404]];
    act(() => {
      render(
        <MapProvider>
          <MockBaseMap />
          <LineStringLayer
            features={null}
            arrowColor={"green"}
            width={15}
            height={12}
            lineColor={"red"}
            arrows={true}
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
          <LineStringLayer
            features={testFeatures}
            arrowColor={"green"}
            width={15}
            height={12}
            lineColor={"red"}
            arrows={true}
          />
          <MapContext.Consumer>{updateContextValue}</MapContext.Consumer>
        </MapProvider>,
        container
      );
    });
    const map = await waitFor(myMapContext, "value.map");
    expect(map.getLayers().getLength()).toEqual(1);
    expect(
      map._layers[0]
        .getSource()
        .getFeatures()[0]
        .getGeometry() instanceof LineString
    ).toEqual(true);
    const layer = map._layers[0];
    const styles = layer.getStyleFunction()(layer.getSource().getFeatures()[0]);
    // check the line color
    expect(styles[0].getStroke().getColor()).toEqual("red");
  });
});
