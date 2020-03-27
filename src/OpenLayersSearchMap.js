import React from 'react';

import { Map, View, Overlay } from 'ol';
import { asArray } from 'ol/color';
import {
  defaults as defaultControls,
  FullScreen,
  MousePosition
} from 'ol/control';
import { createStringXY, format } from 'ol/coordinate';
import { getCenter } from 'ol/extent';
import { GeoJSON } from 'ol/format';
import { LineString } from 'ol/geom';
import { Draw, DragZoom } from 'ol/interaction';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { transform, transformExtent } from 'ol/proj';
import { OSM, Vector as VectorSource, XYZ } from 'ol/source';
import { getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import 'ol/ol.css';

import mapUtils from './mapUtils.js';

function trace(msg) {
  // Uncomment to get trace messages
  console.log(msg);
}

class OpenLayersSearchMap extends React.Component {
  constructor(props) {
    super(props);

    let mapId = Math.floor(Math.random() * 1000 + 1);
    this.state = {
      mapTargetId: 'olmap-' + mapId,
      popupContentTargetId: 'olmap-popup-content-' + mapId,
      showMap: true,
      geoFacets: [],
      initialMapMove: true,
      tileServer: 'arcgis-topo'
    };
  }

  componentDidMount() {
    trace('componentDidMount');
    this.processData();
  }

  componentDidUpdate(previousProps) {
    trace('componentDidUpdate');
    if (previousProps.facets !== this.props.facets) {
      this.processData();
    }
    if (this.state.showMap && this.state.map) {
      setTimeout(() => {
        trace('refreshing map');
        this.state.map.updateSize();
      }, 2000);
    }
  }

  createTransparentFill = color => {
    let c = asArray(color);
    let trans = 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + (c[3] / 2.0) + ')';
    return new Fill({
      color: trans
    });
  };

  createPointMarker = color => {
    return [
      new Style({
        image: new CircleStyle({
          radius: 6,
          stroke: new Stroke({ color: color, width: 4 }),
          fill: this.createTransparentFill(color)
        })
      })
    ];
  };

  createLineMarker = color => {
    return new Style({
      stroke: new Stroke({
        color: color,
        width: 12
      })
    });
  };

  createPolygonMarker = color => {
    return new Style({
      stroke: new Stroke({
        color: color,
        //lineDash: [16],
        width: 4
      }),
      fill: this.createTransparentFill(color)
    });
  };

  createCircleMarker = color => {
    return new Style({
      stroke: new Stroke({
        color: color,
        width: 4
      }),
      fill: this.createTransparentFill(color)
    });
  };

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

  createClusterMarker = (color, count) => {
    count = count ? '' + count : '';
    let countLength = count.length;
    let radius = 5 + countLength * 5;

    return [
      // new Style({
      //   image: new CircleStyle({
      //     radius: radius + 8,
      //     fill: this.createTransparentFill(color),
      //     stroke: new Stroke({
      //       color: 'black',
      //       width: strokeWidth,
      //       lineDash: lineDash
      //     })
      //   })
      // }),
      new Style({
        image: new CircleStyle({
          radius: radius,
          fill: this.createTransparentFill(color),
          stroke: new Stroke({
            color: color,
            width: countLength,
            lineDash: [4]
          })
        }),
        text: this.createClusterTextStyle(count)
      })
    ];
  };

  createFeatureMarker = feature => {
    let count = feature.get('count');
    let color = feature.getProperties()['color'] || 'yellow';
    let type = feature.getGeometry().getType();

    if (count > 1) {
      return this.createClusterMarker(color, count);
    } else {
      switch (type) {
        case 'Point':
        case 'MultiPoint':
          return this.createPointMarker(color);

        case 'LineString':
        case 'MultiLineString':
          return this.createLineMarker(color);

        case 'Polygon':
        case 'MultiPolygon':
          return this.createPolygonMarker(color);

        case 'Circle':
          return this.createCircleMarker(color);

        default:
          return this.createPointMarker('yellow');
      }
    }
  };

  getGeoJson(dataProjection, mapProjection) {
    let geoFacets = mapUtils.getGeoFacets(
      this.props.facets,
      this.props.geoFacetNames
    );

    this.setState({ geoFacets: geoFacets });

    return mapUtils.convertFacetsToGeoJson(
      geoFacets,
      dataProjection,
      mapProjection
    );
  }

  getTileSource(tileServer) {
    let tileSource;

    if (tileServer && tileServer.startsWith('arcgis')) {
      let url;
      switch (tileServer.toLowerCase()) {
        case 'arcgis-2d':
          tileSource = new XYZ({
              attributions: 'Copyright:© 2013 ESRI, i-cubed, GeoEye',
              maxZoom: 16,
              projection: 'EPSG:4326',
              tileSize: 512,
              tileUrlFunction: function(tileCoord) {
                return (
                  'https://services.arcgisonline.com/arcgis/rest/services/' +
                  'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}'
                )
                  .replace('{z}', (tileCoord[0] - 1).toString())
                  .replace('{x}', tileCoord[1].toString())
                  .replace('{y}', tileCoord[2].toString());
              },
              wrapX: true
            });
          break;

        case 'arcgis-natgeo':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis-usa':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis-imagery':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Imagery/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis-physical':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Physical_Map/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis-relief':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis-street':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Street_Map/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis-terrain':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Terrain_Base/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'arcgis':
        case 'arcgis-topo':
          url =
            'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
          break;
      }
      if (!tileSource && url) {
        tileSource = new XYZ({
            attributions:
              'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
              'rest/services/">ArcGIS</a>',
            url: url
          });
      }
    }
    if (!tileSource) {
      tileSource = new OSM();
    }

    return tileSource;
  }

  getMapProjection(tileServer) {
    let mapProjection;

    if (tileServer && tileServer === 'arcgis-2d') {
      mapProjection = 'EPSG:4326';
    } else {
      mapProjection = 'EPSG:3857';
    }

    return mapProjection;
  }

  processData() {
    trace('processData');

    let tileSource = this.getTileSource(this.state.tileServer);
    let mapProjection = this.getMapProjection(this.state.tileServer);

    let dataProjection = this.props.projection || 'EPSG:4326';

    // Get the geo data
    let geoJsons = this.getGeoJson(dataProjection, mapProjection);

    let center;

    let layers = geoJsons.map((geoJson, index) => {
      let convertedGeoJson = new GeoJSON().readFeatures(geoJson);

      let layer = Array.isArray(this.state.layers) && this.state.layers[index];

      // Update the layer.
      if (layer && layer.getSource() != null) {
        layer.getSource().clear();
        layer.getSource().addFeatures(convertedGeoJson);
      } else {
        //create source and layer
        let layerSource = new VectorSource({
          projection: dataProjection,
          features: convertedGeoJson
        });
        layer = new VectorLayer({
          source: layerSource,
          style: this.createFeatureMarker
        });

        // If there is only 1 feature, use it as the map center.
        if (layerSource.getFeatures().length === 1) {
          center = getCenter(layerSource
            .getFeatures()[0]
            .getGeometry()
            .getExtent()
          );
        }
      }
      return layer;
    });

    if (this.state.map && this.state.map.getView()) {
      let map = this.state.map;

      if (!this.state.layers.length) {
        if (center) {
          map.getView().setCenter(center);
          map.getView().setZoom(this.props.zoom ? this.props.zoom : 15);
        }

        layers.forEach((layer, index) => {
          trace('adding layer ' + index);
          map.addLayer(layer);
        });

        // save layer references to local state
        let state = {
          layers: layers,
          showLayers: layers.map(() => true)
        };
        this.setState(state);
      }
    } else {
      // Setup overlay for popups
      let container = document.getElementById(this.state.popupContentTargetId);
      let overlay = new Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      });

      let drawingsLayer = new VectorLayer({
        source: new VectorSource({
          projection: dataProjection,
          features: []
        })
      });

      center =
        center ||
        (this.props.lonLat
          ? transform(this.props.lonLat, dataProjection, mapProjection)
          : transform([-95.79, 34.48], 'EPSG:4326', mapProjection));

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
            source: tileSource
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
        ]
          .concat(layers)
          .concat([drawingsLayer]),
        overlays: [overlay],
        view: new View({
          projection: mapProjection,
          center: center,
          zoom: this.props.zoom ? this.props.zoom : 4
        }),
        controls: defaultControls().extend([
          new FullScreen(),
          new MousePosition({
            coordinateFormat: point => {
              return format(point, 'lat: {y}, lng: {x}', 4);
            },
            projection: dataProjection
          })
        ])
      });

      // save map and layer references to local state
      let state = {
        map: map,
        layers: layers,
        showLayers: layers.map(() => true),
        drawingsLayer: drawingsLayer,
        overlay: overlay,
        mapProjection: mapProjection,
        dataProjection: dataProjection
      };
      this.setState(state, this.afterProcessData.bind(this));
    }
  }

  afterProcessData() {
    trace('afterProcessData');
    let that = this;
    let tilesSelect = document.getElementById('map-tiles-type');
    let typeSelect = document.getElementById('map-selection-type');
    let interaction; // global so we can remove them later

    let map = this.state.map;
    let drawingsLayer = this.state.drawingsLayer;

    function addInteractions(value) {
      if (value) {
        if (value === 'Free Hand') {
          interaction = new DragZoom();
        } else {
          interaction = new Draw({
            source: drawingsLayer.getSource(),
            type: value
          });
        }
        map.addInteraction(interaction);
      }
    }

    /**
     * Handle change event.
     */
    tilesSelect.onchange = function() {
      trace('change tileserver');
      let tileSource = that.getTileSource(tilesSelect.value);
      let mapProjection = that.getMapProjection(tilesSelect.value);
      let tileLayer = map.getLayers().item(0);
      tileLayer.setSource(tileSource);
      that.setState({
        tileServer: tilesSelect.value,
        mapProjection: mapProjection
      })
    };

    typeSelect.onchange = function() {
      trace('change interaction');
      if (interaction) {
        map.removeInteraction(interaction);
      }
      addInteractions(typeSelect.value);
    };

    addInteractions(typeSelect.value);

    drawingsLayer.getSource().on('addfeature', function(event) {
      trace('on addfeature');
      that.addDrawings(event.feature.getGeometry());
    });

    // Bind handler for map clicks.
    map.on('singleclick', this.handleMapClick.bind(this));

    // Bind handler for map moves.
    map.on('moveend', this.handleMapMove.bind(this));

    // Bind handler for right clicks.
    map.on('contextmenu', function(event) {
      trace('on contextmenu');
      event.preventDefault();
      that.resetMap();
      if (interaction) {
        map.removeInteraction(interaction);
      }
      addInteractions();
    });
  }

  getBoxBounds(extent) {
    let convertedExtent = transformExtent(
      extent,
      this.state.mapProjection,
      this.state.dataProjection
    );
    return {
      south: convertedExtent[1],
      west: convertedExtent[0],
      north: convertedExtent[3],
      east: convertedExtent[2]
    };
  }

  getPolygonBounds(geometry) {
    let points = geometry.getCoordinates()[0];
    return {
      point: points.map(point => {
        return this.getPointBounds(point);
      })
    };
  }

  getCircleBounds(geometry) {
    let center = geometry.getCenter();
    let edge = [center[0], center[1] + geometry.getRadius()];
    let radius = new LineString([center, edge]);
    return {
      radius: getLength(radius),
      point: this.getPointBounds(center)
    };
  }

  getPointBounds(geometry) {
    let lonLat = transform(
      geometry.getCoordinates ? geometry.getCoordinates() : geometry,
      this.state.mapProjection,
      this.state.dataProjection
    );
    return {
      latitude: lonLat[1],
      longitude: lonLat[0]
    };
  }

  addDrawings(geometry) {
    let bounds;
    let shape = geometry.getType();
    if (shape === 'Point') {
      bounds = this.getPointBounds(geometry);
    } else if (shape === 'Circle') {
      bounds = this.getCircleBounds(geometry);
    } else if (shape === 'Polygon') {
      // shape = 'Box';
      // bounds = this.getBoxBounds(geometry.getExtent());
      bounds = this.getPolygonBounds(geometry);
    }

    if (this.props.drawingAdded) {
      this.props.drawingAdded(bounds);
    }
  }

  resetMap() {
    if (this.state.drawingsLayer) {
      this.state.drawingsLayer.getSource().clear();
    }
    if (this.state.map && this.state.map.getView()) {
      let map = this.state.map;
      let center = this.props.lonLat
        ? transform(
            this.props.lonLat,
            this.state.dataProjection,
            this.state.mapProjection
          )
        : transform([-95.79, 34.48], 'EPSG:4326', this.state.mapProjection);
      map.getView().setCenter(center);
      map.getView().setZoom(this.props.zoom ? this.props.zoom : 4);
    }
    if (this.props.resetMap) {
      this.props.resetMap();
    }
  }

  handleMapClick(event) {
    trace('handleMapClick');
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
        if (layer) {
          if (layers[layer]) {
            layers[layer].push(feature);
          } else {
            layers[layer] = [feature];
          }
        }
      });

      layers = Object.keys(layers).map(key => {
        let layer = layers[key];
        return layer.map(feature => {
          let color = feature.get('color');
          let label = feature.get('label');
          let properties = feature.getProperties();
          properties = Object.keys(properties).map(key => {
            if ([
              /* TDE specials */ 'OBJECTID', 'LABEL', 'DBID',
              /* Map specials */ 'layer', 'label', 'id', 'color', 'geometry'
            ].indexOf(key) < 0) {
              let val = properties[key];
              return `<li>${key}: ${val}</li>`;
            }
          }).join('')
          return `<div style="overflow: auto"><strong><b style="color: ${color}">&#9673;</b>&nbsp;${label}</strong><ul style="max-height: 200px;">${properties}</ul></div>`;
        }).join('');
      })
      let display = `${layers}`;

      let content = document.getElementById(this.state.popupContentTargetId);
      if (content && display) {
        content = content.getElementsByClassName('popup-content')[0];
        content.innerHTML = display;
        let coordinate = event.coordinate;
        this.state.overlay.setPosition(coordinate);
      }
    }
  }

  handleMapMove(event) {
    trace('handleMapMove');
    let size = this.state.map.getSize();
    let extent = this.state.map.getView().calculateExtent(size);
    let bounds = this.getBoxBounds(extent);

    if (this.state.initialMapMove) {
      // ignore initial map move, just loading of the map
      this.setState({
        initialMapMove: false
      });
    } else if (this.props.boundsChanged) {
      this.props.boundsChanged(bounds);
    }
  }

  closePopup() {
    trace('closePopup');
    this.state.overlay.setPosition(undefined);
  }

  handleShowMap = () => {
    this.setState({ showMap: !this.state.showMap });
  };

  toggleVisible = index => {
    trace('toggleVisible ' + index);
    if (this.state.showLayers && this.state.showLayers[index] !== undefined) {
      let showLayers = [...this.state.showLayers];
      showLayers[index] = !showLayers[index];
      if (this.state.layers && this.state.layers[index]) {
        this.state.layers[index].setVisible(showLayers[index]);
      }
      this.setState({
        showLayers
      });
    }
  };

  render() {
    var width = this.props.width ? this.props.width : '100%';
    var height = this.props.height ? this.props.height : '400px';
    var hide = { display: 'none' };
    var showHide = !this.state.showMap
    ? hide
    : { };
    var mapStyle = !this.state.showMap
      ? hide
      : { display: 'block', width: width, height: height };
    return (
      <div>
        <div className="inline-block">
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
            <span style={showHide}>
              &nbsp;&nbsp;&nbsp;
              <label>Tiles:&nbsp;</label>
              <select id="map-tiles-type" defaultValue={this.state.tileServer}>
                <option value="osm">OpenStreetMap</option>
                <option value="arcgis-2d">ArcGIS ESRI 2D</option>
                <option value="arcgis-natgeo">ArcGIS NatGeo</option>
                <option value="arcgis-usa">ArcGIS USA Topo</option>
                <option value="arcgis-imagery">ArcGIS Imagery</option>
                <option value="arcgis-physical">ArcGIS Physical</option>
                <option value="arcgis-relief">ArcGIS Relief</option>
                <option value="arcgis-street">ArcGIS Street</option>
                <option value="arcgis-terrain">ArcGIS Terrain</option>
                <option value="arcgis-topo">ArcGIS Topo</option>
              </select>
              &nbsp;&nbsp;&nbsp;
              <span style={hide}>
                <label>Interaction:&nbsp;</label>
                <select id="map-selection-type">
                  <option value="Free Hand">Free Hand</option>
                  <option value="Point">Draw Point</option>
                  <option value="Polygon">Draw Polygon</option>
                  <option value="Circle">Draw Circle</option>
                </select>
                &nbsp;&nbsp;&nbsp;
              </span>
              <i>Right click to reset the map</i>
            </span>
          </div>
          <div style={showHide}>
            <label>Legend:&nbsp;</label>
            {this.state.geoFacets.map((geoFacet, index) => (
              (geoFacet.facet.boxes && geoFacet.facet.boxes.length) || (geoFacet.facet.features && geoFacet.facet.features.length) ? (
                <span key={index}>
                  <b style={{ color: geoFacet.color }}>&#9673;</b>
                  &nbsp;
                  {geoFacet.facet.name}
                  {geoFacet.facet.limitExceeded ? '!!' : ''}
                  &nbsp;
                  ({(geoFacet.facet.boxes && geoFacet.facet.boxes.length) || (geoFacet.facet.features && geoFacet.facet.features.length)})
                  &nbsp;
                  {this.state.showLayers ? (
                    <input
                      type="checkbox"
                      checked={this.state.showLayers[index]}
                      onChange={() => this.toggleVisible(index)}
                    ></input>
                  ) : (
                    ''
                  )}
                  &nbsp;
                </span>
              ) : ''
            ))}
          </div>
        </div>
        <div
          id={this.state.mapTargetId}
          className={this.props.class || 'olmap'}
          style={mapStyle}
        />
        <div id={this.state.popupContentTargetId} className="ol-popup">
          <div className="pull-right" onClick={() => this.closePopup()}><i className="fa fa-times"></i></div>
          <div className="popup-content"></div>
        </div>
      </div>
    );
  }
}

export default OpenLayersSearchMap;
