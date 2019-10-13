/* mapUtils.js
 *
 * This file includes utility functions for working with a map.
 */

import { fromLonLat } from 'ol/proj';

const mapUtils = {
  convertFacetsToGeoJson: function(facets, facetName) {
    let geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    if (
      facets &&
      facets[facetName] &&
      facets[facetName].boxes &&
      facets[facetName].boxes.length > 0
    ) {
      facets[facetName].boxes.forEach(function(value, index) {
        if (value.count > 0) {
          let lng = (value.w + value.e) / 2;
          let lat = (value.s + value.n) / 2;
          let ptConverted = fromLonLat([lng, lat]);
          geoJson.features.push({
            type: 'Feature',
            id: value.id || 'feature' + index,
            geometry: {
              type: 'Point',
              coordinates: ptConverted
            },
            properties: {
              label: value.label || '',
              id: value.id || 'feature' + index,
              layer: 'primary',
              count: value.count,
              uri: value.uri
            }
          });
        }
      });
    }

    return geoJson;
  },

  convertPropsToGeoJson: function(props) {
    let geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    // Look for 'location' info
    if (props.latitude && props.longitude) {
      let ptConverted = fromLonLat([
        parseFloat(props.longitude),
        parseFloat(props.latitude)
      ]);

      geoJson.features.push({
        type: 'Feature',
        id: props.id || 'feature-supplier',
        geometry: {
          type: 'Point',
          coordinates: ptConverted
        },
        properties: {
          name: props.label || '',
          id: props.id || 'feature-1',
          layer: 'primary'
        }
      });
    }

    return geoJson;
  },

  convertPointsToGeoJson: function(points) {
    let geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    if (points && points.length > 0) {
      points.forEach(function(value, index) {
        let latLong = value.split(',');
        if (latLong.length === 2) {
          let ptConverted = fromLonLat([
            parseFloat(latLong[1]),
            parseFloat(latLong[0])
          ]);

          geoJson.features.push({
            type: 'Feature',
            id: 'component' + index,
            geometry: {
              type: 'Point',
              coordinates: ptConverted
            },
            properties: {
              name: '',
              id: 'component' + index,
              layer: 'component'
            }
          });
        }
      });
    }

    return geoJson;
  }
};

export default mapUtils;