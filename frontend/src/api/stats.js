import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

import { fetchExternalJSONAPI } from '../network/genericJSONRequest';
import api from './apiClient';
import { OHSOME_STATS_BASE_URL } from '../config';

const ohsomeProxyAPI = (url) => {
  const token = localStorage.getItem('token');
  return api(token).get(`users/statistics/ohsome/?url=${url}`);
};

export const useSystemStatisticsQuery = () => {
  const fetchSystemStats = ({ signal }) => {
    return api().get(`system/statistics/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['tm-stats'],
    queryFn: fetchSystemStats,
    useErrorBoundary: true,
  });
};

export const useProjectStatisticsQuery = (projectId) => {
  const fetchProjectStats = ({ signal }) => {
    return api().get(`projects/${projectId}/statistics/`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['project-stats'],
    queryFn: fetchProjectStats,
    select: (data) => data.data,
  });
};

export const useOsmStatsQuery = () => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(`${OHSOME_STATS_BASE_URL}/stats/hotosm-project-%2A`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
    select: (data) => data.data.result,
  });
};

export const useOsmHashtagStatsQuery = (defaultComment) => {
  const fetchOsmStats = ({ signal }) => {
    return api().get(`${OHSOME_STATS_BASE_URL}/stats/${defaultComment[0].replace('#', '')}`, {
      signal,
    });
  };

  return useQuery({
    queryKey: ['osm-hashtag-stats'],
    queryFn: fetchOsmStats,
    useErrorBoundary: true,
    enabled: Boolean(defaultComment?.[0]),
    select: (data) => data.data.result,
  });
};

export const useUserOsmStatsQuery = (id) => {
  const fetchUserOsmStats = () => {
    const token = localStorage.getItem('token');
    // return ohsomeProxyAPI(
    //   `${OHSOME_STATS_BASE_URL}/topic/poi,highway,building,waterway/user?userId=${id}`,
    // );
    return axios.get(
      `https://tm.naxa.com.np/api/v2/users/statistics/ohsome/?url=${OHSOME_STATS_BASE_URL}/topic/poi,highway,building,waterway/user?userId=${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  };

  return useQuery({
    queryKey: ['user-osm-stats'],
    queryFn: fetchUserOsmStats,
    useErrorBoundary: true,
    select: (data) => data.data.result,
    enabled: !!id,
  });
};

export const useOsmStatsMetadataQuery = () => {
  const fetchOsmStatsMetadata = () => {
    return fetchExternalJSONAPI(`${OHSOME_STATS_BASE_URL}/metadata`, true);
  };

  return useQuery({
    queryKey: ['osm-stats-metadata'],
    queryFn: fetchOsmStatsMetadata,
    useErrorBoundary: true,
    select: (data) => data.result,
  });
};
