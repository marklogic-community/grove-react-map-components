import React from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Overlay from 'ol/Overlay.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style.js';
import { fromLonLat, transformExtent } from 'ol/proj';
import { createStringXY } from 'ol/coordinate.js';
import { defaults as defaultControls, FullScreen } from 'ol/control.js';
import MousePosition from 'ol/control/MousePosition.js';
import mapUtils from './mapUtils.js';

class OpenLayersSearchMap extends React.Component {
  constructor(props) {
    super(props);

    // Create a unique map identifier so multiple maps can exist on the same view.
    let mapId = Math.floor(Math.random() * 1000 + 1);
    this.state = {
      geoJsonData: {
        projection: 'EPSG:4326',
        type: 'FeatureCollection',
        features: []
      },
      mapTargetId: 'olmap-' + mapId,
      popupContentTargetId: 'olmap-popup-content-' + mapId,
      showMap: true
    };
  }

  componentDidMount() {
    this.initializeMap();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.facets !== this.props.facets) {
      this.processData();
    }
  }

  createClusterTextStyle(text) {
    return new Text({
      textAlign: 'center',
      textBaseline: 'middle',
      font: '14px Arial',
      text: text,
      fill: new Fill({ color: 'black' }),
      offsetX: 0,
      offsetY: 0,
      rotation: 0
    });
  }

  createClusterMarker = feature => {
    let radius = 10;
    let count = 0;
    let countLength = 0;
    let lineDash = [5];
    let strokeWidth = 2;

    if (feature.get('count')) {
      count = feature.get('count');
      countLength = count.toString().length;
      radius = 10 + (countLength > 1 ? (countLength - 1) * 5 : 0);
    }

    if (count === 1) {
      radius = 5;
      strokeWidth = 1;
      lineDash = [];
    }

    let countValue = count > 1 ? count.toString() : '';
    let styles = [];
    if (count === 1) {
      styles = [
        new Style({
          image: new CircleStyle({
            radius: radius,
            fill: new Fill({ color: '#0066ff' }),
            stroke: new Stroke({
              color: 'black',
              width: strokeWidth,
              lineDash: lineDash
            })
          }),
          text: this.createClusterTextStyle(countValue)
        })
      ];
    } else {
      styles = [
        new Style({
          image: new CircleStyle({
            radius: radius + 8,
            fill: new Fill({ color: '#0066ff' }),
            stroke: new Stroke({
              color: 'black',
              width: strokeWidth,
              lineDash: lineDash
            })
          })
        }),
        new Style({
          image: new CircleStyle({
            radius: radius,
            fill: new Fill({ color: '#cce0ff' }),
            stroke: new Stroke({
              color: 'black',
              width: strokeWidth,
              lineDash: lineDash
            })
          }),
          text: this.createClusterTextStyle(countValue)
        })
      ];
    }

    return styles;
  };

  processData() {
    // Create the main point layer features.
    let primaryGeoJson = mapUtils.convertFacetsToGeoJson(
      this.props.facets,
      this.props.geoFacetName
    );
    let convertedGeoJson = new GeoJSON().readFeatures(primaryGeoJson);

    // Update the layer.
    this.state.primaryLayer.getSource().clear();
    this.state.primaryLayer.getSource().addFeatures(convertedGeoJson);
  }

  initializeMap() {
    // Create the main point layer.
    let primaryGeoJson = mapUtils.convertFacetsToGeoJson(
      this.props.facets,
      this.props.geoFacetName
    );
    let primarySource = new VectorSource({
      projection: 'EPSG:4326',
      features: new GeoJSON().readFeatures(primaryGeoJson)
    });

    let primaryLayer = new VectorLayer({
      source: primarySource,
      style: this.createClusterMarker
    });

    //
    // Convert from EPSG:4326 to EPSG:3857 coordinates because that is the default for
    // OpenLayers and the base maps look better in that projection.
    //
    let center = fromLonLat([-95.79, 34.48]);

    // If there is only 1 feature, use it as the map center.
    if (primarySource.getFeatures().length === 1) {
      center = primarySource
        .getFeatures()[0]
        .getGeometry()
        .getCoordinates();
    }

    // Setup overlay for popups
    let container = document.getElementById(this.state.popupContentTargetId);
    let overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });

    let map = new Map({
      target: this.state.mapTargetId,
      layers: [
        // This is an example of an Esri base map.  The following imports are needed:
        //
        // import XYZ from 'ol/source/XYZ.js';
        //
        // new TileLayer({
        //   source: new XYZ({
        //     attributions:
        //       'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
        //       'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
        //     url:
        //       'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        //       'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
        //   })
        // }),

        // Default base map is Open Street Map.
        new TileLayer({
          source: new OSM()
        }),

        // This is an example of 2 layers from a local map server when internet
        // access is not available.
        //
        // The following imports are needed:
        //
        // import { Image as ImageLayer } from 'ol/layer.js';
        // import ImageWMS from 'ol/source.js';
        //
        // new ImageLayer({
        //   source: new ImageWMS({
        //     url: 'http://localhost:8080/geoserver/tm_world/wms',
        //     params: {
        //       LAYERS: 'tm_world:TM_WORLD_BORDERS-0.3'
        //     }
        //   })
        // }),
        // new ImageLayer({
        //   source: new ImageWMS({
        //     url: 'http://localhost:8080/geoserver/topp/wms',
        //     params: {
        //       LAYERS: 'topp:states'
        //     }
        //   })
        // }),

        primaryLayer
      ],
      overlays: [overlay],
      view: new View({
        projection: 'EPSG:3857',
        center: center,
        zoom: 4
      }),
      controls: defaultControls().extend([
        new FullScreen(),
        new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: 'EPSG:4326'
        })
      ])
    });

    // Bind handler for map clicks.
    map.on('click', this.handleMapClick.bind(this));

    // Comment out this line to prevent filtering the search using the map bounds.
    map.on('moveend', this.handleMapMove.bind(this));

    // save map and layer references to local state
    this.setState({
      map: map,
      primaryLayer: primaryLayer,
      overlay: overlay
    });
  }

  handleMapMove(event) {
    let size = this.state.map.getSize();
    let extent = this.state.map.getView().calculateExtent(size);
    let convertedExtent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    let geoSearch = {
      box: [
        {
          south: convertedExtent[1],
          west: convertedExtent[0],
          north: convertedExtent[3],
          east: convertedExtent[2]
        }
      ]
    };

    // Assumes that geospatial constraint can be used to filter search.
    this.props.replaceFilter(this.props.geoFacetName, 'custom', geoSearch);
  }

  handleMapClick(event) {
    // Close the old popup first.
    this.closePopup();

    // Find the feature near the clicked location.
    let features = this.state.map.getFeaturesAtPixel(event.pixel);
    if (features && features.length > 0) {
      // Group the features into buckets based on layer.
      let layers = {};
      features.forEach(function(feature, index) {
        let layer = feature.get('layer');
        let uri = feature.get('uri');
        if (layer && uri) {
          if (layers[layer]) {
            layers[layer].push(feature);
          } else {
            layers[layer] = [feature];
          }
        }
      });

      let display = null;
      if (layers['primary'] && layers['primary'].length > 0) {
        display = '<div><ul>';
        layers['primary'].forEach(function(primFeat) {
          let uri = primFeat.get('uri');
          let label =
            primFeat.get('label') || primFeat.get('name') || uri || 'unknown';
          display +=
            '<li><a href="/detail/?id=' + uri + '">' + label + '</a></li>';
        });
        display += '</ul></div>';
      }

      let content = document.getElementById(this.state.popupContentTargetId);
      if (content && display) {
        content.innerHTML = display;
        let coordinate = event.coordinate;
        this.state.overlay.setPosition(coordinate);
      }
    }
  }

  closePopup() {
    this.state.overlay.setPosition(undefined);
  }

  handleShowMap = () => {
    this.setState({ showMap: !this.state.showMap });
  };

  render() {
    return (
      <div>
        <div>
          <span>
            <input
              name="showMap"
              type="checkbox"
              checked={this.state.showMap}
              onChange={this.handleShowMap}
            />
            <span> Show Map</span>
          </span>
        </div>
        <div
          id={this.state.mapTargetId}
          className={this.props.class || 'olmap'}
        />
        <div id={this.state.popupContentTargetId} className="ol-popup">
          <div id={this.state.popupContentTargetId} />
        </div>
      </div>
    );
  }
}

export default OpenLayersSearchMap;