import React, { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { paintOptions } from './index';
import { MAPBOX_TOKEN, BASEMAP_OPTIONS, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL } from '../../config';

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

const BasemapMenu = ({ map }) => {
  // Remove elements that require mapbox token;
  let styles = BASEMAP_OPTIONS;
  if (!MAPBOX_TOKEN) {
    styles = BASEMAP_OPTIONS.filter(s => typeof s.value === 'object');
  }

  const [basemap, setBasemap] = useState(styles[0].label);

  const handleClick = style => {
    let styleValue = style.value;

    if (typeof style.value === 'string') {
      styleValue = 'mapbox://styles/mapbox/' + style.value;
    }
    map.setStyle(styleValue);
    setBasemap(style.label);
  };

  return (
    <div className="bg-white blue-dark flex mt2 ml2 f7 br1 shadow-1">
      {styles.map(style => {
        return (
          <div
            onClick={() => handleClick(style)}
            className={`ttc pv2 ph3 pointer link + ${
              basemap === style.label ? 'bg-grey-light fw6' : ''
            }`}
          >
            {style.label}
          </div>
        );
      })}
    </div>
  );
};

const ProjectCreationMap = ({ mapObj, setMapObj, metadata, updateMetadata }) => {
  const mapRef = React.createRef();
  const locale = useSelector(state => state.preferences['locale']);

  useLayoutEffect(() => {
    setMapObj({
      ...mapObj,
      map: new mapboxgl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        center: [0, 0],
        zoom: 1,
        attributionControl: false,
      })
        .addControl(new mapboxgl.AttributionControl({ compact: false }))
        .addControl(new MapboxLanguage({ defaultLanguage: locale.substr(0, 2) || 'en' })),
    });

    return () => {
      mapObj.map && mapObj.map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    if (mapObj.map !== null) {
      mapObj.map.on('load', () => {
        mapObj.map.addControl(new mapboxgl.NavigationControl());
        mapObj.map.addControl(mapObj.draw);
      });

      // Remove area and geometry when aoi is deleted.
      mapObj.map.on('draw.delete', event => {
        updateMetadata({ ...metadata, geom: null, area: 0 });
      });

      mapObj.map.on('style.load', event => {
        const layer_name = 'aoi';
        if (mapObj.map.getLayer(layer_name)) {
          mapObj.map.removeLayer(layer_name);
        }
        if (mapObj.map.getSource(layer_name)) {
          mapObj.map.removeSource(layer_name);
        }

        mapObj.map.addLayer({
          id: layer_name,
          type: 'fill',
          source: {
            type: 'geojson',
            data: metadata.geom,
          },
          paint: paintOptions,
        });
      });
    }
  }, [mapObj, metadata, updateMetadata]);

  return (
    <div className="w-100 h-100-l relative">
      <div className="absolute top-0 left-0 z-5">
        <BasemapMenu map={mapObj.map} />
      </div>
      <div id="map" className="vh-50 h-100-l w-100" ref={mapRef}></div>
    </div>
  );
};

export { ProjectCreationMap };
