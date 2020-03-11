import React, { useState } from 'react';
import area from '@turf/area';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { addLayer } from './index';
import { Button } from '../button';
import { makeGrid } from './setTaskSizes';
import { MAX_FILESIZE } from '../../config';

var tj = require('@mapbox/togeojson');
var osmtogeojson = require('osmtogeojson');
var shp = require('shpjs');

export default function SetAOI({ mapObj, metadata, updateMetadata, setErr }) {
  const [arbitraryTasks, setArbitrary] = useState(metadata.arbitraryTasks);
  const layer_name = 'aoi';

  const setDataGeom = geom => {
    mapObj.map.fitBounds(bbox(geom), { padding: 20 });
    const geomArea = area(geom) / 1e6;
    const zoomLevel = parseInt(mapObj.map.getZoom()) + 4;
    const grid = makeGrid(geom, zoomLevel, {});
    updateMetadata({
      ...metadata,
      geom: geom,
      area: geomArea.toFixed(2),
      zoomLevel: zoomLevel,
      taskGrid: grid,
      tempTaskGrid: grid,
    });

    addLayer('aoi', geom, mapObj.map);
  };

  const verifyAndSetData = event => {
    try {
      setDataGeom(event);
    } catch (e) {
      deleteHandler();
      setErr({ error: true, message: <FormattedMessage {...messages.invalidFile} /> });
    }
  };

  const uploadFile = event => {
    setArbitrary(true);
    let files = event.target.files;
    let file = files[0];
    if (!file) {
      return null;
    }
    if (file.size >= MAX_FILESIZE) {
      setErr({
        error: true,
        message: <FormattedMessage {...messages.fileSize} values={{ fileSize: MAX_FILESIZE }} />,
      });
      return null;
    }

    const format = file.name.split('.')[1].toLowerCase();

    let fileReader = new FileReader();
    fileReader.onload = e => {
      let geom = null;
      switch (format) {
        case 'json':
        case 'geojson':
          geom = JSON.parse(e.target.result);
          break;
        case 'kml':
          let kml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = tj.kml(kml);
          break;
        case 'osm':
          let osm = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(osm);
          break;
        case 'xml':
          let xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(xml);
          break;
        case 'zip':
          shp(e.target.result).then(function(geom) {
            verifyAndSetData(geom);
          });
          break;
        default:
          break;
      }
      if (format !== 'zip') {
        verifyAndSetData(geom);
      }
    };

    if (format === 'zip') {
      fileReader.readAsArrayBuffer(file);
    } else {
      fileReader.readAsText(file);
    }
  };

  const deleteHandler = () => {
    if (mapObj.map.getLayer(layer_name)) {
      mapObj.map.removeLayer(layer_name);
    }
    if (mapObj.map.getSource(layer_name)) {
      mapObj.map.removeSource(layer_name);
    }
    updateMetadata({ ...metadata, area: 0, geom: null });
  };

  const drawHandler = () => {
    const updateArea = event => {
      // Validate area first.
      const id = event.features[0].id;
      const geom = featureCollection(event.features);
      mapObj.draw.delete(id);
      setArbitrary(false);
      setDataGeom(geom);
    };

    mapObj.map.once('draw.create', updateArea);
    mapObj.draw.changeMode('draw_polygon');
  };

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
        <FormattedMessage {...messages.step1} />
      </h3>
      <div className="pb4">
        <h3>
          <FormattedMessage {...messages.option1} />:
        </h3>
        <p>
          <FormattedMessage {...messages.drawDescription} />
        </p>
        <Button className="bg-blue-dark white" onClick={drawHandler}>
          <FormattedMessage {...messages.draw} />
        </Button>
      </div>

      <div className="pb4">
        <h3>
          <FormattedMessage {...messages.option2} />:
        </h3>
        <p>
          <FormattedMessage {...messages.importDescription} />
        </p>
        <div className="pb2">
          <input
            type="checkbox"
            className="v-mid"
            defaultChecked={metadata.arbitraryTasks}
            onChange={() => {
              if (arbitraryTasks === true) {
                updateMetadata({ ...metadata, arbitraryTasks: !metadata.arbitraryTasks });
              }
            }}
          />
          <span className="pl2 v-mid">
            <FormattedMessage {...messages.arbitraryTasks} />
          </span>
        </div>
        <div className="pt3">
          <label
            for="file-upload"
            className="bg-blue-dark white br1 f5 bn pointer"
            style={{ padding: '.75rem 1.5rem' }}
          >
            <FormattedMessage {...messages.uploadFile} />
          </label>
          <input onChange={uploadFile} style={{ display: 'none' }} id="file-upload" type="file" />
        </div>
      </div>
      {metadata.geom && (
        <div className="pt4">
          <Button className="bg-red white" onClick={deleteHandler}>
            <FormattedMessage {...messages.deleteArea} />
          </Button>
        </div>
      )}
    </>
  );
}
