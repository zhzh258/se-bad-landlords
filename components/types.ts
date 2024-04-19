// Pass this to the <Popup> component
export interface ICardPopup {
    longitude: number;
    latitude: number;
    properties: IProperties;
}

// `properties` attribute of each Mapbox Feature
export interface IProperties {
    SAM_ID: string;
    VIOLATION_COUNT: string;
    addressDetails: IAddress;
}

export interface ICoords {
    latitude: number;
    longitude: number;
}

// Mapbox Viewport
export interface IViewport {
    latitude: number;
    longitude: number;
    zoom: number;
}

// Interface between detail_page and Map_page. Same to prisma.sam
export interface IAddress {
    FULL_ADDRESS: string;
    MAILING_NEIGHBORHOOD: string;
    PARCEL: string;
    SAM_ADDRESS_ID: string;
    X_COORD: string;
    Y_COORD: string;
    ZIP_CODE: string;
}

// prisma 
// view violations_view {...}
export interface IViolationView {
    OWNER: string;
    FULL_ADDRESS: string;
    CITY: string;
    violations_count: number;
}

export interface ITopTen extends IViolationView, IAddress {
    FULL_ADDRESS: string; // avoid conflict
}

export interface INeighborhoodButton {
    name: string;
    latitude: number;
    longitude: number;
    zoom: number;
    featureId: string | number | undefined;
  }

export interface ILandlord {
    city: string,
    name: string,
    violations: number
}