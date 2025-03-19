import React from "react";
import { PrimaryButton, SecondaryButton } from "./design-system/Button";

const Button = ({
  variant = "contained",
  color = "primary",
  children,
  ...props
}) => {
  const ButtonComponent =
    color === "secondary" ? SecondaryButton : PrimaryButton;
  return (
    <ButtonComponent variant={variant} {...props}>
      {children}
    </ButtonComponent>
  );
};

export default Button;
