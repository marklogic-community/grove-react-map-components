/* mapUtils.js
 *
 * This file includes utility functions for working with a map.
 */

import { transform } from 'ol/proj';

function getRandomColor() {
  return '#000000'.replace(/0/g, function() {
    return (~~(Math.random() * 16)).toString(16);
  });
}

function convertLngLat(lngLat, dataProjection, mapProjection) {
  let lng = parseFloat(lngLat[0]);
  let lat = parseFloat(lngLat[1]);
  return transform([lng, lat], dataProjection, mapProjection);
}

function convertLatLng(latLng, dataProjection, mapProjection) {
  let lat = parseFloat(latLng[0]);
  let lng = parseFloat(latLng[1]);
  return transform([lng, lat], dataProjection, mapProjection);
}

function convertGeometry(
  geometry,
  dataProjection,
  mapProjection,
  latlng = false
) {
  let coordinates = geometry.coordinates;
  if (geometry.type === 'Point') {
    let point = geometry.coordinates;
    coordinates = latlng
      ? convertLatLng(point, dataProjection, mapProjection)
      : convertLngLat(point, dataProjection, mapProjection);
  } else if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
    coordinates = geometry.coordinates.map(point => {
      return latlng
        ? convertLatLng(point, dataProjection, mapProjection)
        : convertLngLat(point, dataProjection, mapProjection);
    });
  } else if (
    geometry.type === 'MultiLineString' ||
    geometry.type === 'Polygon'
  ) {
    coordinates = geometry.coordinates.map(linestring => {
      return linestring.map(point => {
        return latlng
          ? convertLatLng(point, dataProjection, mapProjection)
          : convertLngLat(point, dataProjection, mapProjection);
      });
    });
  } else if (geometry.type === 'MultiPolygon') {
    coordinates = geometry.coordinates.map(polygon => {
      return polygon.map(linestring => {
        return linestring.map(point => {
          return latlng
            ? convertLatLng(point, dataProjection, mapProjection)
            : convertLngLat(point, dataProjection, mapProjection);
        });
      });
    });
  }
  return { ...geometry, coordinates };
}

const mapUtils = {
  getGeoFacets: function(facets, facetNames) {
    let geoFacets = [];
    if (facets) {
      if (facetNames && facetNames.length > 0) {
        facetNames.forEach(function(facetName) {
          const facet = facets[facetName];
          if (facet && (facet.boxes || facet.features)) {
            geoFacets.push({
              color: facet.color || getRandomColor(),
              facet: facet
            });
          }
        });
      } else {
        const facetObjects = Object.values(facets);
        facetObjects.forEach(function(facet) {
          if (facet && (facet.boxes || facet.features)) {
            geoFacets.push({
              color: facet.color || getRandomColor(),
              facet: facet
            });
          }
        });
      }
    }
    return geoFacets;
  },

  convertFacetsToGeoJson: function(geoFacets, dataProjection, mapProjection) {
    return geoFacets.map(function(geoFacet) {
      const facet = geoFacet.facet;
      const color = geoFacet.color;

      let geoJson = {
        type: 'FeatureCollection',
        features: []
      };

      if (facet.boxes) {
        facet.boxes.forEach(function(value, index) {
          if (value.count > 0) {
            let id = value.id || facet.name + '-box-' + index;
            let lng = (value.w + value.e) / 2;
            let lat = (value.s + value.n) / 2;
            geoJson.features.push({
              type: 'Feature',
              id: id,
              geometry: convertGeometry(
                {
                  type: 'Point',
                  coordinates: [lng, lat]
                },
                dataProjection,
                mapProjection
              ),
              properties: {
                label: value.label || value.name,
                id: id,
                layer: facet.name,
                count: value.count,
                uri: value.uri,
                color: color
              }
            });
          }
        });
      } else if (facet.features) {
        facet.features.forEach(function(value, index) {
          let id = value.properties.OBJECTID || facet.name + '-feature-' + index;
          geoJson.features.push({
            type: 'Feature',
            id: id,
            geometry: convertGeometry(
              value.geometry,
              dataProjection,
              mapProjection
            ),
            properties: {
              ...value.properties,
              label: value.properties.LABEL,
              id: id,
              layer: facet.name,
              color: color
            }
          });
        });
      }
      return geoJson;
    });
  },

  convertPropsToGeoJson: function(props, dataProjection, mapProjection) {
    let geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    // Look for 'location' info
    if (props.latitude && props.longitude) {
      geoJson.features.push({
        type: 'Feature',
        id: props.id || 'feature-supplier',
        geometry: convertGeometry(
          {
            type: 'Point',
            coordinates: [props.longitude, props.latitude]
          },
          dataProjection,
          mapProjection
        ),
        properties: {
          name: props.label || '',
          id: props.id || 'feature-1',
          layer: 'primary'
        }
      });
    }

    return geoJson;
  },

  convertPointsToGeoJson: function(points, dataProjection, mapProjection) {
    let geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    if (points && points.length > 0) {
      points.forEach(function(value, index) {
        let latLong = value.split(',');
        if (latLong.length === 2) {
          geoJson.features.push({
            type: 'Feature',
            id: 'component' + index,
            geometry: convertGeometry(
              {
                type: 'Point',
                coordinates: latLong
              },
              dataProjection,
              mapProjection,
              /* latlng */ true
            ),
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
