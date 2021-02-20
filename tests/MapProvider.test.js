import expect from "expect";
import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { MapProvider, MapContext, OpenLayersMap } from "src/";
import { sleep } from "./test-utils";

describe("MapProvider", () => {
  let node;

  beforeEach(() => {
    //rewiremock.enable();
    node = document.createElement("div");
  });

  afterEach(() => {
    unmountComponentAtNode(node);
    //rewiremock.disable();
  });

  it("provides the map context", async () => {
    let mapValue = {};
    let updateMapValue = value => {
      mapValue.value = value;
    };
    const comp = render(
      <MapProvider>
        <OpenLayersMap />
        <MapContext.Consumer>{updateMapValue}</MapContext.Consumer>
      </MapProvider>,
      node
    );
    expect(mapValue.value.map).toEqual(undefined);
    await sleep(500);
    expect(mapValue.value.map.getLayers().getLength()).toEqual(1);
  });
});
