import React, { useState, useEffect, useRef } from 'react';

/**
 * Lightweight Interactive Onboarding Tour Component
 * Custom implementation without external dependencies
 */
export function OnboardingTour({ currentMode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);

  // Re-calculate positions on scroll and resize
  useEffect(() => {
    if (!isActive) return;
    const handleUpdate = () => setScrollTick(prev => prev + 1);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isActive]);

  // Check if user has seen the tour before
  useEffect(() => {
    const tourCompleted = localStorage.getItem('onboarding-tour-completed');
    if (!tourCompleted) {
      // Start tour after a short delay
      setTimeout(() => setIsActive(true), 1500);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  // Define tour steps based on current mode
  const getSteps = () => {
    const baseSteps = [
      {
        target: '.mode-switcher',
        title: '👋 Welcome to Gemini Live Agent!',
        content: 'This is a real-time AI assistant powered by Google\'s Gemini Live API. Switch between three powerful modes here.',
        placement: 'bottom',
      },
    ];

    if (currentMode === 'story') {
      return [
        ...baseSteps,
        {
          target: '.story-brief-input',
          title: '📝 Story Prompt',
          content: 'Describe the story you want Gemini to create. Example: "A robot learning to paint in a futuristic city"',
          placement: 'right',
        },
        {
          target: '.story-tone-select',
          title: '🎨 Choose the Tone',
          content: 'Select the style and mood for your story - this controls the narration and visual styling.',
          placement: 'right',
        },
        {
          target: '.generate-story-button',
          title: '🚀 Generate Story',
          content: 'Click here to let Gemini create your multimodal story with text, images, and audio!',
          placement: 'top',
        },
        {
          target: '.output-stream-section',
          title: '📖 Interleaved narrative',
          content: 'View your story as it unfolds in real-time, with text, images, and audio woven together into a single multimodal sequence.',
          placement: 'top',
        },
      ];
    }

    if (currentMode === 'navigator') {
      return [
        ...baseSteps,
        {
          target: '.global-goal-input',
          title: '🎯 Set Your Goal',
          content: 'Tell Gemini what you want to accomplish. Example: "Click the login button and enter credentials"',
          placement: 'bottom',
        },
        {
          target: '.screenshot-upload',
          title: '📸 Upload Screenshot',
          content: 'Upload a screenshot of the UI you want to navigate. Gemini will analyze it visually.',
          placement: 'right',
        },
        {
          target: '.viewport-settings',
          title: '📐 Viewport Size',
          content: 'Set the resolution of your screenshot for accurate coordinate mapping.',
          placement: 'left',
        },
        {
          target: '.output-stream-section',
          title: '📡 Output Stream',
          content: 'Watch real-time interleaved narrative and UI actions as Gemini generates them. This shows how your prompt is orchestrated into executable steps.',
          placement: 'top',
        },
        {
          target: '.context-export-section',
          title: '� Save & Share Your Work',
          content: 'Export everything you\'ve done as JSON—your inputs, goals, screenshots, and all generated steps. Perfect for saving progress, sharing with teammates, or importing into automation tools. Click "Show JSON" to view or copy it.',
          placement: 'top',
        },
      ];
    }

    if (currentMode === 'live') {
      return [
        ...baseSteps,
        {
          target: '.live-audio-panel',
          title: '🎙️ Live Voice Conversation',
          content: 'Have real-time audio conversations with Gemini. Click "Connect" to start, then "Record" to speak!',
          placement: 'right',
        },
        {
          target: '.live-navigation-panel',
          title: '🧭 Live UI Navigator',
          content: 'Navigate UIs using voice + screen capture. Gemini sees your screen and guides you in real-time!',
          placement: 'right',
        },
        {
          target: '.live-story-panel',
          title: '📖 Live Story Director',
          content: 'Generate stories with text, images, and audio narration - multimodal AI at its finest!',
          placement: 'right',
        },
      ];
    }

    return baseSteps;
  };

  const steps = getSteps();
  const lastScrolledStep = useRef(-1);

  // Update target element and position when step changes or window scrolls/resizes
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      setTargetElement(element);
      
      // Scroll element into view only when the step changes
      if (lastScrolledStep.current !== currentStep) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lastScrolledStep.current = currentStep;
      }
      
      // Calculate position (Viewport-relative for fixed elements)
      const calculatePosition = () => {
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 640;
        const edgePadding = 16;
        const gap = isMobile ? 12 : 16;
        const estimatedHeight = isMobile ? 260 : 220; 
        const tooltipWidth = isMobile ? Math.min(viewportWidth - 32, 320) : 384;

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = viewportWidth - rect.right;
        const spaceLeft = rect.left;

        let top, left;

        // Mobile Strategy: Always vertical (top or bottom) to avoid side overflow
        const forceVertical = isMobile || ['top', 'bottom', 'auto'].includes(step.placement);

        if (forceVertical) {
          if (spaceBelow >= spaceAbove || spaceBelow > estimatedHeight) {
            top = rect.bottom + gap;
          } else {
            top = rect.top - estimatedHeight - gap;
          }
          // Center horizontally and clamp
          left = Math.max(edgePadding + tooltipWidth / 2, Math.min(rect.left + rect.width / 2, viewportWidth - edgePadding - tooltipWidth / 2));
        } else {
          // Desktop specific side placement logic
          if (step.placement === 'right' && spaceRight >= tooltipWidth + gap + edgePadding) {
            top = Math.max(edgePadding, rect.top);
            left = rect.right + gap + tooltipWidth / 2;
          } else if (step.placement === 'left' && spaceLeft >= tooltipWidth + gap + edgePadding) {
            top = Math.max(edgePadding, rect.top);
            left = rect.left - gap - tooltipWidth / 2;
          } else {
            if (spaceBelow >= spaceAbove) {
              top = rect.bottom + gap;
            } else {
              top = rect.top - estimatedHeight - gap;
            }
            left = Math.max(edgePadding + tooltipWidth / 2, Math.min(rect.left + rect.width / 2, viewportWidth - edgePadding - tooltipWidth / 2));
          }
        }

        // Final safety clamp to viewport bounds
        if (top < edgePadding) top = edgePadding;
        const maxTop = viewportHeight - estimatedHeight - edgePadding;
        if (top > maxTop) top = Math.max(edgePadding, maxTop);

        setTooltipPosition({ top, left });
        setTooltipVisible(true);
      };

      // Small delay on first load of a step to account for scrolling animations
      const timer = setTimeout(calculatePosition, lastScrolledStep.current === currentStep ? 50 : 350);
      return () => clearTimeout(timer);
    }
    else {
      setTargetElement(null);
      setTooltipVisible(false);
    }
  }, [currentStep, isActive, steps, scrollTick]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tour complete
      completeTour();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    setIsActive(false);
    setTargetElement(null);
    localStorage.setItem('onboarding-tour-completed', 'true');
    setHasSeenTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem('onboarding-tour-completed');
    setHasSeenTour(false);
    setCurrentStep(0);
    setIsActive(true);
  };

  // Expose reset function globally
  useEffect(() => {
    window.resetOnboardingTour = resetTour;
    return () => {
      delete window.resetOnboardingTour;
    };
  }, []);

  if (!isActive || currentStep >= steps.length) {
    // Show help button
    return hasSeenTour ? (
      <button
        onClick={resetTour}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 group"
        title="Restart Tour"
        aria-label="Show onboarding tour again"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
        <span className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Restart Tour
        </span>
      </button>
    ) : null;
  }

  const step = steps[currentStep];

  // If we are not ready to show or just transitioned, render nothing to avoid blocking
  if (!tooltipVisible || !targetElement) {
    return (
      <div className="fixed inset-0 z-40 bg-black/20 animate-pulse pointer-events-none flex items-center justify-center">
        <div className="bg-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold text-indigo-600">
          Loading tour step...
        </div>
      </div>
    );
  }

  const rect = targetElement.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return (
    <>
      {/* Spotlight ring - now fixed and viewport relative */}
      <div
        className="fixed z-40 pointer-events-none"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.8)',
          borderRadius: '12px',
          transition: 'all 0.1s ease-out',
        }}
      />
      
      {/* Surround with four separate dimming overlays to leave center reachable */}
      {/* Top overlay */}
      <div
        onClick={handleSkip}
        className="fixed bg-black/75 z-39"
        style={{ top: 0, left: 0, width: '100%', height: rect.top, cursor: 'default' }}
      />
      {/* Bottom overlay */}
      <div
        onClick={handleSkip}
        className="fixed bg-black/75 z-39"
        style={{ top: rect.bottom, left: 0, width: '100%', height: Math.max(0, vh - rect.bottom), cursor: 'default' }}
      />
      {/* Left overlay */}
      <div
        onClick={handleSkip}
        className="fixed bg-black/75 z-39"
        style={{ top: rect.top, left: 0, width: rect.left, height: rect.height, cursor: 'default' }}
      />
      {/* Right overlay */}
      <div
        onClick={handleSkip}
        className="fixed bg-black/75 z-39"
        style={{ top: rect.top, left: rect.right, width: Math.max(0, vw - rect.right), height: rect.height, cursor: 'default' }}
      />

      {/* Tooltip component */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translate(-50%, 0)',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          transition: 'all 0.3s ease-out',
        }}
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{step.content}</p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default OnboardingTour;
