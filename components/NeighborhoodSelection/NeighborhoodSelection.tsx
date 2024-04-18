import React, { useState } from 'react';
import { INeighborhoodButton, IViewport } from '@components/types';
import { MapRef } from 'react-map-gl';

function NeighborhoodSelector(
    { neighborhoodButtons, setViewport, mapRef, hoveredNeighborhoodFeatureId, setHoveredNeighborhoodFeatureId, setHoveredNeighborhoodFeatureName } :
    { 
        neighborhoodButtons: INeighborhoodButton[],
        setViewport: React.Dispatch<React.SetStateAction<IViewport>>,
        mapRef: React.RefObject<MapRef>,
        hoveredNeighborhoodFeatureId: number | string | null,
        setHoveredNeighborhoodFeatureId: React.Dispatch<React.SetStateAction<number | string | null>>,
        setHoveredNeighborhoodFeatureName: React.Dispatch<React.SetStateAction<string | null>>
    }

) {
  const [currentPage, setCurrentPage] = useState(1);
  const buttonsPerPage = 8; // Number of buttons per page

  // Calculate the number of pages
  const pageCount = Math.ceil(neighborhoodButtons.length / buttonsPerPage);

  // Get the buttons for the current page
  const indexOfLastButton = currentPage * buttonsPerPage;
  const indexOfFirstButton = indexOfLastButton - buttonsPerPage;
  const currentButtons = neighborhoodButtons.slice(indexOfFirstButton, indexOfLastButton);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div>
      <p className="mb-2 mx-4 text-center font-bold font-montserrat text-xl">
        NEIGHBORHOODS
      </p>
      {currentButtons.map((buttonData, index) => (
        <div key={index}>
          <button
            onClick={() => {
              setViewport({
                latitude: buttonData.latitude,
                longitude: buttonData.longitude,
                zoom: buttonData.zoom
              });
              if (mapRef?.current) {
                hoveredNeighborhoodFeatureId && mapRef?.current.setFeatureState(
                    {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: hoveredNeighborhoodFeatureId,}, 
                    {hover: false,}
                  );
                  mapRef?.current.setFeatureState(
                    {source: 'neighborhoods', sourceLayer: 'census2020_bg_neighborhoods-5hyj9i',id: buttonData.featureId}, 
                    {hover: true,}
                  );
                  setHoveredNeighborhoodFeatureId(buttonData.featureId ?? null)
                  setHoveredNeighborhoodFeatureName(buttonData.name)
              }
            }}
            className="mb-2 py-1 px-4 bg-white-500 text-neighborhood-dark-blue font-lora rounded shadow-md hover:bg-gray-400 border-0.5 border-neighborhood-dark-blue focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-75"
          >
            {buttonData.name}
          </button>
        </div>
      ))}
      <div className="flex justify-center mt-4">
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`px-3 py-1 mx-1 ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default NeighborhoodSelector;
