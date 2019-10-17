# grove-react-map-components

## Installation

`npm install grove-react-map-components`

## MapContext

The MapContext is used to reference and manipulate the underlying OpenLayers map instance. It is a react context and, as such, is available to any component within the DOM hierarchy of the provider. Use a parent MapProvider so that all child map components will affect the same map instance. This allows multiple instances of a map to be created depending on the needs of the application. Grove-react-map-components use this context internally. Your custom components can also use them by importing MapContext and referencing it via `useContext(MapContext)` or `contextType = MapContext` in your React component.

## &lt;MapProvider&gt;

The MapProvder is a required parent component that exposes the MapContext to its child components. It renders nothing directly and encapsulates an instance of a map. You can have multiple MapProviders instances.

## &lt;OpenLayersMap&gt;

This is a basemap component that will create a map instance using OpenLayers API. It must appear within a MapProvider parent and supports the following properties:

> **projection**: *"EPSG:3857"* 
> 
> **center**: *[-95.79, 34.48]*
> 
> **zoom**: *4*
>
> **minZoom**: 0
>
> **maxZoom**: 28
> 
> **cssClass**: _"olMap"_ 
> 
> **bingAPIKey**: _undefined. If provided, will use Bing basemap instead of OSM_ 
> 
> **bingImagerySet**: _used to specify the Bing imagery set if bingAPIKey is provided. Defaults to "AerialWithLabels"_
> 
> **allowFullScreen**: _false_ If true, adds a full screen control to the map
> 
> **showMousePosition**: _false_ If true, displays mouse position on the map

## &lt;FeatureLayer&gt;

Used to add features to an existing base map.  Must appear within a MapProvider.  Can have multiple FeatureLayer components within a single map.  They will be added to the map in the order they appear in the DOM.  FeatureLayer removes its created map layer upon unmount of the component, therefore toggle the hidden property if layer order is important to your application.  It supports the following properties:

> **features**: _array_ An array of features to display.  Supports a variety of formats, but must include either `.geometry` or `.location` properties, which can then contain either an array as `.coordinates` or an object with `.lat | .latitude` and `.long | .longitude`.  Optionally may include `.type` and `.featureType` for styling and selection filtering.  The entire feature object will be stored on the resulting map feature as `.data`
> 
> **styleMap**: _object_ an abstraction of OpenLayers style options.  The map should be keyed by feature type.  An example of a style definition is included in [demo/index.js](demo/src/index.js)
>
> **cluster**: _object_ an object definition if clustering is desired.  The structure of the object is passed to the [cluster source](https://openlayers.org/en/latest/apidoc/module-ol_source_Cluster.html).  Optional
>>
> **fit**: _false_ If true, will fit the map bounds to the extent of this layer when features are updated.  _Note: you may wish to set maxZoom on the map if using `fit` with a FeatureLayer that may potentially contain a single feature._
> 
> **layerName**: _string_  Used for debugging purposes.  Optional
