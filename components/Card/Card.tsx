import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IAddress } from '@pages/api/search';
import { IProperties } from '@components/types';

// type IProperties = {
//   SAM_ID: string;
//   addressDetails: IAddress;
// }

const Card = ({ properties }: {properties: IProperties} ) => {
  const router = useRouter();
  const SAM_ID: string = properties.SAM_ID
  const addressDetails: IAddress = properties.addressDetails
  const violation_count: string = properties.VIOLATION_COUNT

  const handleButtonClick = () => {
    if (addressDetails) {
      const addressString = JSON.stringify(addressDetails);
      const encodedAddress = encodeURIComponent(addressString);
      router.push(`/map/detail?address=${encodedAddress}`);
    }
  };
  return (
    <div className="grid-item bg-white p-5">
      <p className="font-lora text-neighborhood-dark-blue text-base font-bold">
        {addressDetails.FULL_ADDRESS}
      </p>
      <p className="font-lora text-neighborhood-dark-blue text-sm mt-1">
        Violations: {violation_count}
      </p>
      <p className="font-lora text-neighborhood-dark-blue text-sm mt-1">
        {addressDetails.MAILING_NEIGHBORHOOD} {addressDetails.ZIP_CODE}
      </p>
      <div className="flex justify-end">
        {/* click the button to redirect to the detail page */}
        <img src="/property-arrow.svg" onClick={handleButtonClick} alt="property-arrow" className="m-0 cursor-pointer hover:opacity-60" />
      </div>
    </div>
  )
};

export default Card;