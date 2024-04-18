// map-points3 api is similar to map-points2
// But it fetch more data

import { IAddress } from '../search';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { LRUCache } from 'lru-cache';
import prisma from "../../../prisma/prismaClient"


type RowData = {
    // below is columns from prisma.bpv
    sam_id:         string;
    latitude:       string;
    longitude:      string;
    // below is IAddress
    // SAM_ADDRESS_ID: string  (same to sam_id)
    FULL_ADDRESS:           string
    MAILING_NEIGHBORHOOD:   string
    ZIP_CODE:               string
    X_COORD:                string
    Y_COORD:                string
    PARCEL:                 string
    VIOLATION_COUNT:        number
};

const HOURS_TO_EXPIRE = 1;

const cache = new LRUCache({
    max: 500,                   // The maximum size of the cache
    ttl: 1000 * 60 * 60 * HOURS_TO_EXPIRE // Items expire after HOURS_TO_EXPIRE hours
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const cacheKey = "map-points3"
    
    if (cache.has(cacheKey)) {
        return res.status(200).json(cache.get(cacheKey));
    }
    try {
        // we use raw here because prisma doesn't have DISTINCT ON
        const results: RowData[] = await prisma.$queryRaw`
            SELECT
                    bpv."sam_id",
                    bpv."latitude",
                    bpv."longitude",
                    MAX(sam."FULL_ADDRESS") AS "FULL_ADDRESS", 
                    MAX(sam."MAILING_NEIGHBORHOOD") AS "MAILING_NEIGHBORHOOD",
                    MAX(sam."ZIP_CODE") AS "ZIP_CODE",
                    MAX(sam."X_COORD") AS "X_COORD",
                    MAX(sam."Y_COORD") AS "Y_COORD",
                    MAX(sam."PARCEL") AS "PARCEL",
                    COUNT(bpv."sam_id") AS "VIOLATION_COUNT"
            FROM
                    sam
            JOIN
                    bpv ON sam."SAM_ADDRESS_ID" = bpv."sam_id"
            group by
                    bpv."latitude", bpv."longitude", bpv."sam_id"
            HAVING
                    COUNT(bpv."sam_id") >= 1
        `
        // SQL to geoJson
        const geoJson = {
            type: "FeatureCollection",
            features: results.map((row: RowData) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [row.longitude, row.latitude],
                },
                properties: {
                    SAM_ID: row.sam_id,
                    VIOLATION_COUNT: row.VIOLATION_COUNT.toString(),
                    addressDetails: {
                        SAM_ADDRESS_ID: row.sam_id,
                        FULL_ADDRESS: row.FULL_ADDRESS,
                        MAILING_NEIGHBORHOOD: row.MAILING_NEIGHBORHOOD,
                        ZIP_CODE: row.ZIP_CODE,
                        X_COORD: row.X_COORD,
                        Y_COORD: row.Y_COORD,
                        PARCEL: row.PARCEL,
                    }
                },
            })),
        };
        cache.set(cacheKey, geoJson);
        res.status(200).json(geoJson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    } finally {
        await prisma.$disconnect();
    }
}