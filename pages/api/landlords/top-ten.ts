import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
import prisma from "../../../prisma/prismaClient"
import { ITopTen, IViolationView } from '@components/types';


const TopTen = async (req: NextApiRequest, res: NextApiResponse) => {
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
        
        res.send(safeJsonStringify(topTen));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Can not fetch the landlords.' });
    } finally {
        await prisma.$disconnect();
    }
};

export default TopTen;

type T1 = {
    a: number,
    b: number,
}
type T2 = {
    a: number,
    b: number,
    c: string
}