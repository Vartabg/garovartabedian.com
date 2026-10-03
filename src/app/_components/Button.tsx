import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

type ButtonVisualProps = ButtonClassNameOptions & {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

type LoadingProps = {
  /** Prevents repeat activation and announces the operation as busy. */
  loading?: boolean;
  /** Concise status announced while loading, for example "Searching". */
  loadingLabel?: string;
};

type AriaDisabledForbidden = {
  /** Use native `disabled`; a focusable ARIA-disabled control needs a client wrapper that suppresses activation. */
  "aria-disabled"?: never;
};

export type ButtonProps = Omit<
  ComponentPropsWithRef<"button">,
  "aria-disabled" | "children" | "className"
> &
  ButtonVisualProps &
  LoadingProps & {
    children: ReactNode;
  } &
  AriaDisabledForbidden;

export type ButtonLinkProps = Omit<
  ComponentPropsWithRef<typeof Link>,
  "aria-disabled" | "children" | "className"
> &
  ButtonVisualProps & {
    children: ReactNode;
  } &
  AriaDisabledForbidden;

export type ButtonAnchorProps = Omit<
  ComponentPropsWithRef<"a">,
  "aria-disabled" | "children" | "className"
> &
  ButtonVisualProps & {
    children: ReactNode;
  } &
  AriaDisabledForbidden;

export type IconButtonProps = Omit<
  ButtonProps,
  "aria-label" | "children" | "leadingIcon" | "size" | "trailingIcon"
> & {
  /** The icon-only button's accessible name. Must not be empty. */
  label: string;
  icon: ReactNode;
};

/**
 * Shared class recipe for action controls. The component-level data attributes
 * remain available for state inspection, while modifier classes also let a
 * link or another semantic element opt into the visual treatment directly.
 */
export function buttonClassName({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonClassNameOptions = {}) {
  return [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth ? "ui-button--full" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function ButtonSpinner() {
  return <span className="ui-button__spinner" aria-hidden="true" />;
}

function ButtonContent({
  children,
  leadingIcon,
  trailingIcon,
  loading,
  iconOnly = false,
}: {
  children: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading: boolean;
  iconOnly?: boolean;
}) {
  return (
    <>
      {iconOnly ? (
        <span className="ui-button__icon ui-button__icon--only" aria-hidden="true">
          {children}
        </span>
      ) : (
        <>
          {leadingIcon ? (
            <span className="ui-button__icon ui-button__icon--leading" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <span className="ui-button__label">{children}</span>
          {trailingIcon ? (
            <span className="ui-button__icon ui-button__icon--trailing" aria-hidden="true">
              {trailingIcon}
            </span>
          ) : null}
        </>
      )}
      {loading ? <ButtonSpinner /> : null}
    </>
  );
}

function NativeButton({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingLabel = "Working",
  disabled,
  type = "button",
  children,
  iconOnly = false,
  ...props
}: ButtonProps & { iconOnly?: boolean }) {
  return (
    <>
      <button
        {...props}
        type={type}
        className={buttonClassName({ variant, size, fullWidth, className })}
        disabled={Boolean(disabled || loading)}
        aria-busy={loading ? "true" : props["aria-busy"]}
        data-ui="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading ? "true" : undefined}
      >
        <ButtonContent
          leadingIcon={leadingIcon}
          trailingIcon={trailingIcon}
          loading={loading}
          iconOnly={iconOnly}
        >
          {children}
        </ButtonContent>
      </button>
      <span
        className="ui-button__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading ? loadingLabel : ""}
      </span>
    </>
  );
}

export function Button(props: ButtonProps) {
  return <NativeButton {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={buttonClassName({ variant, size, fullWidth, className })}
      data-ui="button"
      data-variant={variant}
      data-size={size}
    >
      <ButtonContent
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        loading={false}
      >
        {children}
      </ButtonContent>
    </Link>
  );
}

function safeBlankTargetRel(rel: string | undefined) {
  const values = new Set(rel?.split(/\s+/).filter(Boolean));
  values.add("noopener");
  values.add("noreferrer");
  return [...values].join(" ");
}

export function ButtonAnchor({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  leadingIcon,
  trailingIcon,
  children,
  target,
  rel,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      {...props}
      target={target}
      rel={target === "_blank" ? safeBlankTargetRel(rel) : rel}
      className={buttonClassName({ variant, size, fullWidth, className })}
      data-ui="button"
      data-variant={variant}
      data-size={size}
    >
      <ButtonContent
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        loading={false}
      >
        {children}
      </ButtonContent>
    </a>
  );
}

export function IconButton({
  label,
  icon,
  loadingLabel = "Working",
  ...props
}: IconButtonProps) {
  if (!label.trim()) {
    throw new Error("IconButton requires a non-empty label.");
  }

  return (
    <NativeButton
      {...props}
      size="icon"
      aria-label={label}
      loadingLabel={loadingLabel}
      iconOnly
    >
      {icon}
    </NativeButton>
  );
}
