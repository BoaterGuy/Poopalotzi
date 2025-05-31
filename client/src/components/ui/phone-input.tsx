import React from "react";
import { Input } from "@/components/ui/input";
import { formatPhoneInput } from "@/lib/phoneUtils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneInput(e.target.value);
      onChange(formatted);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="(555) 123-4567"
        maxLength={14} // (###) ###-####
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";