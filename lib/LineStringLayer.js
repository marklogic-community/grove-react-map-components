"use strict";

exports.__esModule = true;
exports.arrowhead = undefined;

var _templateObject = _taggedTemplateLiteralLoose(["", "", "", ""], ["", "", "", ""]);

exports.default = LineStringLayer;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _MapContext = require("./MapContext");

var _LineString = require("ol/geom/LineString");

var _LineString2 = _interopRequireDefault(_LineString);

var _Feature = require("ol/Feature");

var _Feature2 = _interopRequireDefault(_Feature);

var _proj = require("ol/proj");

var _geom = require("ol/geom");

var _layer = require("ol/layer.js");

var _source = require("ol/source.js");

var _style = require("ol/style.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

var arrowhead = exports.arrowhead = function arrowhead(strings) {
  var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "black";
  var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 450;
  var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 450;

  return "<svg width=\"" + width + "\" height=\"" + height + "\" xmlns=\"http://www.w3.org/2000/svg\">\n <g>\n   <path fill=\"" + color + "\" d=\"m383.14099,226.420068c0,-7.933762 -3.521484,-15.869483 -10.548501,-21.920508l-221.347637,-190.414199c-14.080238,-12.11283 -36.908931,-12.11283 -50.983474,0c-14.074542,12.10793 -14.074542,31.742887 0,43.856697l195.857609,168.47801l-195.843938,168.48487c-14.074542,12.10793 -14.074542,31.745827 0,43.852777c14.074542,12.118711 36.8964,12.118711 50.976638,0l221.348776,-190.411259c7.025878,-6.053965 10.540526,-13.989687 10.540526,-21.926388z\"/>\n </g>\n</svg>";
};

function LineStringLayer(props) {
  var context = (0, _react.useContext)(_MapContext.MapContext);
  var source = (0, _react.useRef)(null);
  var layer = (0, _react.useRef)(null);
  var arrow = (0, _react.useRef)(null);

  function getPointLongLat(point) {
    if (Array.isArray(point)) {
      return point;
    }
    var geo = point.geometry || point.location;
    var latlng = geo.coordinates || [geo.long || geo.longitude || 0, geo.lat || geo.latitude || 0];
    return latlng;
  }
  var buildFeatures = function buildFeatures() {
    console.log("updating polyline features");
    var line_feature = new _Feature2.default({
      geometry: new _LineString2.default(props.features.map(function (feature) {
        return (0, _proj.fromLonLat)(getPointLongLat(feature));
      })),
      featureType: "LineString",
      data: props.features
    });
    source.current.addFeature(line_feature);
  };

  (0, _react.useEffect)(function () {
    var arrow_svg = arrowhead(_templateObject, props.arrowColor, props.width, props.height);
    arrow.current = "data:image/svg+xml," + arrow_svg;
  }, [props.arrowColor, props.width, props.height]);

  (0, _react.useEffect)(function () {
    if (source.current && context.map) {
      source.current.clear();
      buildFeatures();

      return function () {
        console.log("clearing polyline features");
        source.current.clear();
      };
    }
  }, [props.features]);

  (0, _react.useEffect)(function () {
    if (context.map) {
      console.log("creating polyline layer source");
      source.current = new _source.Vector();

      layer.current = new _layer.Vector({
        projection: props.projection || "EPSG:4326",
        source: source.current,
        style: function style(feature) {
          var geometry = feature.getGeometry();
          var styles = [
          // linestring
          new _style.Style({
            stroke: new _style.Stroke({
              color: props.lineColor || "#ffcc33",
              width: props.lineWidth || 2
            })
          })];

          if (props.arrows) {
            geometry.forEachSegment(function (start, end) {
              var dx = end[0] - start[0];
              var dy = end[1] - start[1];
              var rotation = Math.atan2(dy, dx);
              // arrows
              styles.push(new _style.Style({
                geometry: new _geom.Point(end),
                image: new _style.Icon({
                  src: arrow.current,
                  anchor: [0.5, 0.5],
                  rotateWithView: true,
                  rotation: -rotation,
                  scale: 0.04
                })
              }));
            });
          }

          return styles;
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

  (0, _react.useEffect)(function () {
    if (layer.current) {
      layer.current.setVisible(!props.hidden);
    }
  }, [props.hidden]);

  return null;
}