import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (dsl: string) => void;
}

const templates = [
  {
    name: "Cloud Architecture",
    description: "Web app, API gateway, backend services, database, CDN",
    dsl: `# Cloud Architecture
user [user] "Users"
cdn [external] "Cloud CDN"
webapp [web] "React SPA"
gateway [api] "API Gateway"
auth [service] "Auth Service"
users [service] "User Service"
db [db] "PostgreSQL"

user -> cdn "HTTPS"
cdn -> webapp "Static"
webapp -> gateway "REST"
gateway -> auth "Verify"
gateway -> users "Route"
users -> db "SQL"`
  },
  {
    name: "Microservices",
    description: "Multiple services behind an API gateway, message queue",
    dsl: `# Microservices
gateway [api] "API Gateway"
order_svc [service] "Order Service"
payment_svc [service] "Payment Service"
inventory_svc [service] "Inventory Service"
queue [queue] "Kafka"
order_db [db] "Order DB"
payment_db [db] "Payment DB"

gateway -> order_svc
order_svc -> queue "Publish"
queue -> payment_svc "Consume"
queue -> inventory_svc "Consume"
order_svc -> order_db
payment_svc -> payment_db`
  },
  {
    name: "Entity Relationship",
    description: "User, Product, Order, Payment tables",
    dsl: `# ERD
users [db] "Users Table"
products [db] "Products Table"
orders [db] "Orders Table"
payments [db] "Payments Table"
order_items [db] "Order Items"

users -> orders "1:N"
orders -> payments "1:1"
orders -> order_items "1:N"
products -> order_items "1:N"`
  },
  {
    name: "CI/CD Pipeline",
    description: "Dev, CI server, staging, production nodes",
    dsl: `# CI/CD Pipeline
dev [user] "Developer"
git [external] "GitHub"
ci [worker] "CI/CD Server"
registry [cache] "Container Registry"
staging [server] "Staging Env"
prod [server] "Production Env"

dev -> git "Push"
git -> ci "Webhook"
ci -> registry "Push Image"
ci -> staging "Deploy"
staging -> prod "Promote"`
  },
  {
    name: "Event-Driven",
    description: "Producers, message stream, consumers, data warehouse",
    dsl: `# Event-Driven System
api [api] "Events API"
stream [stream] "Event Stream (Kafka)"
enricher [worker] "Enricher"
notifier [service] "Notifier"
dw [dw] "Data Warehouse"

api -> stream "Ingest"
stream -> enricher "Consume"
enricher -> stream "Publish"
stream -> dw "Sink"
stream -> notifier "Consume"`
  },
  {
    name: "Three-Tier Web App",
    description: "Frontend, backend, database classic 3-tier",
    dsl: `# Three-Tier App
client [web] "Browser"
server [service] "Web Server"
database [db] "Relational DB"
cache_node [cache] "Redis Cache"

client -> server "HTTP"
server -> cache_node "Read/Write"
server -> database "SQL"`
  }
];

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#1a1f2e] text-white border-gray-800 max-w-4xl">
        <DialogHeader>
          <DialogTitle>Diagram Templates</DialogTitle>
          <DialogDescription className="text-gray-400">
            Start quickly with a pre-built architecture pattern.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {templates.map((template, i) => (
            <div 
              key={i} 
              className="bg-[#0f1117] border border-gray-800 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors group flex flex-col h-full"
              onClick={() => {
                onSelectTemplate(template.dsl);
                onClose();
              }}
            >
              <h3 className="font-semibold text-gray-200 mb-1 group-hover:text-blue-400">{template.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{template.description}</p>
              
              <div className="bg-[#151923] p-2 rounded overflow-hidden flex-1 h-32 relative">
                <pre className="text-[10px] text-gray-400 font-mono leading-tight">{template.dsl}</pre>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#151923] pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
