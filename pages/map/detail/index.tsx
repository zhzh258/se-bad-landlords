import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useSearchAPI, IAddress } from '../../api/search';

interface IViolation {
    code: string;
    longitude: string;
    sam_id: string;
    status_dttm: string;
    latitude: string;
    status: string;
    description: string;
    case_no: string;
}

interface ILandlord {
    OWNER: string;
}

function DetailPage() {
    const router = useRouter();
    const [addressObj, setAddressObj] = useState<IAddress | null>(null);
    const [violations, setViolations] = useState<IViolation[]>([]);
    const [units, setUnits] = useState<IAddress[]>([]); 
    const [landlords, setLandlords] = useState<ILandlord[]>([]); 
    const [expandTableVisible_st, setexpandTableVisible_st] = useState(false);
    const [expandTableVisible_un, setexpandTableVisible_un] = useState(false);
    const [expandTableVisible_la, setexpandTableVisible_la] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null); 
    const suggestionsRef = useRef<HTMLUListElement>(null);
    const expandTableRef = useRef<HTMLTableSectionElement>(null); 

    const {
        searchAddress,
        addressSuggestions,
        handleSearchUpdate,
        handleSearchClick,
        setSearchAddress,
        setAddressSuggestions
    } = useSearchAPI();

    const handleAddressSelection = async (address: IAddress) => {
        // setSelectedAddress(address);
        console.log(address.FULL_ADDRESS)
        const res = (await fetch(`/api/address?search=${address.FULL_ADDRESS}`));
        if (!res.ok) {
            // throw new Error('Network response was not ok.');
            const addressString = JSON.stringify(address);
            const encodedAddress = encodeURIComponent(addressString);
            router.push(`/map/detail?address=${encodeURIComponent(encodedAddress)}`);
        }
        else {
            const generalAddress = await res.json();

            const addressString = JSON.stringify(generalAddress[0]);
            const encodedAddress = encodeURIComponent(addressString);
            router.push(`/map/detail?address=${encodeURIComponent(encodedAddress)}`);
        }
        
    };

    useEffect(() => {
        if (router.isReady) {
            const address = router.query.address;
            const addressString = Array.isArray(address) ? address[0] : address;
            
            try {
                const decodedAddress = decodeURIComponent(addressString || '');
                setAddressObj(JSON.parse(decodedAddress));
                // fetch violations
                fetchViolations(JSON.parse(decodedAddress).SAM_ADDRESS_ID);

                // Add '#' to the address before fetching associated units
                const generalAddress = JSON.parse(decodedAddress).FULL_ADDRESS;
                const addressWithHash = generalAddress + ' #';
                fetchAssociatedUnits(addressWithHash);

                fetchAssociatedLandlords(JSON.parse(decodedAddress).PARCEL);
            } catch (error) {
                console.error("Error parsing address:", error);
                setAddressObj(null);
            }
        }
    }, [router.isReady, router.query.address]);

    const fetchViolations = async (sam_id: string) => {
        try {
            const res = await fetch(`/api/violations?sam_id=${sam_id}`);
            if (!res.ok) {
                throw new Error('Network response was not ok.');
            }
            const data = await res.json();
            setViolations(data);
            console.log("data:" + data);
        } catch (error) {
            setViolations([]);
            console.error(error);
        }
    };

    const fetchAssociatedUnits = async (generalAddress: string) => {
        try {
            const res = await fetch(`/api/addresses?search=${generalAddress}`);
            if (res.ok) {
                const unitsData = await res.json();
                setUnits(unitsData);
            } else {
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            setUnits([]);
            console.error(error);
        }
    };

    const fetchAssociatedLandlords = async (ParcelID: string) => {
        try {
            console.log(ParcelID);
            const res = await fetch(`/api/landlords/by-pid?pid=${ParcelID}`);
            if (res.ok) {
                const landlordsData = await res.json();
                console.log(landlordsData);
                // setLandlords(landlordsData);
                // console.log(landlords);
                const filteredLandlords = landlordsData.filter((a, index, arr) => 
                    !arr.some((b, bIndex) => bIndex !== index && b.OWNER.includes(a.OWNER))
                );
                setLandlords(filteredLandlords);
                console.log(landlords);
            } else {
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            setLandlords([]);
            console.error(error);
        }
    };

    if (!addressObj) {
        return <div>Loading...</div>;
    }

    const toggleTableVisibility_st = () => {
        setexpandTableVisible_st(!expandTableVisible_st);
    };

    const toggleTableVisibility_un = () => {
        setexpandTableVisible_un(!expandTableVisible_un);
    };

    const toggleTableVisibility_la = () => {
        setexpandTableVisible_la(!expandTableVisible_la);
    };

    function violationColor(violation: IViolation) {
        if (violation.code.includes('527') || violation.code.includes('780')) {
            return 'text-red-500';
        } else {
            return 'text-gray-900'; 
        }
    }

    return (
        <div className="px-10 relative">
            <div className='h-20 flex justify-center items-center'>
                <div className="h-10 bg-white justify-center w-full rounded">
                    <div className="flex items-center">
                        <img src="/search-icon.svg" alt="saerch-icon" className="inline mx-2" />
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={searchAddress} 
                            onClick={handleSearchClick}
                            onChange={handleSearchUpdate} 
                            placeholder="Search for an address" 
                            className="w-full py-2 px-1 rounded focus:outline-none placeholder:text-[#58585B]"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                        />

                    </div>
                    {addressSuggestions.length > 0 && (
                        <ul ref={suggestionsRef} className="z-20 absolute mt-1 w-5/6 bg-white border border-gray-300 z-10">
                            {addressSuggestions.map((address, index) => {
                                // Extract general address by removing everything after '#' symbol (if exists)
                                const generalAddress = address.FULL_ADDRESS.split(' #')[0];
                    
                                return (
                                    <li 
                                        key={index} 
                                        onClick={() => {
                                            // Set search address as general address
                                            setSearchAddress(`${generalAddress}, ${address.MAILING_NEIGHBORHOOD}, ${address.ZIP_CODE}`);
                                            setAddressSuggestions([]);
                                            // Handle the general address selection
                                            handleAddressSelection({ ...address, FULL_ADDRESS: generalAddress });
                                        }}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        {address.FULL_ADDRESS}, {address.MAILING_NEIGHBORHOOD}, {address.ZIP_CODE}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    
                </div>
            </div>
            <div className="flex flex-col items-start justify-center h-full w-full">
                <div className="text-black font-bold text-6xl mb-5">
                    {addressObj.FULL_ADDRESS},<br/>
                    {addressObj.MAILING_NEIGHBORHOOD}, MA, {addressObj.ZIP_CODE}
                </div>
                <div className="text-grey font-['Lora'] text-l">
                    Explore this page to find violations associated with <br/>
                    {addressObj.FULL_ADDRESS} and the landlord associated 
                </div>
                <div className="h-7"></div>
            </div>

            {/* street violations table */}
            <div className="max-w-full overflow-x-auto">
                <div className="text-lg text-white font-semibold py-2 px-4 bg-[#c8a992]">
                    {addressObj.FULL_ADDRESS} VIOLATIONS
                </div>
                <table className="min-w-full leading-normal text-center">
                    <thead>
                        <tr>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                 
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                SAM ID
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                CODE VIOLATION
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                CASE NUMBER
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                DESCRIPTION
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                LAST ISSUED
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                NOTES
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white text-3xl text-right">
                                <button onClick={toggleTableVisibility_st} className={`font-bold ${expandTableVisible_st ? 'transform rotate-90' : ''}`}>{"›"}</button>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className={`${violations.length > 0? violationColor(violations[0]): "text-gray-900"} whitespace-no-wrap`}>{violations.length > 0 ? violations[0].sam_id : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className={`${violations.length > 0? violationColor(violations[0]): "text-gray-900"} whitespace-no-wrap`}>{violations.length > 0 ? violations[0].code : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className={`${violations.length > 0? violationColor(violations[0]): "text-gray-900"} whitespace-no-wrap`}>{violations.length > 0 ? violations[0].case_no : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className={`${violations.length > 0? violationColor(violations[0]): "text-gray-900"} whitespace-no-wrap`}>{violations.length > 0 ? violations[0].description : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className={`${violations.length > 0? violationColor(violations[0]): "text-gray-900"} whitespace-no-wrap`}>{violations.length > 0 ? violations[0].status_dttm.split(" ")[0] : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className={`${violations.length > 0? violationColor(violations[0]): "text-gray-900"} whitespace-no-wrap`}>{violations.length > 0 ? violations[0].status : ""}</p>
                            </td>
                        </tr>
                    </tbody>
                    {expandTableVisible_st && violations.length > 1 && (
                    // <div className="absolute left-0 w-full">
                        //  {/* <table className="min-w-full leading-normal text-center"> */}
                            <tbody ref={expandTableRef} >
                                {violations.slice(1).map((violation, index) => (
                                    <tr
                                        key={index}>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <button className="font-bold"></button>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className={`${ violationColor(violation) } whitespace-no-wrap`}>{violation.sam_id}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className={`${ violationColor(violation) } whitespace-no-wrap`}>{violation.code}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className={`${ violationColor(violation) } whitespace-no-wrap`}>{violation.case_no}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className={`${ violationColor(violation) } whitespace-no-wrap`}>{violation.description}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className={`${ violationColor(violation) } whitespace-no-wrap`}>{violation.status_dttm.split(" ")[0]}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className={`${ violationColor(violation) } whitespace-no-wrap`}>{violation.status}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        //  {/* </table> */}
                    // </div>
                )}
                </table>
            </div>

            <div className="h-11"></div>
            {/* Assosiate units table */}
            <div className="max-w-full overflow-x-auto">
                <div className="text-lg text-white font-semibold py-2 px-4 bg-[#c8a992]">
                    Associated Units
                </div>
                <table className="min-w-full leading-normal text-center">
                    <thead>
                        <tr>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                 
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                SAM ID
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                FULL ADDRESS
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                MAILING NEIGHBORHOOD
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                ZIP CODE
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                PARCEL
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white text-3xl text-right">
                                <button onClick={toggleTableVisibility_un} className={`font-bold ${expandTableVisible_un ? 'transform rotate-90' : ''}`}>{"›"}</button>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{units.length>0?units[0].SAM_ADDRESS_ID:""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{units.length>0 ? units[0].FULL_ADDRESS : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{units.length>0 ? units[0].MAILING_NEIGHBORHOOD : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{units.length>0 ? units[0].ZIP_CODE : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{units.length>0 ? units[0].PARCEL : ""}</p>
                            </td>
                        </tr>
                    </tbody>
                    {expandTableVisible_un && units.length > 1 && (
                    // <div className="absolute left-0 w-full">
                        //  {/* <table className="min-w-full leading-normal text-center"> */}
                            <tbody ref={expandTableRef} >
                                {units.slice(1).map((unit, index) => (
                                    <tr
                                        key={index}>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <button className="font-bold"></button>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{unit.SAM_ADDRESS_ID}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{unit.FULL_ADDRESS}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{unit.MAILING_NEIGHBORHOOD}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{unit.ZIP_CODE}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{unit.PARCEL}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        //  {/* </table> */}
                    // </div>
                )}
                </table>
            </div>

            <div className="h-11"></div>
            <div className="text-black font-bold text-4xl mb-2">
                LANDLORD ASSOCIATED
            </div>
            <hr style={{ width: '100%', borderTop: '6px solid black' }} />
            <div className="h-11"></div>

            {/* Landlord Boxes */}
            {landlords.map((landlord, index) => (
                <div key={index} className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
                        <div className="flex-1 p-4 bg-white border rounded">
                            <h2 className="text-2xl font-bold">{landlord.OWNER}</h2>
                            {/* <p className="text-lg">Landlord Address: 100 Charles Street</p>
                            <p className="mt-2">100 addresses in total</p>
                            <p className="text-blue-600">64 properties without violations</p>
                            <p className="text-red-600">37 properties with violations</p> */}
                            <p className="text-lg">xxx: xxx</p>
                            <p className="mt-2">xxxxxx</p>
                            <p className="text-blue-600">xxxxxx</p>
                            <p className="text-red-600">xxxxxx</p>
                        </div>

                        <div className="flex-1 p-4 rounded">
                            <h2 className="text-2xl font-bold text-orange-600">DISCLAIMER</h2>
                            <p>{landlord.OWNER} was once a Landlord of {addressObj.FULL_ADDRESS}</p>
                        </div>
                    </div>
                </div>
            ))}
            <div className="h-11"></div>

            

{/*             
            <div className="max-w-full overflow-x-auto">
                <div className="text-lg text-white font-semibold py-2 px-4 bg-[#c8a992]">
                    LANDLORD VIOLATIONS
                </div>
                <table className="min-w-full leading-normal text-center">
                    <thead>
                        <tr>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                 
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                NUMBER
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                DESCRIPTION
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                LAST ISSUED
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                NOTES
                            </th>
                            <th className="px-2 py-3 border-b-2 border-gray-200 bg-white text-center font-bold text-gray-600 uppercase tracking-wider">
                                SAM ID
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white text-3xl text-right">
                                <button onClick={toggleTableVisibility_la} className={`font-bold ${expandTableVisible_la ? 'transform rotate-90' : ''}`}>{"›"}</button>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{violations.length > 0 ? violations[0].case_no : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{violations.length > 0 ? violations[0].description : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{violations.length > 0 ? violations[0].status_dttm.split(" ")[0] : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{violations.length > 0 ? violations[0].status : ""}</p>
                            </td>
                            <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                <p className="text-gray-900 whitespace-no-wrap">{violations.length > 0 ? violations[0].sam_id : ""}</p>
                            </td>
                        </tr>
                    </tbody>
                    {expandTableVisible_la && violations.length > 1 && (
                    // <div className="absolute left-0 w-full">
                        //  <table className="min-w-full leading-normal text-center">
                            <tbody ref={expandTableRef} >
                                {violations.slice(1).map((violation, index) => (
                                    <tr
                                        key={index}>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <button className="font-bold"></button>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{violation.case_no}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{violation.description}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{violation.status_dttm.split(" ")[0]}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{violation.status}</p>
                                        </td>
                                        <td className="px-2 py-3 border-b border-gray-200 bg-white">
                                            <p className="text-gray-900 whitespace-no-wrap">{violation.sam_id}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        // </table>
                    // </div>
                )}
                </table>
            </div> */}
            <div className="h-11"></div>

            {/* <h1>Detail Page</h1>
            <p>Full Address: {addressObj.FULL_ADDRESS}</p>
            <p>Mailing Neighborhood: {addressObj.MAILING_NEIGHBORHOOD}</p>
            <p>Parcel: {addressObj.PARCEL}</p>
            <p>SAM ID: {addressObj.SAM_ADDRESS_ID}</p>
            <p>X_COORD: {addressObj.X_COORD}</p>
            <p>Y_COORD: {addressObj.Y_COORD}</p>
            <p>Zip Code: {addressObj.ZIP_CODE}</p>
            {violations.map(violation => (
                <div key={violation.case_no}>
                    <p>Case No: {violation.case_no}</p>
                    <p>Description: {violation.description}</p>
                    <p>Status: {violation.status}</p>
                    <p>Status Date: {violation.status_dttm}</p>
                </div>
            ))} */}
        </div>
    );
}

export default DetailPage;
