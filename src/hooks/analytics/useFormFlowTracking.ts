import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics/client';
import { EventProperties } from '@/lib/analytics/events';

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
  additionalStartProperties?: EventProperties<'completion_flow_started'>;
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
    if (flowType === 'deadline_creation' && mode === 'new') {
      analytics.track('deadline_creation_started');
    } else if (flowType === 'completion') {
      const completionConfig = config as CompletionFlowConfig;
      if (completionConfig.additionalStartProperties) {
        analytics.track('completion_flow_started', completionConfig.additionalStartProperties);
      }
    }

    return () => {
      if (!hasSubmittedRef.current) {
        const timeSpent = Math.round((Date.now() - mountTimeRef.current) / 1000);
        const lastStep = currentStepRef.current;

        if (flowType === 'deadline_creation' && mode === 'new') {
          const abandonmentData = getAbandonmentData?.() || { book_selected: false };
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

    if (flowType === 'deadline_creation' && mode === 'new') {
      analytics.track('deadline_creation_step_viewed', {
        step_number: currentStep,
        step_name: stepName,
      });
    } else if (flowType === 'completion') {
      analytics.track('completion_step_viewed', {
        step_number: currentStep,
        step_name: stepName as 'celebration' | 'review_question' | 'review_form',
      });
    }

    callbacks?.onStepChange?.(currentStep, stepName);
  }, [currentStep, flowType, mode]);

  const markCompleted = (additionalData?: Record<string, unknown>) => {
    hasSubmittedRef.current = true;

    if (flowType === 'deadline_creation' && mode === 'new') {
      const completionTime = Math.round((Date.now() - mountTimeRef.current) / 1000);
      const baseData = {
        time_spent_seconds: completionTime,
        total_steps: stepNames.length,
      };
      analytics.track('deadline_creation_completed', {
        ...baseData,
        ...(additionalData as EventProperties<'deadline_creation_completed'>),
      } as EventProperties<'deadline_creation_completed'>);
    }
  };

  return {
    markCompleted,
    mountTime: mountTimeRef.current,
  };
}
