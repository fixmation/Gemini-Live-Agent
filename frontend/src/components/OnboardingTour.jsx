import React, { useState, useEffect } from 'react';

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

  // Update target element and position when step changes
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      setTargetElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let top, left;
      
      switch (step.placement) {
        case 'bottom':
          top = rect.bottom + scrollY + 20;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'top':
          top = rect.top + scrollY - 20;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'right':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + 20;
          break;
        case 'left':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - 20;
          break;
        default:
          top = rect.bottom + scrollY + 20;
          left = rect.left + scrollX + rect.width / 2;
      }
      
      setTooltipPosition({ top, left });
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isActive, steps]);

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

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleSkip}
      />

      {/* Spotlight on target element */}
      {targetElement && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top + window.scrollY - 8,
            left: targetElement.getBoundingClientRect().left + window.scrollX - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-6 max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translate(-50%, 0)',
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
