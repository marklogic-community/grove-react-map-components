import expect from "expect";
import React from "react";
import DefaultMapContext, { MapContext } from "../src/MapContext";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("MapContext", () => {
  it("exports a react context", async () => {
    expect(MapContext).toEqual(DefaultMapContext);
  });
});
