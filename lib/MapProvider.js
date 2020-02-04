'use strict';

exports.__esModule = true;
exports.default = MapProvider;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _MapContext = require('./MapContext');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function MapProvider(props) {
  var _useState = (0, _react.useState)(),
      map = _useState[0],
      setMap = _useState[1];

  var children = props.children;


  return _react2.default.createElement(
    _MapContext.MapContext.Provider,
    { value: { map: map, setMap: setMap } },
    children
  );
}
module.exports = exports['default'];