export const StepIndicator = ({
  step,
  stepCount,
}: {
  step: number
  stepCount: number
}) => {
  return (
    <>
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        {Array.from({ length: stepCount }, (_, index) => {
          const stepNumber = index + 1
          return (
            <div key={stepNumber} className="flex justify-center items-center">
              <div
                className={`h-[11px] w-[11px] cursor-pointer items-center rounded-full transition-colors ${
                  step === stepNumber
                    ? "bg-blue-600"
                    : "bg-slate-200"
                }`}
              />
              {/* {stepNumber < stepCount && (
                <div className="no-margin h-1 w-3 bg-slate-200"></div>
              )} */}
            </div>
          )
        })}
      </div>
    </>
  )
}
