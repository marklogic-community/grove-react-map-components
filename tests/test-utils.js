import { MapContext } from "src/";
import React, { useContext, useEffect } from "react";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function fromPath(obj, path) {
  return path
    .split(".")
    .reduce((acc, val) => (acc ? acc[val] : undefined), obj);
}

export function waitFor(obj, path, maxMS) {
  return new Promise(async (resolve, reject) => {
    const check = ms => {
      const val = fromPath(obj, path);
      if (!!val) {
        resolve(val);
      } else if (ms > 100) {
        setTimeout(check(ms - 100), 100);
      } else {
        reject("timedout waiting for " + path);
      }
    };
    check(maxMS || 6000);
  });
}

export function MockBaseMap(props) {
  const context = useContext(MapContext);

  useEffect(() => {
    const map = {
      _overlays: [],
      addOverlay: l => {
        map._overlays.push(l);
      },
      removeOverlay: l => (map._overlays = map._overlays.filter(c => c !== l)),
      getOverlays: () => ({
        getLength: () => map._overlays.length,
        removeOverlay: l => map.removeOverlay(l)
      }),
      _interactions: [],
      addInteraction: l => {
        map._interactions.push(l);
      },
      removeInteractions: l =>
        (map._interactions = map._interactions.filter(c => c !== l)),
      _layers: [],
      addLayer: l => {
        map._layers.push(l);
      },
      removeLayer: l => (map._layers = map._layers.filter(c => c !== l)),
      getLayers: () => ({
        getLength: () => map._layers.length
      }),
      getView: () => ({
        fit: () => {}
      }),
      getSize: () => {}
    };
    context.setMap(map);
  }, []);

  return <React.Fragment></React.Fragment>;
}
