import React, { useEffect, useState, useRef} from 'react';
import { useRouter} from 'next/router';
import { IAddress, ICoords, IViewport } from '@components/types';

function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: NodeJS.Timeout | null = null;
  
    return (...args: any[]) => {
        const later = () => {
            timeout = null;
            func(...args);
        };
  
        if (timeout) {
            clearTimeout(timeout);
        }
  
        timeout = setTimeout(later, wait);
    };
  }


const MapSearchbar = ({ viewport, setViewport } : {
    viewport: IViewport,
    setViewport: React.Dispatch<React.SetStateAction<IViewport>>
}) => {
    const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
    const [addressSuggestions, setAddressSuggestions] = useState<IAddress[]>([]);
    const [searchAddress, setSearchAddress] = useState<string>('');
    
    const inputRef = useRef(null); // reference for searchbox
    const suggestionsRef = useRef(null); // reference for suggestions

    const fetchAddressSuggestions = async (searchAddress: string) => {
        try {
            const res = await fetch(`/api/addresses?search=${searchAddress}`);
            if (res.ok) {
                const suggestions = await res.json();
                setAddressSuggestions(suggestions);
            }
        } catch (error) {
            console.error(error);
        }
      };
      
      const debouncedFetchAddressSuggestions = debounce((searchAddress) => {
        fetchAddressSuggestions(searchAddress);
      }, 300);
    
      // handle search update
      const handleSearchUpdate: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const value = event.target.value;
        setSearchAddress(value);
        if (value.length > 2) {
            debouncedFetchAddressSuggestions(value);
        } else {
            setAddressSuggestions([]);
        }
      };
    
      // Onclick search button
      // finds the address if input length is longer than 2
      const handleSearchClick = async () => {
        if (searchAddress.length > 2) {
            await fetchAddressSuggestions(searchAddress);
        } else {
            setAddressSuggestions([]);
        }
      };
    
      const handleAddressSelection = async (address: IAddress) => {
        setSelectedAddress(address);
        try {
            alert(address.X_COORD + " " + address.Y_COORD)
            const fullAddress = `${address.FULL_ADDRESS}, ${address.MAILING_NEIGHBORHOOD}, ${address.ZIP_CODE}`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullAddress}`);
            const data = await response.json();
            console.log("DEBUG", data)
            
            if (data.length > 0) {
                const latitude = parseFloat(data[0].lat);
                const longitude = parseFloat(data[0].lon);

    
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    console.log(latitude, "xxxxxx", longitude)  
                    setViewport({
                        latitude: latitude,
                        longitude: longitude,
                        zoom: viewport.zoom
                    });
                }
            } else {
                alert(`nominatim.openstreetmap.org can't find this address!`);
            }
        } catch (error) {
            console.error('Error:', error);
        }
      };
    return (
          <div className="h-9 bg-white w-1/4 rounded" >
            <div className="flex items-center">
              <img src="/search-icon.svg" alt="saerch-icon" className="inline mx-2" />
              <input
                ref={inputRef}
                type="text"
                value={searchAddress}
                onClick={handleSearchClick}
                onChange={handleSearchUpdate}
                placeholder="Search for an address"
                className="w-full py-2 px-1 rounded focus:outline-none placeholder:text-[#58585B] "
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              />
            </div>
            {addressSuggestions.length > 0 && (
              <ul ref={suggestionsRef} className="absolute mt-1 w-1/4 bg-white border border-gray-300 z-10">
                  {addressSuggestions.map((address, index) => (
                      <li 
                          key={index} 
                          onClick={() => {
                              setSearchAddress(`${address.FULL_ADDRESS}, ${address.MAILING_NEIGHBORHOOD}, ${address.ZIP_CODE}`);
                              setAddressSuggestions([]);
                              handleAddressSelection(address);
                          }}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                          {address.FULL_ADDRESS}, {address.MAILING_NEIGHBORHOOD}, {address.ZIP_CODE}
                      </li>
                  ))}
              </ul>
            )}
          </div>
    )
};

export default MapSearchbar;