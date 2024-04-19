// details api gets the sam_id passed.
// then grabs the data related to sam_id
import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
import prisma from "../../../prisma/prismaClient"
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
      
    if (!req.query.sam_id) {
        return res.status(400).json({ error: 'SAM_ID is required.' });
    }
    if (Array.isArray(req.query.sam_id)) {
        return res.status(400).json({ error: 'SAM_ID is required.' });
    }
    const sam_id: string | undefined = req.query.sam_id;

    const samData = await prisma.sam.findFirst({
        where: {
            SAM_ADDRESS_ID: sam_id,
        },
        select: {
            FULL_ADDRESS: true,
            MAILING_NEIGHBORHOOD: true,
            ZIP_CODE: true,
            PARCEL: true
        },
    });
  
    if (!samData) {
        return res.status(404).json({ error: 'SAM record not found.' });
    }
  
    const propertyData = await prisma.property.findFirst({
        where: {
            PID: samData.PARCEL ?? undefined,
        },
        select: {
            OWNER: true
        }
    });

    if (!propertyData) {
        return res.status(404).json({ error: 'Property record not found.' });
    }
    
    // use this to restrict code that makes landlord ScoffLaw
    // const codesRestiction = ['code1', 'code2'];

    const bpvData = await prisma.bpv.findFirst({
        where: {
            sam_id: sam_id,
            // code: {
            //     in: codesRestiction
            // },
        },
        select: {
            status: true,
            code: true,
            description: true
        }
    });

    if (!bpvData) {
        return res.status(404).json({ error: 'BPV record not found.' });
    }

    const combinedData = {
        ...samData,
        owner: propertyData ? propertyData.OWNER : null,
        bpv: bpvData
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred.' });
  } finally {
    await prisma.$disconnect();
  }
}