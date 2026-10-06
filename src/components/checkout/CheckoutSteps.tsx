"use client";

import { FiUser, FiTruck, FiCreditCard, FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Dados", icon: FiUser },
  { id: 2, label: "Entrega", icon: FiTruck },
  { id: 3, label: "Pagamento", icon: FiCreditCard },
  { id: 4, label: "Confirmação", icon: FiCheck },
];

interface CheckoutStepsProps {
  currentStep: number;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12",
                  isCompleted && "bg-green-500 text-white shadow-[4px_4px_10px_rgba(34,197,94,0.35)]",
                  isCurrent && "neo-btn bg-primary text-white",
                  !isCompleted && !isCurrent && "neo-surface-sm text-gray-400"
                )}
              >
                {isCompleted ? <FiCheck className="h-5 w-5" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold sm:text-xs",
                  isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="mx-1 h-1 flex-1 overflow-hidden rounded-full sm:mx-4">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
