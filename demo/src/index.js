import React, { useState } from "react";
import { render } from "react-dom";

const capitals_geo = require("../json/us_state_capitals.json");
const trail_geojson = require("../json/path_simple.json");

console.log(trail_geojson.coordinates.length);

import {
  MapProvider,
  OpenLayersMap,
  FeatureLayer,
  LineStringLayer,
  InfoWindow
} from "../../src";

const css = require("./index.css");

const FEATURE_STYLES = {
  Feature: {
    circle: {
      radius: 6,
      fill: {
        color: "#0A0"
      },
      stroke: {
        color: "#FFF",
        width: 1
      }
    },
    text: {
      textAlign: "center",
      textBaseline: "middle",
      font: "10px Arial",
      fill: { color: "#000" },
      offsetX: 0,
      offsetY: 10,
      rotation: 0
    }
  }
};

export default function Demo(props) {
  const [shownComponents, setShownComponents] = useState([]);

  function toggleLayer(name) {
    if (shownComponents.includes(name)) {
      setShownComponents(shownComponents.filter(v => v !== name));
    } else {
      setShownComponents([...shownComponents, name]);
    }
  }

  const Controls = (
    <article id="demo-controls">
      <header>
        <h1>Grove React Map Components</h1>
      </header>
      <section className="demo-components">
        <label>
          <input
            type="checkbox"
            value="feature"
            selected={shownComponents.includes("feature")}
            onChange={e => {
              toggleLayer(e.target.value);
            }}
          />
          FeatureLayer
        </label>
        <label>
          <input
            type="checkbox"
            value="line"
            selected={shownComponents.includes("line")}
            onChange={e => {
              toggleLayer(e.target.value);
            }}
          />
          LineStringLayer
        </label>
        <label>
          <input
            type="checkbox"
            value="info1"
            selected={shownComponents.includes("info1")}
            onChange={e => {
              toggleLayer(e.target.value);
            }}
          />
          InfoWindow (hover)
        </label>
        <label>
          <input
            type="checkbox"
            value="info2"
            selected={shownComponents.includes("info2")}
            onChange={e => {
              toggleLayer(e.target.value);
            }}
          />
          InfoWindow (click)
        </label>
      </section>
    </article>
  );

  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <main style={{ height: "100%", width: "100%", backgroundColor: "#EEE" }}>
        <MapProvider>
          <OpenLayersMap
            zoom="4"
            zoom-max="11"
            zoom-min="4"
            center-={[-118.20891562, 33.88763885]}
            mapId="demo"
            // bingAPIKey="AlFVwO4ygqpj4tu5fW27wU5J389E6bTxikPu_FgtY7fb8O45DBiG1lxwUWTF1Dkc"
          />
          {shownComponents.includes("feature") ? (
            <FeatureLayer
              fit={true}
              layerName="features"
              features={capitals_geo.features}
              styleMap={FEATURE_STYLES}
              projection="EPSG:4326"
              cluster={false}
            />
          ) : null}
          {shownComponents.includes("line") ? (
            <LineStringLayer
              features={trail_geojson.coordinates}
              lineColor="red"
              lineWidth={2}
              projection="EPSG:4326"
            />
          ) : null}
          {shownComponents.includes("info1") ? (
            <InfoWindow
              interaction="hover"
              autoPan={false}
              renderer={renderInfoWindow}
              ignore="LineString"
            />
          ) : null}
          {shownComponents.includes("info2") ? (
            <InfoWindow
              interaction="click"
              autoPan={250}
              renderer={renderInfoWindow}
              ignore="LineString"
            />
          ) : null}
        </MapProvider>
        {Controls}
      </main>
    </React.Fragment>
  );
}

render(<Demo />, document.querySelector("#demo"));

function renderInfoWindow({ feature, features }) {
  console.log("renderInfoWindow", feature, features);
  if (!feature) return <React.Fragment></React.Fragment>;

  console.log("infowindow render feature", feature);

  if (features && features.length > 1) {
    return (
      <article className="info-cluster">
        <header>{features.length} Features</header>
        <section className="content">
          {features.map(f => f.name || f.title || "").join(", ")}
        </section>
      </article>
    );
  }

  const type = Array.isArray(feature)
    ? "lineString"
    : feature.type || "feature";
  const title =
    type === "lineString"
      ? "Line String"
      : (feature.properties && feature.properties.state) ||
        feature.title ||
        "Feature Title";
  const desc =
    type === "lineString"
      ? "Example Eastern Trail path"
      : feature.desc ||
        (feature.properties && feature.properties.name) ||
        "Feature Description";
  return (
    <article className="info-details">
      <header>{title}</header>
      <section className="content">{desc}</section>
    </article>
  );
}
