import Map, { Source, Layer, Popup, MapRef } from 'react-map-gl';
import { WebMercatorViewport } from 'viewport-mercator-project';
import { useRouter } from 'next/router';
import { TailSpin } from 'react-loader-spinner';
import Card from '../Card/Card';
import MapSearchbar from '../MapSearchbar/MapSearchbar'
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  blockLayer, 
  neighborhoodsLayer, 
  neighborhoodsBordersLayer,
  unclusteredViolationsLayer,
  clusteredViolationsLayer,
  clusterViolationsCountLayer,
  neighborhoodsData,
  censusData,
  violationsData,
  LOW_VIOLATION,
  HIGH_VIOLATION,
}
from './data';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IAddress, ICardPopup, ICoords, IProperties, IViewport, INeighborhoodButton } from '../types'
import { MapEvent, MapSourceDataEvent, ViewStateChangeEvent } from 'react-map-gl/dist/esm/types';
import NeighborhoodSelector from '@components/NeighborhoodSelection/NeighborhoodSelection';
import ColorLegend from "@components/ColorLegend/ColorLegend"


const NewMap = (
) => {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef>(null); // the <Map/> ref

  const [mapLoading, setMapLoading] = useState<boolean>(true) // whether the map is loading
  const [cardPopup, setCardPopup] = useState<ICardPopup | null>(null)
  // const [viewportBounds, setViewportBounds] = useState({ west: null, south: null, east: null, north: null }); // bound of the map
  const [hoveredNeighborhoodFeatureId, setHoveredNeighborhoodFeatureId] = useState<number | string | null>(null) // The feature.id of the neighborhood the mouse is hovering
  const [hoveredNeighborhoodFeatureName, setHoveredNeighborhoodFeatureName] = useState<string | null>(null) // The feature.id of the neighborhood the mouse is hovering
  // const [hoveredBlockFeatureId, setHoveredBlockFeatureId] = useState<number | null>(null) // The feature.id of the neighborhood the mouse is hovering
  const [viewport, setViewport] = useState<IViewport>({
    longitude: -71.0589,
    latitude: 42.3601,
    zoom: 11.5
  });// initial state of viewport (somewhere near back bay...)
  const [mapHeight, setMapHeight] = useState<number | null>(null); // sets the map size depending on the height
  const [neighborhoodButtons, setNeighborhoodButtons] = useState<INeighborhoodButton[]>([])

  // init the map height
  useEffect(() => {
    setMapHeight(window.innerHeight * 0.7);
    const handleResize = () => {
      setMapHeight(window.innerHeight * 0.7);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function calculateFeatureCenter(feature: mapboxgl.MapboxGeoJSONFeature): ICoords{
    // Some neighborhoods areas are multipolygon, others are polygons. I don't know why they created the map like that.
    if(feature.geometry.type === "Polygon"){
      let lnglats = feature.geometry.coordinates[0]
      const total = lnglats.reduce((acc: Array<number>, val: Array<number>) => {
        acc[0] += val[0]; // Accumulate longitude
        acc[1] += val[1]; // Accumulate latitude
        return acc;
      }, [0, 0]); // Initial accumulator value
      const coordinates: ICoords = {
        longitude: total[0]/lnglats.length,
        latitude: total[1]/lnglats.length,
      } 
      return coordinates;
    } else if(feature.geometry.type == "MultiPolygon"){
      let lnglats = feature.geometry.coordinates[0].flat()
      const total = lnglats.reduce((acc: Array<number>, val: Array<number>) => {
        acc[0] += val[0]; // Accumulate longitude
        acc[1] += val[1]; // Accumulate latitude
        return acc;
      }, [0, 0]); // Initial accumulator value
      const coordinates: ICoords = {
        longitude: total[0]/lnglats.length,
        latitude: total[1]/lnglats.length,
      } 
      return coordinates;
    } else {
      throw new Error("Cannot calculate the center of a none-polygon feature!")
    }
  }

  // <Map> onLoad=
  const handleMapLoad = (event: MapEvent<mapboxgl.Map, undefined>) => {
    setMapLoading(false)

    // set up neighborhood buttons
    const allNeighborhoodsFeatures: mapboxgl.MapboxGeoJSONFeature[] = event.target.queryRenderedFeatures(undefined, {layers: ["neighborhoods-fills"]});

    const buttons: INeighborhoodButton[] = allNeighborhoodsFeatures.map((feature, index) => {
      const coordinates = calculateFeatureCenter(feature)
      let neighborhoodName = "NO_NAME"
      const id = feature.id
      try {
        neighborhoodName = feature.properties?.BlockGr202;
      } catch(err) {
        console.error(err)
      }
      return {
        name: neighborhoodName,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        zoom: 14,
        featureId: id
      }
    })
    buttons.sort((button1, button2) => {
      if(button1.name < button2.name) return -1;
      if(button1.name > button2.name) return 1;
      return 0
    })
    setNeighborhoodButtons(buttons)
    console.log("neighborhoods number in current map: ", buttons.length)
  }


  // <Map> onClick=
  const handleMapClick = async (event: any) => {
    const map: mapboxgl.Map = event.target;
    { // violations layer
      const selectedFeatures = event.target.queryRenderedFeatures(event.point, {layers: ["unclustered-violations", "clustered-violations", "cluster-violations-count"]});
      if(selectedFeatures.length > 0)
        console.log("The feature stored in Map is: ", selectedFeatures[0])
      if (selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0] && selectedFeatures[0].source === 'violations') {
        const selectedFeature = selectedFeatures[0];
        console.log(`feature.layer.id: ${selectedFeature.layer.id}`)
        if(selectedFeature.layer.id === "unclustered-violations"){ // a red point is clicked
          if (selectedFeature.properties.SAM_ID !== null) {
            // implement the modal pop-up here changing the state to true
            // alert(`SAM_ID: ${selectedFeature.properties.SAM_ID}`);
            // console.log("DEBUG the type of selectedFeature.properties.addressDetails is", typeof selectedFeature.properties.addressDetails)
            setCardPopup({
              longitude: selectedFeature.geometry.coordinates[0],
              latitude: selectedFeature.geometry.coordinates[1],
              properties: {
                SAM_ID: selectedFeature.properties.SAM_ID,
                VIOLATION_COUNT: selectedFeature.properties.VIOLATION_COUNT,
                addressDetails: (typeof selectedFeature.properties.addressDetails ==="string" ? JSON.parse(selectedFeature.properties.addressDetails) : selectedFeature.properties.addressDetails)
              }
            })
          }
        } else if(selectedFeature.layer.id === "clustered-violations" || selectedFeature.layer.id === "cluster-violations-count" ) { // a yellow cluster is clicked
          if (selectedFeature.properties.cluster_id !== null) {
            // alert(`cluster_id: ${selectedFeature.properties.cluster_id}`)
            const coordinates: ICoords = {
              longitude: selectedFeature.geometry.coordinates[0],
              latitude: selectedFeature.geometry.coordinates[1]
            }
            const vp: IViewport = {
              ...coordinates,
              zoom: 16
            }
            setViewport(vp);
          }
        } 
        return; // do not check the neighborhood if click on a red point
      } 
    }
    { // neighborhood layer
      const selectedFeatures = event.target.queryRenderedFeatures(event.point, {layers: ["neighborhoods-fills"]});
      if(selectedFeatures.length > 0)
        console.log("The feature stored in Map is: ", selectedFeatures[0])
      if (selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0] && viewport.zoom < 13 ) {
        const selectedFeature = selectedFeatures[0];
        console.log(selectedFeature)
        // The data is so weird... Sometimes it's wrapped in an array sometimes it's not.
        const coordinates = calculateFeatureCenter(selectedFeature as mapboxgl.MapboxGeoJSONFeature)
        setViewport({zoom: 14, ...coordinates})
        if(selectedFeature.id != hoveredNeighborhoodFeatureId){
          setHoveredNeighborhoodFeatureId(selectedFeature.id);
          // move to a new one
          setHoveredNeighborhoodFeatureId(selectedFeature.id);
          setHoveredNeighborhoodFeatureName(selectedFeature?.properties?.BlockGr202)
          map.setFeatureState(
            {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: selectedFeature.id,}, 
            {hover: true,}
          );
          map.setFeatureState(
            {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: hoveredNeighborhoodFeatureId ?? undefined,}, 
            {hover: false,}
          );
        }
      }
    }
  }
  
  // <Map> onMove = 
  const handleMapMove = (event: ViewStateChangeEvent<mapboxgl.Map>) => {
    const map: mapboxgl.Map = event.target;
    const nextViewport = event.viewState;
    setViewport(nextViewport); 
  }
  
  // <Map> onMouseMove = 
  const handleMapMouseMove = (event: any) => {
    if(mapLoading === true) return
    const map: mapboxgl.Map = event.target;
    { // neighborhoods-layer
      // const allNeighborhoodFeatures = map.queryRenderedFeatures(undefined, {layers: ["neighborhoods-fills"]} );
      const selectedFeatures = map.queryRenderedFeatures(event.point, {layers: ["neighborhoods-fills"]});
      if(selectedFeatures && selectedFeatures.length > 0 && selectedFeatures[0]) {
        const selectedFeature = selectedFeatures[0]; // the selected neighborhood feature.
        // allNeighborhoodFeatures.map((neighborhoodFeature, index) => {
        //   map.setFeatureState(
        //     {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: neighborhoodFeature.id,}, 
        //     {hover: false,}
        //   );
        // })
        if (hoveredNeighborhoodFeatureId === null){
          // console.log(1)
          setHoveredNeighborhoodFeatureId(selectedFeature.id ?? null)
          setHoveredNeighborhoodFeatureName(selectedFeature?.properties?.BlockGr202)
          map.setFeatureState(
            {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: selectedFeature.id,}, 
            {hover: true,}
          );
        } else if (hoveredNeighborhoodFeatureId !== null && hoveredNeighborhoodFeatureId === selectedFeature.id){
          // console.log(2)
          // remains in the same neighborhood.
          setHoveredNeighborhoodFeatureId(selectedFeature.id ?? null)
          setHoveredNeighborhoodFeatureName(selectedFeature?.properties?.BlockGr202)
          map.setFeatureState(
            {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: selectedFeature.id,}, 
            {hover: true,}
          );
        } else if (hoveredNeighborhoodFeatureId !== null && hoveredNeighborhoodFeatureId !== selectedFeature.id){
          // console.log(3)
          // move to a new one
          setHoveredNeighborhoodFeatureId(selectedFeature.id ?? null);
          setHoveredNeighborhoodFeatureName(selectedFeature?.properties?.BlockGr202)
          map.setFeatureState(
            {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: selectedFeature.id ?? undefined,}, 
            {hover: true,}
          );
          map.setFeatureState(
            {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: hoveredNeighborhoodFeatureId ?? undefined,}, 
            {hover: false,}
          );
        }
      } else if(hoveredNeighborhoodFeatureId) { // when user move the mouse out of boston
        // allNeighborhoodFeatures.map((neighborhoodFeature, index) => {
        //   map.setFeatureState(
        //     {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: neighborhoodFeature.id,}, 
        //     {hover: false,}
        //   );
        // })
        map.setFeatureState(
          {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: hoveredNeighborhoodFeatureId,}, 
          {hover: false,}
        );
      
        
        setHoveredNeighborhoodFeatureId(null)
        setHoveredNeighborhoodFeatureName(null)
      }
    }
    { // violations layer
      const selectedFeatures = map.queryRenderedFeatures(event.point, {layers: ["unclustered-violations"]});
      if(selectedFeatures && selectedFeatures.length > 0){
        map.getCanvas().style.cursor = 'pointer'; // Change cursor to pointer
      } else {
        map.getCanvas().style.cursor = ''; // Change cursor to pointer
      }
    }
  }

  // <Map> onMapZoom = 
  const handleMapZoom = (event: ViewStateChangeEvent<mapboxgl.Map>) => {
    // TODO
    const map: mapboxgl.Map = event.target;
  }
  
  
  // <Map> onMouseLeave =
  const handleMapMouseLeave = (event: any) => {
    // TODO
    const map: mapboxgl.Map = event.target;
    const allNeighborhoodFeatures = map.queryRenderedFeatures(undefined, {layers: ["neighborhoods-fills"]} )
    allNeighborhoodFeatures.map((neighborhoodFeature, index) => {
      map.setFeatureState(
        {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: neighborhoodFeature.id,}, 
        {hover: false,}
      );
    })
    setHoveredNeighborhoodFeatureId(null)
    setHoveredNeighborhoodFeatureName(null)
  }

  // <Map> onSourceData = 
  const handleMapOnSourceData = (event: MapSourceDataEvent<mapboxgl.Map>) => {
    const map: mapboxgl.Map = event.target;
    if (event.sourceId == "violations" && mapRef.current) {
      const isViolationsSourceLoaded = mapRef?.current?.isSourceLoaded("violations");
      setMapLoading(mapLoading && !isViolationsSourceLoaded)
    }
  }

  return(
    <>
      <div style={{position: 'relative', width: '100%', height: mapHeight? mapHeight: 10 }}>
        {/* The `Loading...` Spinner */}
        {mapLoading && <div className='z-50' style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)', // Light overlay, adjust as needed
          }}>
            <TailSpin color="#00BFFF" height={80} width={80} />
          </div>}
        {/* The Map Container*/}
        <div className="relative" ref={mapContainerRef} style={{ width: '100%', height: mapHeight? mapHeight: 10 }}>
          <Map
            {...viewport}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
            onMove={handleMapMove}
            onMouseMove={handleMapMouseMove}
            onZoom={handleMapZoom}
            onSourceData={handleMapOnSourceData}
            onMouseLeave={handleMapMouseLeave}
            ref={mapRef}
            style={{
              width: '100%',
              height: mapHeight? mapHeight : 10
            }}
            mapStyle="mapbox://styles/mapbox/streets-v12" // street mode
            // mapStyle="mapbox://styles/mapbox/satellite-v" // satellite mode
            mapboxAccessToken="pk.eyJ1Ijoic3BhcmstYmFkbGFuZGxvcmRzIiwiYSI6ImNsaWpsMXc3ZTA4MGszZXFvaDBrc3I0Z3AifQ.mMM7raXYPneJfzyOoflFfQ"
          >
            {/* Map config */}
            <Source id="census" type="vector" url={censusData.url} >
              <Layer {...blockLayer} />
            </Source>
            <Source id="neighborhoods" type="vector" url={neighborhoodsData.url} >
              <Layer {...neighborhoodsLayer} />
              <Layer {...neighborhoodsBordersLayer} />
            </Source>
            <Source 
              id='violations' 
              type='geojson' 
              data={violationsData.url}
              cluster={true}
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              <Layer {...clusteredViolationsLayer} />
              <Layer {...clusterViolationsCountLayer} />
              <Layer {...unclusteredViolationsLayer} />
            </Source>
            {/* Searchbar */}
            <section style={{ position: 'relative', top: 30, left: 30}}>
              <MapSearchbar
                viewport={viewport}
                setViewport={setViewport}
              />
            </section>
            {/* Current neighborhood name */}
            {hoveredNeighborhoodFeatureName && <section className='absolute top-5 left-1/2 -translate-x-1/2 z-10 bg-white bg-opacity-80 p-2 rounded-lg shadow-md'>
              <p className="text-lg font-lora text-center text-neighborhood-dark-blue">
                {hoveredNeighborhoodFeatureName}
              </p>
            </section>}
            {/* The neighborhood buttons */}
            <section className="absolute top-5 right-5 z-10 bg-white p-4 rounded-lg shadow-md">
              <NeighborhoodSelector
                neighborhoodButtons={neighborhoodButtons}
                setViewport={setViewport}
                mapRef={mapRef}
                hoveredNeighborhoodFeatureId={hoveredNeighborhoodFeatureId}
                setHoveredNeighborhoodFeatureId={setHoveredNeighborhoodFeatureId}
                setHoveredNeighborhoodFeatureName={setHoveredNeighborhoodFeatureName}
              />
            </section>
            {/* The color legend */}
            <section className="absolute bottom-5 left-5 z-10 bg-white p-4 rounded-lg shadow-md">
              <ColorLegend
                lowViolation={LOW_VIOLATION}
                highViolation={HIGH_VIOLATION}
              />
            </section>
            {/* Popup */}
            <section>
            { cardPopup && 
              <Popup
              // MUST add a key here. Or else Mapbox will destroy the Popup.
              // which prevent the next popup from showing up (how terrible!)
                key={(cardPopup.latitude + cardPopup.longitude)*0.5*(cardPopup.latitude + cardPopup.longitude + 1) + cardPopup.longitude}
                latitude={cardPopup.latitude}
                longitude={cardPopup.longitude}
                closeButton={false}
                closeOnClick={true}
                anchor="top"
              >
                <Card 
                  properties={cardPopup.properties} 
                />
              </Popup>}
            </section>
          </Map>
        </div>
      </div>
    </>
  )
}

export default NewMap;