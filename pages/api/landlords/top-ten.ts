import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
import prisma from "../../../prisma/prismaClient"
import { ITopTen, IViolationView } from '@components/types';
import { LRUCache } from 'lru-cache';


const HOURS_TO_EXPIRE = 1; 
const cache = new LRUCache({
    max: 500,                   // The maximum size of the cache
    ttl: 1000 * 60 * 60 * HOURS_TO_EXPIRE // Items expire after HOURS_TO_EXPIRE hours
  });

const TopTen = async (req: NextApiRequest, res: NextApiResponse) => {
    const cacheKey = "top-ten"
    
    if (cache.has(cacheKey)) {
        return res.status(200).send(cache.get(cacheKey));
    }
    try {
        const topTen: ITopTen[] = await prisma.$queryRaw`
            SELECT
                *
            FROM
                sam
            JOIN
                violations_view ON sam."FULL_ADDRESS" = violations_view."FULL_ADDRESS"
            order by
                violations_view."violations_count" DESC
        `
        const safeJsonStringify = (data: ITopTen[]) => {
            return JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            );
        };
        const stringifiedData = safeJsonStringify(topTen)
        cache.set(cacheKey, stringifiedData)
        res.send(stringifiedData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Can not fetch the landlords.' });
    } finally {
        await prisma.$disconnect();
    }
};

export default TopTen;