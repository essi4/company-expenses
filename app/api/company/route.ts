import { NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/company";
export const dynamic = "force-dynamic";
export async function GET(){const c=await getCompanyContext();if(!c.companyId)return NextResponse.json({success:false,message:"دسترسی غیرمجاز"},{status:401});const {data,error}=await c.supabase.from("companies").select("id,name").eq("id",c.companyId).single();if(error)return NextResponse.json({success:false,message:"خطا در دریافت شرکت"},{status:500});return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}
