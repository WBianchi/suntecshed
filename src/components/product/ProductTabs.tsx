"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Spec {
  label: string;
  value: string;
}

interface ProductTabsProps {
  productId: string;
  description: string;
  specs: Spec[];
}

const tabs = [
  { id: "description", label: "Descrição" },
  { id: "specs", label: "Especificações" },
];

export function ProductTabs({ productId, description, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("description");

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-xs font-semibold transition-colors sm:px-6 sm:py-3.5 sm:text-sm",
              activeTab === tab.id
                ? "text-primary"
                : "text-gray-400 hover:text-gray-700"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6 sm:py-8">
        {/* Description */}
        {activeTab === "description" && (
          <div className="prose prose-sm max-w-none text-gray-600">
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        )}

        {/* Specs */}
        {activeTab === "specs" && (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            {specs.map((spec, i) => (
              <div
                key={spec.label}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5 text-sm",
                  i % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                )}
              >
                <span className="font-medium text-gray-500">{spec.label}</span>
                <span className="font-semibold text-gray-900">{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
