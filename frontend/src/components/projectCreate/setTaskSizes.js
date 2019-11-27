import React, { useLayoutEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';

// Maximum resolution of OSM
const MAXRESOLUTION = 156543.0339;

// X/Y axis offset
const AXIS_OFFSET = (MAXRESOLUTION * 256) / 2;

const degrees2meters = (lon, lat) => {
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;

  return [x, y];
};

const meters2degress = (x, y) => {
  const lon = (x * 180) / 20037508.34;
  //thanks magichim @ github for the correction
  const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

  return [lon, lat];
};

const createTaskFeature_ = (step, x, y, zoomLevel) => {
  const xmin = x * step - AXIS_OFFSET;
  const ymin = y * step - AXIS_OFFSET;
  const xmax = (x + 1) * step - AXIS_OFFSET;
  const ymax = (y + 1) * step - AXIS_OFFSET;

  const minlnglat = meters2degress(xmin, ymin);
  const maxlnglat = meters2degress(xmax, ymax);

  const properties = {
    x: x,
    y: y,
    zoom: zoomLevel,
    isSquare: true,
  };
  const bbox = [minlnglat[0], minlnglat[1], maxlnglat[0], maxlnglat[1]];
  const poly = turf.bboxPolygon(bbox);

  return turf.multiPolygon([poly.geometry.coordinates], properties);
};

const createTaskGrid = (areaOfInterestExtent, zoomLevel) => {
  const xmin = Math.ceil(areaOfInterestExtent[0]);
  const ymin = Math.ceil(areaOfInterestExtent[1]);
  const xmax = Math.floor(areaOfInterestExtent[2]);
  const ymax = Math.floor(areaOfInterestExtent[3]);

  // task size (in meters) at the required zoom level
  const step = AXIS_OFFSET / Math.pow(2, zoomLevel - 1);

  // Calculate the min and max task indices at the required zoom level to cover the whole area of interest
  const xminstep = parseInt(Math.floor((xmin + AXIS_OFFSET) / step));
  const xmaxstep = parseInt(Math.ceil((xmax + AXIS_OFFSET) / step));
  const yminstep = parseInt(Math.floor((ymin + AXIS_OFFSET) / step));
  const ymaxstep = parseInt(Math.ceil((ymax + AXIS_OFFSET) / step));

  let taskFeatures = [];
  // Generate an array of task features
  for (let x = xminstep; x < xmaxstep; x++) {
    for (let y = yminstep; y < ymaxstep; y++) {
      let taskFeature = createTaskFeature_(step, x, y, zoomLevel);
      taskFeatures.push(taskFeature);
    }
  }

  return turf.featureCollection(taskFeatures);
};

export const makeGrid = (geom, zoom, mask) => {
  let bbox = turf.bbox(geom);

  const minxy = degrees2meters(bbox[0], bbox[1]);
  const maxxy = degrees2meters(bbox[2], bbox[3]);

  bbox = [minxy[0], minxy[1], maxxy[0], maxxy[1]];

  const grid = createTaskGrid(bbox, zoom);

  return grid;
};

export const layerJson = grid => {
  const source = {
    type: 'geojson',
    data: grid,
  };
  const paintOptions = {
    'fill-color': '#fff',
    'fill-outline-color': '#00f',
    'fill-opacity': 0.5,
  };

  const jsonData = {
    id: 'grid',
    type: 'fill',
    source: source,
    layout: {},
    paint: paintOptions,
  };

  return jsonData;
};

const splitTaskGrid = (taskGrid, geom, zoom) => {
  let newTaskGrid = [];
  taskGrid.features.forEach(f => {
    let poly = turf.polygon(f.geometry.coordinates[0]);
    let contains = turf.intersect(geom, poly);
    if (contains === null) {
      newTaskGrid.push(f);
    } else {
      const splitGrid = makeGrid(f, zoom + 1, {});
      splitGrid.features.forEach(g => {
        newTaskGrid.push(g);
      });
    }
  });

  return newTaskGrid;
};

export default function SetTaskSizes({ metadata, mapObj, updateMetadata }) {
  const geom = metadata.geom.features[0];

  const splitBbox = () => {
    mapObj.map.on('mouseenter', 'grid', event => {
      mapObj.map.getCanvas().style.cursor = 'pointer';
    });
    mapObj.map.on('mouseleave', 'grid', event => {
      mapObj.map.getCanvas().style.cursor = '';
    });
    mapObj.map.on('click', 'grid', event => {
      // Make the geom smaller to avoid borders.
      const taskGrid = mapObj.map.getSource('grid')._data;
      if (metadata.tempTaskGrid === null) {
        updateMetadata({ ...metadata, tempTaskGrid: taskGrid });
      }
      const geom = turf.transformScale(event.features[0].geometry, 0.5);
      const newTaskGrid = splitTaskGrid(taskGrid, geom, metadata.zoomLevel);

      updateMetadata({ ...metadata, taskGrid: turf.featureCollection(newTaskGrid) });
    });
  };

  const splitPolygon = () => {
    mapObj.map.on('mouseenter', 'grid', event => {
      mapObj.map.getCanvas().style.cursor = 'crosshair';
    });
    mapObj.map.on('mouseleave', 'grid', event => {
      mapObj.map.getCanvas().style.cursor = '';
    });
    mapObj.map.once('draw.create', event => {
      const taskGrid = mapObj.map.getSource('grid')._data;
      if (metadata.tempTaskGrid === null) {
        updateMetadata({ ...metadata, tempTaskGrid: taskGrid });
      }

      const id = event.features[0].id;
      mapObj.draw.delete(id);

      const geom = event.features[0].geometry;
      const newTaskGrid = splitTaskGrid(taskGrid, geom, metadata.zoomLevel);
      updateMetadata({ ...metadata, taskGrid: turf.featureCollection(newTaskGrid) });
    });

    mapObj.draw.changeMode('draw_polygon');
  };

  const resetGrid = () => {
    updateMetadata({ ...metadata, taskGrid: metadata.tempTaskGrid });
  };

  const smallerSize = useCallback(() => {
    updateMetadata({ ...metadata, zoomLevel: metadata.zoomLevel + 1 });
  }, [metadata, updateMetadata]);

  const largerSize = useCallback(() => {
    if (metadata.zoomLevel > 0) {
      updateMetadata({ ...metadata, zoomLevel: metadata.zoomLevel - 1 });
    }
  }, [metadata, updateMetadata]);

  useLayoutEffect(() => {
    let squareGrid = metadata.taskGrid;
    if (squareGrid === null) {
      squareGrid = makeGrid(geom, metadata.zoomLevel, {});
    }

    if (mapObj.map.getLayer('grid')) {
      mapObj.map.removeLayer('grid');
    }
    if (mapObj.map.getSource('grid')) {
      mapObj.map.removeSource('grid');
    }
    mapObj.map.addLayer(layerJson(squareGrid));
  }, [metadata, mapObj, smallerSize, largerSize, geom]);

  const buttonStyle = 'white bg-blue-dark';

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark"><FormattedMessage {...messages.step2} /></h3>
      <div>
        <div>
          <p><FormattedMessage {...messages.taskSizes} /></p>
          <div role="group">
            <Button onClick={smallerSize} className={`${buttonStyle} mr2`}>
              <FormattedMessage {...messages.smaller} />
            </Button>
            <Button onClick={largerSize} className={buttonStyle}>
              <FormattedMessage {...messages.larger} />
            </Button>
          </div>
        </div>
        <div className="pt3">
          <p><FormattedMessage {...messages.splitTaskDescription} /></p>
          <div role="group">
            <Button className={`${buttonStyle} mr2`} onClick={splitBbox}>
              <FormattedMessage {...messages.splitByClicking} />
            </Button>
            <Button className={buttonStyle} onClick={splitPolygon}>
              <FormattedMessage {...messages.splitByDrawing} />
            </Button>
            <Button className="bg-red white db mt2" onClick={resetGrid}>
              <FormattedMessage {...messages.reset} />
            </Button>
          </div>
        </div>
        <p><FormattedMessage {...messages.taskNumberMessage} values={{n: metadata.taskNo || 0}} /></p>
        <p>
          <FormattedMessage {...messages.taskAreaMessage} values={{area: metadata.area/metadata.taskNo || 0, sq: <sup>2</sup>}} />
        </p>
      </div>
    </>
  );
}
