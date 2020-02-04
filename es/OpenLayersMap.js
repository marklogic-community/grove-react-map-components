function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

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

export default function OpenLayersMap(_ref) {
  var _ref$projection = _ref.projection,
      projection = _ref$projection === undefined ? "EPSG:3857" : _ref$projection,
      _ref$center = _ref.center,
      center = _ref$center === undefined ? [-95.79, 34.48] : _ref$center,
      _ref$zoom = _ref.zoom,
      zoom = _ref$zoom === undefined ? 4 : _ref$zoom,
      _ref$minZoom = _ref.minZoom,
      minZoom = _ref$minZoom === undefined ? 0 : _ref$minZoom,
      _ref$maxZoom = _ref.maxZoom,
      maxZoom = _ref$maxZoom === undefined ? 28 : _ref$maxZoom,
      _ref$cssClass = _ref.cssClass,
      cssClass = _ref$cssClass === undefined ? "olmap" : _ref$cssClass,
      props = _objectWithoutProperties(_ref, ["projection", "center", "zoom", "minZoom", "maxZoom", "cssClass"]);

  var context = useContext(MapContext);
  var mapContainer = useRef(null);

  var baseLayer = props.bingAPIKey ? new BingMaps({
    key: props.bingAPIKey,
    imagerySet: props.bingImagerySet || "AerialWithLabels"
  }) : new OSM();

  // create the map when component first mounts
  useEffect(function () {
    console.log("OpenLayersMap creating new map instance");
    var extend = [];
    if (props.allowFullScreen) {
      extend.push(new FullScreen());
    }
    if (props.showMousePosition) {
      extend.push(new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: projection
      }));
    }
    var map = new Map({
      target: mapContainer.current,
      layers: [new TileLayer({
        source: baseLayer
      })],
      view: new View({
        projection: projection,
        center: fromLonLat(center), // does this need to consider projection?
        zoom: zoom,
        maxZoom: props.maxZoom,
        minZoom: props.minZoom
      }),
      controls: defaultControls().extend(extend)
    });

    context.setMap(map);
  }, []);

  return React.createElement("div", { className: cssClass, ref: mapContainer });
}