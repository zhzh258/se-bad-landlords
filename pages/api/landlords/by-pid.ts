import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
import prisma from "../../../prisma/prismaClient"

type Landlord = {
    OWNER: string;
    UNIT_NUM: string;
    year: string;
}

const ByPID = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const pid = Array.isArray(req.query.pid) ? req.query.pid[0] : req.query.pid;

        if (!pid) {
            res.status(400).send('PARCEL ID is missing in the request');
            return;
        }

        // console.log(pid);
    
        // const landlords = await prisma.property.findMany({
        //     where: {
        //         PID: { equals: pid }, 
        //     },
        //     select: {
        //         OWNER: true,
        //     },
        //     distinct: ['OWNER'],
        // });

        const landlords: Landlord[] = await prisma.$queryRaw<Landlord[]>`
            SELECT DISTINCT "OWNER", "UNIT_NUM", "year" FROM "property"
            WHERE SUBSTRING("PID", 1, LENGTH("PID") - 3) = ${pid.slice(0, -3)}
        `;

        // console.log(landlords);

        if (landlords.length > 0) {
            res.status(200).json(landlords);
        } else {
            res.status(404).send('No landlords found for the provided PARCEL ID');
        }
    
    } catch (error) {
        console.error(error);
        res.status(500).send('Issue finding landlords');
    } finally {
        await prisma.$disconnect();
    }
};

export default ByPID;