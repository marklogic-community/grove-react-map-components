"use strict";

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = FeatureLayer;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Feature = require("ol/Feature");

var _Feature2 = _interopRequireDefault(_Feature);

var _geom = require("ol/geom");

var _proj = require("ol/proj");

var _style = require("ol/style.js");

var _layer = require("ol/layer.js");

var _source = require("ol/source.js");

var _MapContext = require("./MapContext");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function getPointLongLat(point) {
  var geo = point.geometry || point.location;
  var latlng = geo.coordinates || [geo.long || geo.longitude || 0, geo.lat || geo.latitude || 0];
  return latlng;
}

function FeatureLayer(props) {
  var context = (0, _react.useContext)(_MapContext.MapContext);
  var styles = (0, _react.useRef)({});
  var layer = (0, _react.useRef)(null);
  var source = (0, _react.useRef)(null);

  (0, _react.useEffect)(function () {
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
          circle.fill = new _style.Fill(fill);
        }
        if (stroke) {
          circle.stroke = new _style.Stroke(stroke);
        }
        opts.image = new _style.Circle(circle);
        console.log("new circle style", opts, config);
      }
      if (opts.text) {
        var _opts$text = opts.text,
            _fill = _opts$text.fill,
            text = _objectWithoutProperties(_opts$text, ["fill"]);

        if (_fill) {
          text.fill = new _style.Fill(_fill);
        }
        opts.text = new _style.Text(text);
      }
      console.log("creating new style in stylemap", key, opts);
      styleMap[key] = new _style.Style(opts);
    });

    console.log("returning stylemap ", styleMap, config);
    styles.current = styleMap;
  }, [props.styleMap]);

  (0, _react.useEffect)(function () {
    if (context.map) {
      console.log("creating new FeatureLayer source for layer name", props.layerName);
      source.current = new _source.Vector();

      var clusterSource = void 0;

      if (props.cluster) {
        clusterSource = new _source.Cluster(_extends({}, props.cluster, {
          source: source.current
        }));
      }

      layer.current = new _layer.Vector({
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
      return new _Feature2.default({
        featureType: props.featureType || "point",
        type: point.type,
        data: point,
        geometry: new _geom.Point((0, _proj.fromLonLat)(getPointLongLat(point)))
      });
    }));

    if (props.fit) {
      context.map.getView().fit(source.current.getExtent(), context.map.getSize());
    }
  }

  (0, _react.useEffect)(function () {
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

  (0, _react.useEffect)(function () {
    if (layer.current) {
      layer.current.setVisible(!props.hidden);
    }
  }, [props.hidden]);

  return null;
}
module.exports = exports["default"];