import { ReactNode } from "react";

interface OnboardingSlideProps {
  title: string;
  description: string;
  bulletPoints?: string[];
  children?: ReactNode;
  buttonText: string;
  onButtonClick: () => void;
  currentStep: number;
  totalSteps: number;
  onSkip?: () => void;
  showSkip?: boolean;
}

const OnboardingSlide = ({
  title,
  description,
  bulletPoints,
  children,
  buttonText,
  onButtonClick,
  currentStep,
  totalSteps,
  onSkip,
  showSkip = true,
}: OnboardingSlideProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 items-start w-full max-w-6xl mx-auto">
      {/* Left side - Text content */}
      <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-md space-y-4 sm:space-y-6">
        {/* Progress dots and Skip */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 sm:w-8 bg-primary"
                    : i < currentStep
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
          {showSkip && onSkip && (
            <button onClick={onSkip} className="btn-ghost text-xs sm:text-sm px-3 sm:px-4 py-1.5">
              Skip
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Bullet points if any */}
        {bulletPoints && bulletPoints.length > 0 && (
          <ul className="space-y-2">
            {bulletPoints.map((point, i) => (
              <li key={i} className="text-foreground font-medium text-sm sm:text-base">
                {point}
              </li>
            ))}
          </ul>
        )}

        {/* Action button */}
        <button onClick={onButtonClick} className="btn-primary flex items-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3">
          {buttonText}
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>

      {/* Right side - Visual content */}
      <div className="flex-1 w-full min-w-0">{children}</div>
    </div>
  );
};

export default OnboardingSlide;
