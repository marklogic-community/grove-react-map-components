/* mapUtils.js
 *
 * This file includes utility functions for working with a map.
 */

import { fromLonLat } from 'ol/proj';

function getRandomColor() {
  return '#000000'.replace(/0/g, function () {
    return (~~(Math.random() * 16)).toString(16);
  });
}

var mapUtils = {
  getGeoFacets: function getGeoFacets(facets, facetNames) {
    var geoFacets = [];
    if (facets) {
      if (facetNames && facetNames.length > 0) {
        facetNames.forEach(function (facetName) {
          var facet = facets[facetName];
          if (facet && facet.boxes && facet.boxes.length > 0) {
            geoFacets.push({
              color: getRandomColor(),
              facet: facet
            });
          }
        });
      } else {
        var facetObjects = Object.values(facets);
        facetObjects.forEach(function (facet) {
          if (facet.boxes && facet.boxes.length > 0) {
            geoFacets.push({
              color: getRandomColor(),
              facet: facet
            });
          }
        });
      }
    }
    return geoFacets;
  },

  convertFacetsToGeoJson: function convertFacetsToGeoJson(geoFacets) {
    var geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    geoFacets.forEach(function (geoFacet) {
      var facet = geoFacet.facet;
      var color = geoFacet.color;
      facet.boxes.forEach(function (value, index) {
        if (value.count > 0) {
          var lng = (value.w + value.e) / 2;
          var lat = (value.s + value.n) / 2;
          var ptConverted = fromLonLat([lng, lat]);
          geoJson.features.push({
            type: 'Feature',
            id: value.id || 'feature' + index,
            geometry: {
              type: 'Point',
              coordinates: ptConverted
            },
            properties: {
              label: value.label,
              id: value.id || 'feature' + index,
              layer: 'primary',
              count: value.count,
              uri: value.uri,
              color: color
            }
          });
        }
      });
    });

    return geoJson;
  },

  convertPropsToGeoJson: function convertPropsToGeoJson(props) {
    var geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    // Look for 'location' info
    if (props.latitude && props.longitude) {
      var ptConverted = fromLonLat([parseFloat(props.longitude), parseFloat(props.latitude)]);

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

  convertPointsToGeoJson: function convertPointsToGeoJson(points) {
    var geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    if (points && points.length > 0) {
      points.forEach(function (value, index) {
        var latLong = value.split(',');
        if (latLong.length === 2) {
          var ptConverted = fromLonLat([parseFloat(latLong[1]), parseFloat(latLong[0])]);

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