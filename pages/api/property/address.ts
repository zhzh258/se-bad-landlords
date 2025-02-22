import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

// const prisma = new PrismaClient();
import prisma from "../../../prisma/prismaClient"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const searchAddress = req.query.search as string;

    const addresses = await prisma.sam.findMany({
      where: {
        FULL_ADDRESS: { equals: searchAddress }, 
      },
    });

    res.status(200).json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).send('Issue finding address');
  } finally {
    await prisma.$disconnect();
  }
}