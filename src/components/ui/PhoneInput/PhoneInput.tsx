"use client";
import React from "react";
import "./PhoneInput.css";

interface PhoneInputProps {
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
  name?: string;
  style?: React.CSSProperties;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "010-0000-0000",
  required = false,
  className = "",
  readOnly = false,
  name,
  style,
}) => {
  const formatPhone = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "").slice(0, 11);
    if (numeric.length <= 3) return numeric;
    if (numeric.length <= 7) return `${numeric.slice(0, 3)}-${numeric.slice(3)}`;
    return `${numeric.slice(0, 3)}-${numeric.slice(3, 7)}-${numeric.slice(7)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhone(rawValue);
    if (onChange) onChange(formattedValue);
  };

  return (
    <input
      name={name}
      type="tel"
      className={`form-input-premium phone-number-field ${className}`}
      placeholder={placeholder}
      value={value.includes("-") ? value : formatPhone(value)}
      onChange={handleChange}
      required={required}
      readOnly={readOnly}
      style={style}
    />
  );
};
