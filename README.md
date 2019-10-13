# grove-react-map-components

[Demo](https://marklogic-community.github.io/grove-react-map-components/demo/dist/index.html)

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
> **cssClass**: _"olMap"_ 
> 
> **bingAPIKey**: _undefined. If provided, will use Bing basemap instead of OSM_ 
> 
> **bingImagerySet**: _used to specify the Bing imagery set if bingAPIKey is provided. Defaults to "AerialWithLabels"_
