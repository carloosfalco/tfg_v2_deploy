import { useEffect, useState } from "react";
import { displayNumberInput, parseLocaleNumberInput } from "../../utils/numberInput";

type LocalizedNumberInputProps = {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  blankZero?: boolean;
  className?: string;
  placeholder?: string;
  step?: string;
  min?: number | string;
  max?: number | string;
};

export function LocalizedNumberInput({
  value,
  onValueChange,
  blankZero = true,
  className,
  placeholder,
  step,
  min,
  max,
}: LocalizedNumberInputProps) {
  const [draft, setDraft] = useState(displayNumberInput(value, blankZero));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(displayNumberInput(value, blankZero));
  }, [blankZero, isFocused, value]);

  function clean(raw: string) {
    const parsed = parseLocaleNumberInput(raw, 0);
    const minValue = min === undefined ? parsed : Number(min);
    const maxValue = max === undefined ? parsed : Number(max);
    return Math.min(maxValue, Math.max(minValue, parsed));
  }

  return (
    <input
      className={className}
      inputMode="decimal"
      min={min}
      max={max}
      placeholder={placeholder}
      step={step}
      type="text"
      value={draft}
      onBlur={(event) => {
        setIsFocused(false);
        setDraft(displayNumberInput(clean(event.target.value), blankZero));
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onValueChange(clean(event.target.value));
      }}
      onFocus={() => setIsFocused(true)}
    />
  );
}
