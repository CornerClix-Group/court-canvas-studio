import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  name: string;
  description?: string;
}

interface EstimateWizardStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function EstimateWizardSteps({ steps, currentStep, onStepClick }: EstimateWizardStepsProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              "relative",
              stepIdx !== steps.length - 1 ? "flex-1 pr-8 sm:pr-20" : ""
            )}
          >
            {step.id < currentStep ? (
              /* Completed step */
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors"
                >
                  <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </button>
              </>
            ) : step.id === currentStep ? (
              /* Current step */
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-muted" />
                </div>
                <button
                  type="button"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </button>
              </>
            ) : (
              /* Upcoming step */
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-muted" />
                </div>
                <button
                  type="button"
                  disabled
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </button>
              </>
            )}
            
            {/* Step label */}
            <span className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium hidden sm:block">
              {step.name}
            </span>
          </li>
        ))}
      </ol>
      
      {/* Mobile step indicator */}
      <div className="mt-4 sm:hidden text-center">
        <span className="text-sm font-medium">
          Step {currentStep} of {steps.length}: {steps.find(s => s.id === currentStep)?.name}
        </span>
      </div>
    </nav>
  );
}
