import React, { useEffect, useContext, useRef, useState } from "react";
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

export function parseStyleMap(config) {
  const styles = {};
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
    }
    if (opts.text) {
      let { fill, ...text } = opts.text;
      if (fill) {
        text.fill = new Fill(fill);
      }
      opts.text = new Text(text);
    }
    styles[key] = new Style(opts);
  });
  return styles;
}

export function useStyleMap(config, memo) {
  const [styleMap, setStyleMap] = useState({});

  useEffect(() => {
    setStyleMap(parseStyleMap(config));
  }, memo || []);

  return styleMap;
}

export default function FeatureLayer(props) {
  const context = useContext(MapContext);
  const layer = useRef(null);
  const source = useRef(null);

  const styles = useStyleMap(props.styleMap || {});

  useEffect(() => {
    if (context.map) {
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
        source: clusterSource || source.current
      });

      debugger;
      context.map.addLayer(layer.current);

      if (props.features) {
        buildFeatures();
      }

      return () => {
        debugger;
        context.map.removeLayer(layer.current);
      };
    }
  }, [context.map]);

  useEffect(() => {
    if (layer.current) {
      layer.current.setStyle(feature => {
        let style;
        if (feature.values_.features) {
          const type = feature.values_.features[0].get("type");
          style = styles[type];
          if (style.getText()) {
            style.getText().setText("" + feature.values_.features.length);
          }
        } else {
          const myfeature = feature.values_;
          style = styles[myfeature.type];
          if (style.getText()) {
            style.getText().setText(myfeature.data.properties.name);
          }
        }
        return style;
      });
    }
  }, [
    layer.current,
    Object.keys(styles)
      .sort()
      .join()
  ]);

  function buildFeatures() {
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
