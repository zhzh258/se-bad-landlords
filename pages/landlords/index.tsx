import { GetServerSideProps } from "next";
import { useState, useEffect, useRef } from "react";
import { ILandlord } from "@components/types";

interface ILandlordsProp {
    landlords: ILandlord[]
}


const Landlords: React.FC<ILandlordsProp> = ({landlords}) => {
    return (
        <div className="w-9/10 mx-auto">
            <div className="flex justify-center items-center h-40">
                LANDLORDS
            </div>
        </div>
    );
};

export default Landlords;

export const getServerSideProps: GetServerSideProps = async (context) => {
    // console.log("getServerSideProps...")
    const { params, query } = context;
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const url = `${protocol}://${host}/api/landlords/top-ten`

    try {
        
        return { props: { landlords: [] } };
    } catch (err) {
        console.error(err);
        return { props: { landlords: [] } };
    }
}