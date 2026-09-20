export type PlatformRequest={requestId:string;actorId?:string;tenantId?:string;businessId?:string;idempotencyKey?:string;correlationId?:string};
export type PlatformResult<T=unknown>={ok:boolean;correlationId:string;data?:T;error?:{code:string;message:string}};
export type StageExecution={stage:string;status:"READY"|"EXECUTED"|"SKIPPED"|"FAILED";dependencies:string[]};
export type StageHandler=(request:PlatformRequest)=>Promise<PlatformResult>;