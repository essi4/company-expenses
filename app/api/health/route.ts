import {NextResponse} from "next/server";
export async function GET(){return NextResponse.json({ok:true,service:"easy-business-platform",environment:process.env.NODE_ENV});}