import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from "../../../prisma/prismaClient"
import { ILandlord } from '@components/types'
// export interface ILandlord {
//     city: string,
//     name: string,
//     violations: number
// }

// TODO: Fetch all landlords (With violation or not)
const AllLandlords = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        return [] as ILandlord[]
    } catch(err) {
        return [] as ILandlord[]
    }
}

export default AllLandlords