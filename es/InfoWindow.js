import React, { useEffect, useContext, useState, useRef } from "react";
import Overlay from "ol/Overlay.js";
import { Select } from "ol/interaction";
import { click, pointerMove } from "ol/events/condition.js";
import { MapContext } from "./MapContext";
import { fromLonLat } from "ol/proj";

export default function InfoWindow(_ref) {
  var _ref$interaction = _ref.interaction,
      interaction = _ref$interaction === undefined ? "singleclick" : _ref$interaction,
      _ref$autoPan = _ref.autoPan,
      autoPan = _ref$autoPan === undefined ? false : _ref$autoPan,
      _ref$ignoreTypes = _ref.ignoreTypes,
      ignoreTypes = _ref$ignoreTypes === undefined ? [] : _ref$ignoreTypes,
      _ref$renderer = _ref.renderer,
      renderer = _ref$renderer === undefined ? function () {} : _ref$renderer;

  var context = useContext(MapContext);
  var overlayRef = useRef(null);
  var layer = useRef(null);

  var _useState = useState([]),
      features = _useState[0],
      setFeatures = _useState[1];

  var _useState2 = useState(null),
      selectedFeature = _useState2[0],
      selectFeature = _useState2[1];

  var select = useRef(false);

  function showInfoWindow(evt) {
    if (evt.selected.length > 0) {
      var feature = evt.selected[0];
      // we only work on clustered nodes for now
      if (feature.values_.hasOwnProperty("features")) {
        setFeatures(feature.values_.features);
        selectFeature(feature.values_.features[0].values_.data);
        layer.current.setPosition(feature.getGeometry().getCoordinates());
      } else if (Array.isArray(feature.values_.data)) {
        selectFeature(feature.values_.data);
        layer.current.setPosition(fromLonLat(feature.values_.data[feature.values_.data.length / 2]));
      } else {
        selectFeature(feature.values_.data);
        layer.current.setPosition(feature.getGeometry().getCoordinates());
      }
    } else {
      layer.current.setPosition(undefined);
      select.current.getFeatures().clear();
    }
  }

  function getConditions() {
    switch (interaction) {
      case "hover":
        return { condition: pointerMove };
      case "click":
        return { condition: click };
      default:
        return null;
    }
  }

  // setup the interaction only once, whenever the map changes
  useEffect(function () {
    if (context.map) {
      // setup the interaction
      var config = getConditions();
      config.filter = function (feature) {
        // use our internal setting of featuretype to ignore
        var featuretype = feature.values_.featureType;
        if (feature.values_.hasOwnProperty("features")) {
          if (feature.values_.features.length === 1) {
            featuretype = feature.values_.features[0].values_.featureType;
          } else {
            featuretype = "cluster";
          }
        }
        var show = !ignoreTypes.includes(featuretype);
        return show;
      };
      select.current = new Select(config);
      context.map.addInteraction(select.current);
      console.log("InfoWindow adding hover interaction");
      select.current.on("select", showInfoWindow);
      return function () {
        select.current.un("select", showInfoWindow);
        context.map.removeInteraction(select.current);
      };
    }
  }, [context.map]);

  // add the rendered component
  useEffect(function () {
    if (context.map) {
      console.log("overlayRefs.current", overlayRef.current);
      layer.current = new Overlay({
        element: overlayRef.current.querySelector(".grove-info-window"),
        autoPan: !!autoPan,
        autoPanAnimation: {
          duration: autoPan
        }
      });

      console.log("InfoWindow adding overlay layer");
      context.map.addOverlay(layer.current);

      return function () {
        console.log("InfoWindow cleaning up overlay layer effect");
        context.map.getOverlays().remove(layer.current);
      };
    }
  }, [context.map]);

  return React.createElement(
    "div",
    { ref: overlayRef },
    React.createElement(
      "div",
      { className: "ol-popup ol-popup-layer grove-info-window" },
      renderer({ feature: selectedFeature, features: features })
    )
  );
}