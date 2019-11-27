import React, { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { layerJson } from './setTaskSizes';
import { Button } from '../button';

const clipProject = (clip, metadata, map, updateMetadata) => {
  const taskGrid = metadata.tempTaskGrid;
  const geom = metadata.geom.features[0].geometry;
  let intersect_array = [];

  taskGrid.features.forEach(f => {
    let poly = turf.polygon(f.geometry.coordinates[0]);
    let contains = turf.intersect(geom, poly);
    if (contains === null) {
      return;
    }

    let feature = f;
    if (clip === true) {
      feature = turf.multiPolygon([contains.geometry.coordinates], f.properties);
    }
    intersect_array.push(feature);
  });

  const grid = turf.featureCollection(intersect_array);
  updateMetadata({ ...metadata, tasksNo: grid.features.length, taskGrid: grid });
};

export default function TrimProject({ metadata, mapObj, updateMetadata }) {
  useEffect(() => {
    if (mapObj.map.getLayer('grid')) {
      mapObj.map.removeLayer('grid');
    }
    if (mapObj.map.getSource('grid')) {
      mapObj.map.removeSource('grid');
    }
    mapObj.map.addLayer(layerJson(metadata.taskGrid));
  }, [metadata, mapObj]);

  const [clipStatus, setClipStatus] = useState(false);

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark"><FormattedMessage {...messages.step3} /></h3>
      <div>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine1} />
        </p>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine2} />
        </p>
        <input
          type="checkbox"
          className="v-mid"
          defaultChecked={clipStatus}
          onChange={() => setClipStatus(!clipStatus)}
        />
        <span className="pl2 v-mid"><FormattedMessage {...messages.trimToAOI} /></span>
        <div className="pt2">
          <Button
            onClick={() => clipProject(clipStatus, metadata, mapObj.map, updateMetadata)}
            className="white bg-blue-dark"
          >
            <FormattedMessage {...messages.trim} />
          </Button>
        </div>
      </div>
    </>
  );
}
