import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createStagePipeline} from "@/packages/easy-platform/stages/registry";

export const dynamic = "force-dynamic";

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({ok:false,error:"UNAUTHENTICATED"},{status:401});
 const {data:isAdmin}=await supabase.rpc("is_platform_admin");
 if(!isAdmin)return NextResponse.json({ok:false,error:"FORBIDDEN"},{status:403});
 const pipeline=createStagePipeline();
 const out=await pipeline.execute({requestId:crypto.randomUUID(),actorId:user.id,correlationId:crypto.randomUUID()});
 return NextResponse.json({ok:true,platform:"EASY Business Platform",stages:out.trace,result:out.result});
}
