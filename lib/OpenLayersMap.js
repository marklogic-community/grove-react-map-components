"use strict";

exports.__esModule = true;
exports.default = OpenLayersMap;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Map = require("ol/Map");

var _Map2 = _interopRequireDefault(_Map);

var _View = require("ol/View");

var _View2 = _interopRequireDefault(_View);

var _layer = require("ol/layer.js");

var _BingMaps = require("ol/source/BingMaps");

var _BingMaps2 = _interopRequireDefault(_BingMaps);

var _source = require("ol/source");

var _proj = require("ol/proj");

var _coordinate = require("ol/coordinate.js");

var _control = require("ol/control.js");

var _MousePosition = require("ol/control/MousePosition.js");

var _MousePosition2 = _interopRequireDefault(_MousePosition);

var _MapContext = require("./MapContext");

require("ol/ol.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function OpenLayersMap(_ref) {
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

  var context = (0, _react.useContext)(_MapContext.MapContext);
  var mapContainer = (0, _react.useRef)(null);

  var baseLayer = props.bingAPIKey ? new _BingMaps2.default({
    key: props.bingAPIKey,
    imagerySet: props.bingImagerySet || "AerialWithLabels"
  }) : new _source.OSM();

  // create the map when component first mounts
  (0, _react.useEffect)(function () {
    console.log("OpenLayersMap creating new map instance");
    var extend = [];
    if (props.allowFullScreen) {
      extend.push(new _control.FullScreen());
    }
    if (props.showMousePosition) {
      extend.push(new _MousePosition2.default({
        coordinateFormat: (0, _coordinate.createStringXY)(4),
        projection: projection
      }));
    }
    var map = new _Map2.default({
      target: mapContainer.current,
      layers: [new _layer.Tile({
        source: baseLayer
      })],
      view: new _View2.default({
        projection: projection,
        center: (0, _proj.fromLonLat)(center), // does this need to consider projection?
        zoom: zoom,
        maxZoom: props.maxZoom,
        minZoom: props.minZoom
      }),
      controls: (0, _control.defaults)().extend(extend)
    });

    context.setMap(map);
  }, []);

  return _react2.default.createElement("div", { className: cssClass, ref: mapContainer });
}
module.exports = exports["default"];