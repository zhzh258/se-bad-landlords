export const censusData: any = {
  type: 'vector',
  url: 'mapbox://spark-badlandlords.cxyyru86'
}

// block data and layers
// fills each neighborhoods
export const blockLayer: any = {
  id: 'census-block-layer',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://spark-badlandlords.cxyyru86'
  },
  'source-layer': 'census2020_tracts-4u84f2',
  paint: {
    'fill-color': 'red',
    'fill-outline-color': 'red',
    // 'fill-opacity': [
    //   'case',
    //   ['boolean', ['feature-state', 'hover'], false],
    //   0.6,
    //   0
    // ]
    'fill-opacity': 0
  }
}

// neighborhoods data and layers
// out lines the neighborhoods by changing color values of paint
export const neighborhoodsData: any = {
  type: 'vector',
  url: 'mapbox://spark-badlandlords.8o9j3v7f'
}
export const neighborhoodsLayer: any = {
  id: 'neighborhoods-fills',
  type: 'fill',
  source: 'neighborhoodsData',
  'source-layer': 'census2020_bg_neighborhoods-5hyj9i',
  layout: {},
  paint: {
    'fill-color': '#add8e6',
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.6,
      0
    ]
    // 'fill-opacity': 0
  }
}
export const neighborhoodsBordersLayer: any = {
  id: 'neighborhoods-borders',
  type: 'line',
  source: 'neighborhoodsData',
  'source-layer': 'census2020_bg_neighborhoods-5hyj9i',
  layout: {},
  paint: {
    'line-color': 'blue',
    'line-width': 0.5
  },
}

// violations data and layers
// change the url to one of map-point api to fetch data points
/*
  const geoJson = {
    type: "FeatureCollection",
    features: results.map((row: RowData) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.longitude, row.latitude],
      },
      properties: {
        SAM_ID: row.sam_id
      },
    })),
  };
*/
export const violationsData: any = {
  type: 'geojson',
  url: '/api/geojson/map-points3'
}

// small dots indicating individual points of the map styles
export const unclusteredViolationsLayer: any = {
  id: 'unclustered-violations',
  type: 'circle',
  source: 'violationsData',
  filter: [
    '!',
    ['has', 'point_count']
  ] as ['!', ['has', 'point_count']],
  
  paint: {
    'circle-color': [
      'interpolate',
      ['linear'],
      ['to-number', ['get', 'VIOLATION_COUNT']],
      1, '#FFFFBF',    // Yellow at low VIOLATION_COUNT (e.g., VIOLATION_COUNT = 1)
      15, '#FF2E00'    // Red at high VIOLATION_COUNT   (e.g., VIOLATION_COUNT = 100)
    ],
    'circle-radius': 6,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#FFFFFF',
    'circle-stroke-opacity': 0.4
  }
}

// clustered circles styles
export const clusteredViolationsLayer: any = {
  id: 'clustered-violations',
  type: 'circle',
  source: 'violationsData',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#F9E1AC', 100, '#F09DB1', 750, '#7CE4C9'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    'circle-stroke-width': 2,
    'circle-stroke-color': ['step', ['get', 'point_count'], '#FFD166', 100, '#EF476F', 750, '#06D6A0']
  }
}
export const clusterViolationsCountLayer: any = {
  id: 'cluster-violations-count',
  type: 'symbol',
  source: 'violationsData',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['Montserrat Bold', 'Arial Unicode MS Bold'],
    'text-size': 13
  }
}
