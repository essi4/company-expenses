export type Money = { amount:number; currency:string; scale:number };
export type Settlement = {
  gross:number;
  discount:number;
  net:number;
  paid:number;
  due:number;
  status:"unpaid"|"partially_paid"|"paid"|"refunded";
};

export type InvoicePolicy = {
  enabled:boolean;
  optional:boolean;
  autoIssue:boolean;
  allowReceiptWithoutInvoice:boolean;
};

export function calculateSettlement(gross:number, discount:number, paid:number): Settlement {
  const safeGross=Math.max(0,Math.round(gross));
  const safeDiscount=Math.max(0,Math.min(Math.round(discount),safeGross));
  const net=safeGross-safeDiscount;
  const safePaid=Math.max(0,Math.min(Math.round(paid),net));
  return {gross:safeGross,discount:safeDiscount,net,paid:safePaid,due:net-safePaid,status:safePaid===0?"unpaid":safePaid<net?"partially_paid":"paid"};
}
