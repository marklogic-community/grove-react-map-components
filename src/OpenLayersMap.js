import React, { useContext, useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer } from "ol/layer.js";
import BingMaps from "ol/source/BingMaps";
import { OSM } from "ol/source";
import { fromLonLat } from "ol/proj";
import { createStringXY } from "ol/coordinate.js";
import { defaults as defaultControls, FullScreen } from "ol/control.js";
import MousePosition from "ol/control/MousePosition.js";
import { MapContext } from "./MapContext";
import "ol/ol.css";

export default function OpenLayersMap({
  projection = "EPSG:3857",
  center = [-95.79, 34.48],
  zoom = 4,
  cssClass = "olmap",
  ...props
}) {
  const context = useContext(MapContext);
  const mapContainer = useRef(null);

  const baseLayer = props.bingAPIKey
    ? new BingMaps({
        key: props.bingAPIKey,
        imagerySet: props.bingImagerySet || "AerialWithLabels"
      })
    : new OSM();

  // create the map when component first mounts
  useEffect(() => {
    console.log("OpenLayersMap creating new map instance");
    const map = new Map({
      target: mapContainer.current,
      layers: [
        new TileLayer({
          source: baseLayer
        })
      ],
      view: new View({
        projection: projection,
        center: fromLonLat(center), // does this need to consider projection?
        zoom: zoom
      }),
      controls: defaultControls().extend([
        new FullScreen(),
        new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: projection
        })
      ])
    });

    context.setMap(map);
  }, []);

  return <div className={cssClass} ref={mapContainer} />;
}
