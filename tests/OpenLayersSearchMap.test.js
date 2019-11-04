import React from 'react';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style.js';
import { transformExtent } from 'ol/proj';
import { Draw, DragZoom } from 'ol/interaction.js';
import mapUtils from 'src/mapUtils.js';
import OpenLayersMap from 'src/OpenLayersMap.js';

class OpenLayersSearchMap extends OpenLayersMap {
    constructor(props) {
        super(props);

        let mapId = this.getMapId();
        this.state = {
            geoJsonData: this.getJsonData(),
            mapTargetId: this.getMapTargetId(mapId),
            popupContentTargetId: this.getPopupContentTargetId(mapId),
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
                    style={
                        !this.state.showMap ? { display: 'none' } : { display: 'block' }
                    }
                />
                <div id={this.state.popupContentTargetId} className="ol-popup">
                    <div id={this.state.popupContentTargetId} />
                </div>
            </div>
        );
    }
}

export default OpenLayersSearchMap;
