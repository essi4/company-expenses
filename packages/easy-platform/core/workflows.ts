export type WorkflowTrigger =
  | "business.created" | "appointment.completed" | "appointment.cancelled"
  | "payment.created" | "invoice.created" | "invoice.paid"
  | "customer.created" | "subscription.changed";

export type WorkflowStep =
  | { type:"validate"; rule:string }
  | { type:"notify"; template:string }
  | { type:"create_receipt" }
  | { type:"create_invoice" }
  | { type:"record_payment" }
  | { type:"emit_event"; event:string }
  | { type:"require_approval"; permission:string };

export type BusinessWorkflow = {
  id:string;
  trigger:WorkflowTrigger;
  enabled:boolean;
  steps:WorkflowStep[];
};

export const CORE_WORKFLOWS: BusinessWorkflow[] = [
  {
    id:"appointment-complete",
    trigger:"appointment.completed",
    enabled:true,
    steps:[
      {type:"validate",rule:"appointment.customer_or_walk_in"},
      {type:"record_payment",},
      {type:"emit_event",event:"service.completed"},
    ],
  },
  {
    id:"invoice-paid",
    trigger:"invoice.paid",
    enabled:true,
    steps:[
      {type:"create_receipt"},
      {type:"emit_event",event:"payment.settled"},
    ],
  },
];
