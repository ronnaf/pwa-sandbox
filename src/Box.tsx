import React from "react";

type BoxProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function Box({ children, style }: BoxProps) {
  return (
    <div
      style={{
        margin: 8,
        padding: 8,
        border: "1px solid grey",
        height: "fit-content",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
