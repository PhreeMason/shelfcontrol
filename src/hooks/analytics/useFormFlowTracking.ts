import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics/client';

type FormFlowType = 'deadline_creation' | 'completion';

interface BaseFormFlowConfig {
  flowType: FormFlowType;
  mode?: 'new' | 'edit';
  currentStep: number;
  stepNames: string[];
  getAbandonmentData?: () => Record<string, unknown>;
}

interface DeadlineCreationConfig extends BaseFormFlowConfig {
  flowType: 'deadline_creation';
  mode: 'new' | 'edit';
  getAbandonmentData?: () => { book_selected: boolean };
}

interface CompletionFlowConfig extends BaseFormFlowConfig {
  flowType: 'completion';
}

type FormFlowConfig = DeadlineCreationConfig | CompletionFlowConfig;

interface FormFlowCallbacks {
  onStepChange?: (step: number, stepName: string) => void;
}

export function useFormFlowTracking(
  config: FormFlowConfig,
  callbacks?: FormFlowCallbacks
) {
  const { flowType, mode, currentStep, stepNames, getAbandonmentData } = config;
  const mountTimeRef = useRef(Date.now());
  const hasSubmittedRef = useRef(false);
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current) {
        const timeSpent = Math.round(
          (Date.now() - mountTimeRef.current) / 1000
        );
        const lastStep = currentStepRef.current;

        if (flowType === 'deadline_creation' && mode === 'new') {
          const abandonmentData = getAbandonmentData?.() || {
            book_selected: false,
          };
          analytics.track('deadline_creation_abandoned', {
            last_step: lastStep,
            time_spent: timeSpent,
            ...abandonmentData,
          });
        } else if (flowType === 'completion') {
          analytics.track('completion_flow_abandoned', {
            last_step: lastStep,
            time_spent: timeSpent,
          });
        }
      }
    };
  }, []);

  useEffect(() => {
    const stepName = stepNames[currentStep - 1] || 'unknown';
    callbacks?.onStepChange?.(currentStep, stepName);
  }, [currentStep]);

  const markCompleted = () => {
    hasSubmittedRef.current = true;
  };

  const getCreationContext = () => {
    const completionTime = Math.round(
      (Date.now() - mountTimeRef.current) / 1000
    );
    return {
      creation_duration_seconds: completionTime,
      total_steps: stepNames.length,
    };
  };

  return {
    markCompleted,
    getCreationContext,
    mountTime: mountTimeRef.current,
  };
}
