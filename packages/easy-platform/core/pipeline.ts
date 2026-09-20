import type {PlatformRequest,PlatformResult,StageExecution,StageHandler} from "./types";
export class StagePipeline{
 private handlers=new Map<string,StageHandler>(); private dependencies=new Map<string,string[]>();
 register(stage:string,deps:string[],handler:StageHandler){if(this.handlers.has(stage))throw new Error("stage_already_registered");this.handlers.set(stage,handler);this.dependencies.set(stage,[...deps]);}
 order(){return Array.from(this.handlers.keys()).sort((a,b)=>Number(a)-Number(b));}
 async execute(request:PlatformRequest){const correlationId=request.correlationId??request.requestId+":correlation";const trace:StageExecution[]=[];let previous:string|undefined;
 for(const stage of this.order()){const deps=this.dependencies.get(stage)??[];if(previous&&stage!=="138"&&!deps.includes(previous))return {result:{ok:false,correlationId,error:{code:"PIPELINE_ORDER_VIOLATION",message:stage}},trace};const r=await this.handlers.get(stage)!({...request,correlationId});trace.push({stage,status:r.ok?"EXECUTED":"FAILED",dependencies:deps});if(!r.ok)return {result:{ok:false,correlationId,error:r.error??{code:"STAGE_FAILED",message:stage}},trace};previous=stage;}
 return {result:{ok:true,correlationId,data:trace},trace};}}
