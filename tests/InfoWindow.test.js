import expect from "expect";
import React from "react";
import { render } from "react-dom";
import { act } from "react-dom/test-utils";
import { MapProvider, MapContext, InfoWindow } from "src/";
import { waitFor, MockBaseMap, sleep } from "./test-utils";

describe("InfoWindow", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it("creates an overlay layer on the map context", async () => {
    let myMapContext = {};
    let updateContextValue = value => {
      myMapContext.value = value;
    };
    act(() => {
      render(
        <MapProvider>
          <MockBaseMap />
          <InfoWindow />
          <MapContext.Consumer>{updateContextValue}</MapContext.Consumer>
        </MapProvider>,
        container
      );
    });
    const map = await waitFor(myMapContext, "value.map");
    expect(map.getOverlays().getLength()).toEqual(1);
  });

  it("displays info window on selection", async () => {
    let myMapContext = {};
    let updateContextValue = value => {
      myMapContext.value = value;
    };
    act(() => {
      render(
        <MapProvider>
          <MockBaseMap />
          <InfoWindow />
          <MapContext.Consumer>{updateContextValue}</MapContext.Consumer>
        </MapProvider>,
        container
      );
    });
    const map = await waitFor(myMapContext, "value.map");
    expect(map.getOverlays().getLength()).toEqual(1);
    map._interactions[0].dispatchEvent({
      type: "select",
      selected: [
        {
          values_: {
            features: [
              {
                values_: {
                  data: {}
                }
              }
            ]
          },
          getGeometry: () => ({ getCoordinates: () => [1, 2] })
        }
      ]
    });
    expect(map._overlays[0].getPosition()).toEqual([1, 2]);
    map._interactions[0].dispatchEvent({
      type: "select",
      selected: [
        {
          values_: {
            data: [[1, 2], [3, 4]]
          }
        }
      ]
    });
    expect(map._overlays[0].getPosition()).toEqual([
      333958.4723798207,
      445640.1096560266
    ]);
  });
});
