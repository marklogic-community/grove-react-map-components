import React, { useState } from 'react';

import { MapContext } from './MapContext';

export default function MapProvider(props) {
  var _useState = useState(),
      map = _useState[0],
      setMap = _useState[1];

  var children = props.children;


  return React.createElement(
    MapContext.Provider,
    { value: { map: map, setMap: setMap } },
    children
  );
}