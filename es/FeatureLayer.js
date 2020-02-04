var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

import React, { useEffect, useContext, useRef } from "react";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Vector as VectorSource, Cluster as ClusterSource } from "ol/source.js";
import { MapContext } from "./MapContext";

function getPointLongLat(point) {
  var geo = point.geometry || point.location;
  var latlng = geo.coordinates || [geo.long || geo.longitude || 0, geo.lat || geo.latitude || 0];
  return latlng;
}

export default function FeatureLayer(props) {
  var context = useContext(MapContext);
  var styles = useRef({});
  var layer = useRef(null);
  var source = useRef(null);

  useEffect(function () {
    var styleMap = {};
    var config = props.styleMap;
    Object.keys(config).forEach(function (key) {
      var opts = _extends({}, config[key]);
      if (opts.circle) {
        var _opts$circle = opts.circle,
            fill = _opts$circle.fill,
            stroke = _opts$circle.stroke,
            circle = _objectWithoutProperties(_opts$circle, ["fill", "stroke"]);
        // TODO: might be able to genericize this


        if (fill) {
          circle.fill = new Fill(fill);
        }
        if (stroke) {
          circle.stroke = new Stroke(stroke);
        }
        opts.image = new CircleStyle(circle);
        console.log("new circle style", opts, config);
      }
      if (opts.text) {
        var _opts$text = opts.text,
            _fill = _opts$text.fill,
            text = _objectWithoutProperties(_opts$text, ["fill"]);

        if (_fill) {
          text.fill = new Fill(_fill);
        }
        opts.text = new Text(text);
      }
      console.log("creating new style in stylemap", key, opts);
      styleMap[key] = new Style(opts);
    });

    console.log("returning stylemap ", styleMap, config);
    styles.current = styleMap;
  }, [props.styleMap]);

  useEffect(function () {
    if (context.map) {
      console.log("creating new FeatureLayer source for layer name", props.layerName);
      source.current = new VectorSource();

      var clusterSource = void 0;

      if (props.cluster) {
        clusterSource = new ClusterSource(_extends({}, props.cluster, {
          source: source.current
        }));
      }

      layer.current = new VectorLayer({
        projection: props.projection || "EPSG:4326",
        source: clusterSource || source.current,
        style: function style(feature) {
          var style = void 0;
          if (feature.values_.features) {
            var type = feature.values_.features[0].get("type");
            style = styles.current[type];
            if (style.getText()) {
              style.getText().setText("" + feature.values_.features.length);
            }
          } else {
            var myfeature = feature.values_;
            style = styles.current[myfeature.type];
            if (style.getText()) {
              style.getText().setText(myfeature.data.properties.name);
            }
          }
          return style;
        }
      });

      context.map.addLayer(layer.current);

      if (props.features) {
        buildFeatures();
      }

      return function () {
        context.map.removeLayer(layer.current);
      };
    }
  }, [context.map]);

  function buildFeatures() {
    console.log("building features for FeatureLayer %s with ", props.layerName, props.features);
    source.current.addFeatures(props.features.map(function (point) {
      return new Feature({
        featureType: props.featureType || "point",
        type: point.type,
        data: point,
        geometry: new Point(fromLonLat(getPointLongLat(point)))
      });
    }));

    if (props.fit) {
      context.map.getView().fit(source.current.getExtent(), context.map.getSize());
    }
  }

  useEffect(function () {
    if (source.current && context.map) {
      buildFeatures();

      // clear the features on change
      return function () {
        if (source.current) {
          source.current.clear();
        }
      };
    }
  }, [props.features]);

  useEffect(function () {
    if (layer.current) {
      layer.current.setVisible(!props.hidden);
    }
  }, [props.hidden]);

  return null;
}