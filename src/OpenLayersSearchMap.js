import React from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Overlay from 'ol/Overlay.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style.js';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import { createStringXY } from 'ol/coordinate.js';
import { defaults as defaultControls, FullScreen } from 'ol/control.js';
import MousePosition from 'ol/control/MousePosition.js';
import { Draw, DragZoom } from 'ol/interaction.js';
import mapUtils from './mapUtils.js';
import 'ol/ol.css';

class OpenLayersSearchMap extends React.Component {
  constructor(props) {
    super(props);

    let mapId = Math.floor(Math.random() * 1000 + 1);
    this.state = {
      mapTargetId: 'olmap-' + mapId,
      popupContentTargetId: 'olmap-popup-content-' + mapId,
      showMap: true,
      geoFacets: [],
      drawnBounds: {},
      geoStyles: {
        Point: new Style({
          image: new CircleStyle({
            radius: 5,
            fill: null,
            stroke: new Stroke({ color: 'blue', width: 1 })
          })
        }),
        Polygon: new Style({
          stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)'
          })
        }),
        Circle: new Style({
          stroke: new Stroke({
            color: 'red',
            width: 2
          }),
          fill: new Fill({
            color: 'rgba(255,0,0,0.2)'
          })
        })
      }
    };
  }

  componentDidMount() {
    this.processData();
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
    let color = feature.getProperties()['color'];
    if (color) {
      if (count === 1) {
        styles = [
          new Style({
            image: new CircleStyle({
              radius: radius,
              fill: new Fill({ color: color }),
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
              fill: new Fill({ color: color }),
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
    } else {
      styles = [this.state.geoStyles[feature.getGeometry().getType()]];
    }

    return styles;
  };

  getPrimaryGeoJson() {
    let geoFacets = mapUtils.getGeoFacets(
        this.props.facets,
        this.props.geoFacetNames
    );

    this.setState({ geoFacets: geoFacets });

    return mapUtils.convertFacetsToGeoJson(geoFacets);
  }

  getPrimaryStyle() {
    return this.createClusterMarker;
  }

  processData() {
    // Create the point layer.
    let primaryGeoJson = this.getPrimaryGeoJson();

    if (primaryGeoJson.features.length === 0) {
      return;
    }

    let convertedGeoJson = new GeoJSON().readFeatures(primaryGeoJson);

    // Update the layer.
    if (
        this.state.primaryLayer != null &&
        this.state.primaryLayer.getSource() != null
    ) {
      this.state.primaryLayer.getSource().clear();
      this.state.primaryLayer.getSource().addFeatures(convertedGeoJson);
    } else {
      //create source and layer
      let primarySource = new VectorSource({
        projection: 'EPSG:4326',
        features: convertedGeoJson
      });
      let primaryLayer = new VectorLayer({
        source: primarySource,
        style: this.getPrimaryStyle()
      });

      let center = this.props.lonLat
          ? fromLonLat(this.props.lonLat)
          : fromLonLat([-95.79, 34.48]);

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
          zoom: this.props.zoom ? this.props.zoom : 4
        }),
        controls: defaultControls().extend([
          new FullScreen(),
          new MousePosition({
            coordinateFormat: createStringXY(4),
            projection: 'EPSG:4326'
          })
        ])
      });

      // save map and layer references to local state
      let state = {
        map: map,
        primaryLayer: primaryLayer,
        overlay: overlay
      };
      this.setState(state, this.afterProcessData(map, primaryLayer));
    }
  }

  afterProcessData(map, primaryLayer) {
    let that = this;
    let typeSelect = document.getElementById('map-selection-type');
    let interaction; // global so we can remove them later

    function addInteractions() {
      let value = typeSelect.value;
      if (value === 'Free Hand') {
        interaction = new DragZoom();
      } else {
        interaction = new Draw({
          source: primaryLayer.getSource(),
          type: value
        });
      }
      map.addInteraction(interaction);
    }

    /**
     * Handle change event.
     */
    typeSelect.onchange = function() {
      if (interaction) {
        map.removeInteraction(interaction);
      }
      addInteractions();
    };

    addInteractions();

    let addedFeature;
    let addFeatureLocked = false;
    primaryLayer.getSource().on('addfeature', function(event) {
      if (!addFeatureLocked) {
        addFeatureLocked = true;
        let extent = event.feature.getGeometry().getExtent();
        let isGeoFacet =
            event.feature.getProperties() &&
            event.feature.getProperties()['layer'] === 'primary';
        // If the feature is new
        if (
            !isGeoFacet &&
            (!addedFeature ||
                addedFeature
                    .getGeometry()
                    .getExtent()
                    .toString() !== extent.toString())
        ) {
          addedFeature = event.feature;
          that.updateDrawnBounds(addedFeature.getGeometry());
        }
        addFeatureLocked = false;
      }
    });

    // Bind handler for map clicks.
    map.on('click', this.handleMapClick.bind(this));

    // Bind handler for right clicks.
    map.getViewport().addEventListener('contextmenu', function() {
      that.resetDrawnBounds();
      that.processData();
      if (interaction) {
        map.removeInteraction(interaction);
      }
      addInteractions();
    });
  }

  getBoxBounds(extent) {
    let convertedExtent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    return {
      south: convertedExtent[1],
      west: convertedExtent[0],
      north: convertedExtent[3],
      east: convertedExtent[2]
    };
  }

  getCircleBounds(geometry) {
    let center = geometry.getCenter();
    return {
      radius: geometry.getRadius(),
      point: {
        latitude: center[1],
        longitude: center[0]
      }
    };
  }

  getPointBounds(geometry) {
    let lonLat = geometry.getCoordinates();
    return {
      latitude: lonLat[1],
      longitude: lonLat[0]
    };
  }

  updateDrawnBounds(geometry) {
    let bounds = {};
    let shape = geometry.getType();
    if (shape === 'Point') {
      bounds = this.getPointBounds(geometry);
    } else if (shape === 'Circle') {
      bounds = this.getCircleBounds(geometry);
    } else if (shape === 'Polygon') {
      shape = 'Box';
      bounds = this.getBoxBounds(geometry.getExtent());
    }

    if (shape) {
      shape = shape.toLowerCase();
      if (!this.state.drawnBounds[shape]) {
        this.state.drawnBounds[shape] = [];
      }
      this.state.drawnBounds[shape].push(bounds);
    }

    if (this.props.boundsChanged) {
      this.props.boundsChanged(this.state.drawnBounds);
    }
  }

  resetDrawnBounds() {
    this.setState({ drawnBounds: {} });
    if (this.props.boundsChanged) {
      this.props.boundsChanged(this.state.drawnBounds);
    }
  }

  handleMapClick(event) {
    // Close the old popup first.
    this.closePopup();
    let that = this;
    // Find the feature near the clicked location.
    let features = this.state.map.getFeaturesAtPixel(event.pixel);
    if (features && features.length > 0) {
      // Group the features into buckets based on layer.
      let layers = {};
      features.forEach(function(feature) {
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
          display += '<li>';
          if (that.props.markerClick) {
            display += '<a onclick="' + that.props.markerClick(uri) + '">';
          } else {
            display += '<a href="/detail/' + encodeURIComponent(uri) + '">';
          }
          display += label + '</a></li>';
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
    var width = this.props.width ? this.props.width : '100%';
    var height = this.props.height ? this.props.height : '400px';
    var mapStyle =  !this.state.showMap
        ? { display: 'none' }
        : { display: 'block', width: width, height: height }
    return (
        <div>
          <div className="inline-block">
          <span>
            <input
                name="showMap"
                type="checkbox"
                checked={this.state.showMap}
                onChange={this.handleShowMap}
            />
            <span> Show Map</span>
          </span>
            &nbsp;&nbsp;
            <label>Interaction &nbsp;</label>
            <select id="map-selection-type">
              <option value="Free Hand">Free Hand</option>
              <option value="Point">Draw Point</option>
              <option value="Polygon">Draw Polygon</option>
              <option value="Circle">Draw Circle</option>
            </select>
            &nbsp;&nbsp;
            <label>Legend &nbsp;</label>
            {this.state.geoFacets.map((geoFacet, index) => (
                <span key={index}>
              <b style={{ color: geoFacet.color }}>&#9673;</b>
                  &nbsp;
                  {geoFacet.facet.name}
                  &nbsp;
            </span>
            ))}
            &nbsp;&nbsp;
            <i>Right click will clear the drawings</i>
          </div>
          <div
              id={this.state.mapTargetId}
              className={this.props.class || 'olmap'}
              style={mapStyle}
          />
          <div id={this.state.popupContentTargetId} className="ol-popup">
            <div id={this.state.popupContentTargetId} />
          </div>
        </div>
    );
  }
}

export default OpenLayersSearchMap;