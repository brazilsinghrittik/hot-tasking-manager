import React, { useEffect, useState } from 'react';
import { Chart } from 'react-charts';
import ReactPlaceholder from 'react-placeholder';
import { nCardPlaceholders } from './partnersActivityPlaceholder';
import result from './activity.json';
import Bar from './graphicsHorizontalBar';

export const Activity = ({ activity }) => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        'https://stats.now.ohsome.org/api/stats/hashtags/accenture,dublinacn19,acngraddublin19,acnfy22,acnfy23',
      );

      if (response.ok) {
        const jsonData = await response.json();
        const formattedData = formatData(jsonData.result, 10); // Limitar a las primeras 10 empresas
        setData(formattedData);
      } else {
        console.error('Error al obtener los datos:', response.statusText);
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
    }
  };

  const formatData = (rawData, limit) => {
    const groupedData = {};

    Object.keys(rawData).forEach((primary, index) => {
      if (index >= limit) return;
      Object.entries(rawData[primary]).forEach(([secondary, value]) => {
        if (secondary !== 'latest' && secondary !== 'changesets' && secondary !== 'users') {
          if (!groupedData[secondary]) {
            groupedData[secondary] = [];
          }

          groupedData[secondary].push({
            primary: primary,
            secondary: typeof value === 'string' ? parseFloat(value) : value,
          });
        }
      });
    });

    const formattedData = Object.entries(groupedData).map(([action, values]) => ({
      label: action,
      data: values,
    }));

    return formattedData;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="graphics-container">
      {data &&
        data.map((dataItem, index) => (
          <div className="pv3-l pv2 mb3-l mb2 shadow-4 bg-white">
            <Bar data={[dataItem]} />
          </div>
        ))}
    </div>
  );
};
