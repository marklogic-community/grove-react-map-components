import React, { useEffect, useContext, useState, useRef } from "react";
import Overlay from "ol/Overlay.js";
import { Select } from "ol/interaction";
import { click, pointerMove } from "ol/events/condition.js";
import { MapContext } from "./MapContext";
import { fromLonLat } from "ol/proj";

export default function InfoWindow({
  interaction = "singleclick",
  autoPan = false,
  ignoreTypes = [],
  renderer = function() {}
}) {
  const context = useContext(MapContext);
  const overlayRef = useRef(null);
  const layer = useRef(null);
  const [features, setFeatures] = useState([]);
  const [selectedFeature, selectFeature] = useState(null);
  const select = useRef(false);

  function showInfoWindow(evt) {
    if (evt.selected.length > 0) {
      let feature = evt.selected[0];
      // we only work on clustered nodes for now
      if (feature.values_.hasOwnProperty("features")) {
        setFeatures(feature.values_.features);
        selectFeature(feature.values_.features[0].values_.data);
        layer.current.setPosition(feature.getGeometry().getCoordinates());
      } else if (Array.isArray(feature.values_.data)) {
        selectFeature(feature.values_.data);
        layer.current.setPosition(
          fromLonLat(feature.values_.data[feature.values_.data.length / 2])
        );
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
  useEffect(() => {
    if (context.map) {
      // setup the interaction
      const config = getConditions();
      config.filter = feature => {
        // use our internal setting of featuretype to ignore
        let featuretype = feature.values_.featureType;
        if (feature.values_.hasOwnProperty("features")) {
          if (feature.values_.features.length === 1) {
            featuretype = feature.values_.features[0].values_.featureType;
          } else {
            featuretype = "cluster";
          }
        }
        const show = !ignoreTypes.includes(featuretype);
        return show;
      };
      select.current = new Select(config);
      context.map.addInteraction(select.current);
      console.log("InfoWindow adding hover interaction");
      select.current.on("select", showInfoWindow);
      return () => {
        select.current.un("select", showInfoWindow);
        context.map.removeInteraction(select.current);
      };
    }
  }, [context.map]);

  // add the rendered component
  useEffect(() => {
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

      return () => {
        console.log("InfoWindow cleaning up overlay layer effect");
        context.map.getOverlays().remove(layer.current);
      };
    }
  }, [context.map]);

  return (
    <div ref={overlayRef}>
      <div className="ol-popup ol-popup-layer grove-info-window">
        {renderer({ feature: selectedFeature, features: features })}
      </div>
    </div>
  );
}
