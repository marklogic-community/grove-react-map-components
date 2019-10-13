import React, { useEffect, useContext, useRef } from "react";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Vector as VectorSource, Cluster as ClusterSource } from "ol/source.js";
import { MapContext } from "./MapContext";

function getPointLongLat(point) {
  let geo = point.geometry || point.location;
  const latlng = geo.coordinates || [
    geo.long || geo.longitude || 0,
    geo.lat || geo.latitude || 0
  ];
  return latlng;
}

export default function FeatureLayer(props) {
  const context = useContext(MapContext);
  const styles = useRef({});
  const layer = useRef(null);
  const source = useRef(null);

  useEffect(() => {
    const styleMap = {};
    const config = props.styleMap;
    Object.keys(config).forEach(key => {
      const opts = { ...config[key] };
      if (opts.circle) {
        let { fill, stroke, ...circle } = opts.circle;
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
        let { fill, ...text } = opts.text;
        if (fill) {
          text.fill = new Fill(fill);
        }
        opts.text = new Text(text);
      }
      console.log("creating new style in stylemap", key, opts);
      styleMap[key] = new Style(opts);
    });

    console.log("returning stylemap ", styleMap, config);
    styles.current = styleMap;
  }, [props.styleMap]);

  useEffect(() => {
    if (context.map) {
      console.log(
        "creating new FeatureLayer source for layer name",
        props.layerName
      );
      source.current = new VectorSource();

      let clusterSource;

      if (props.cluster) {
        clusterSource = new ClusterSource({
          ...props.cluster,
          source: source.current
        });
      }

      layer.current = new VectorLayer({
        projection: props.projection || "EPSG:4326",
        source: clusterSource || source.current,
        style: feature => {
          let style;
          if (feature.values_.features) {
            const type = feature.values_.features[0].get("type");
            style = styles.current[type];
            if (style.getText()) {
              style.getText().setText("" + feature.values_.features.length);
            }
          } else {
            const myfeature = feature.values_;
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

      return () => {
        context.map.removeLayer(layer.current);
      };
    }
  }, [context.map]);

  function buildFeatures() {
    console.log(
      "building features for FeatureLayer %s with ",
      props.layerName,
      props.features
    );
    source.current.addFeatures(
      props.features.map(
        point =>
          new Feature({
            featureType: props.featureType || "point",
            type: point.type,
            data: point,
            geometry: new Point(fromLonLat(getPointLongLat(point)))
          })
      )
    );

    if (props.fit) {
      context.map
        .getView()
        .fit(source.current.getExtent(), context.map.getSize());
    }
  }

  useEffect(() => {
    if (source.current && context.map) {
      buildFeatures();

      // clear the features on change
      return () => {
        if (source.current) {
          source.current.clear();
        }
      };
    }
  }, [props.features]);

  useEffect(() => {
    if (layer.current) {
      layer.current.setVisible(!props.hidden);
    }
  }, [props.hidden]);

  return null;
}
