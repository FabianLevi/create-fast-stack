/**
 * Custom multiselect prompt using @clack/core
 * Same as @clack/prompts multiselect but disabled options render
 * as dimmed text instead of strikethrough
 */

import { MultiSelectPrompt, isCancel } from "@clack/core";
import color from "picocolors";

const S_CHECKBOX_ACTIVE = "◻";
const S_CHECKBOX_SELECTED = "◼";
const S_CHECKBOX_INACTIVE = "◻";
const S_BAR = "│";
const S_BAR_END = "└";

const symbol = (state: string) => {
  switch (state) {
    case "initial":
    case "active":
      return color.cyan("◆");
    case "cancel":
      return color.red("■");
    case "error":
      return color.yellow("▲");
    case "submit":
      return color.green("◇");
    default:
      return color.cyan("◆");
  }
};

interface Option<T> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface CustomMultiselectOptions<T> {
  message: string;
  options: Option<T>[];
  required?: boolean;
  initialValues?: T[];
  cursorAt?: T;
}

export function customMultiselect<T>(opts: CustomMultiselectOptions<T>) {
  const renderOption = (
    opt: Option<T>,
    state: "active" | "selected" | "active-selected" | "inactive" | "cancelled" | "submitted" | "disabled"
  ) => {
    const label = opt.label ?? String(opt.value);
    if (state === "disabled") {
      return `${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}${opt.hint ? ` ${color.dim(`(${opt.hint})`)}` : ""}`;
    }
    if (state === "active-selected") {
      return `${color.green(S_CHECKBOX_SELECTED)} ${label}${opt.hint ? ` ${color.dim(`(${opt.hint})`)}` : ""}`;
    }
    if (state === "selected") {
      return `${color.green(S_CHECKBOX_SELECTED)} ${color.dim(label)}${opt.hint ? ` ${color.dim(`(${opt.hint})`)}` : ""}`;
    }
    if (state === "active") {
      return `${color.cyan(S_CHECKBOX_ACTIVE)} ${label}${opt.hint ? ` ${color.dim(`(${opt.hint})`)}` : ""}`;
    }
    if (state === "cancelled") {
      return `${color.dim(label)}`;
    }
    if (state === "submitted") {
      return `${color.dim(label)}`;
    }
    // inactive
    return `${color.dim(S_CHECKBOX_INACTIVE)} ${color.dim(label)}`;
  };

  const required = opts.required ?? true;

  return new MultiSelectPrompt<Option<T>>({
    options: opts.options,
    initialValues: opts.initialValues,
    required,
    cursorAt: opts.cursorAt,
    validate(value) {
      if (required && (value === undefined || value.length === 0)) {
        return `Please select at least one option.\n${color.reset(color.dim(`Press ${color.gray(color.bgWhite(color.inverse(" space ")))} to select, ${color.gray(color.bgWhite(color.inverse(" enter ")))} to submit`))}`;
      }
    },
    render() {
      const title = `${symbol(this.state)}  ${opts.message}`;
      const selectedValues = this.value ?? [];

      const styleOption = (opt: Option<T>, isActive: boolean) => {
        if (opt.disabled) return renderOption(opt, "disabled");
        const isSelected = selectedValues.includes(opt.value);
        if (isActive && isSelected) return renderOption(opt, "active-selected");
        if (isSelected) return renderOption(opt, "selected");
        if (isActive) return renderOption(opt, "active");
        return renderOption(opt, "inactive");
      };

      switch (this.state) {
        case "submit": {
          const selected = this.options
            .filter((o) => selectedValues.includes(o.value))
            .map((o) => renderOption(o, "submitted"))
            .join(color.dim(", ")) || color.dim("none");
          return `${color.gray(S_BAR)}\n${title}\n${color.gray(S_BAR)}  ${selected}`;
        }
        case "cancel": {
          const selected = this.options
            .filter((o) => selectedValues.includes(o.value))
            .map((o) => renderOption(o, "cancelled"))
            .join(color.dim(", "));
          if (!selected.trim()) return `${color.gray(S_BAR)}\n${title}\n${color.gray(S_BAR)}`;
          return `${color.gray(S_BAR)}\n${title}\n${color.gray(S_BAR)}  ${selected}\n${color.gray(S_BAR)}`;
        }
        case "error": {
          const lines = this.options
            .map((opt, i) => `${color.yellow(S_BAR)}  ${styleOption(opt, i === this.cursor)}`)
            .join("\n");
          const errMsg = `${color.yellow(S_BAR_END)}  ${color.yellow(this.error)}`;
          return `${color.gray(S_BAR)}\n${title}\n${lines}\n${errMsg}\n`;
        }
        default: {
          const lines = this.options
            .map((opt, i) => `${color.cyan(S_BAR)}  ${styleOption(opt, i === this.cursor)}`)
            .join("\n");
          return `${color.gray(S_BAR)}\n${title}\n${lines}\n${color.cyan(S_BAR_END)}\n`;
        }
      }
    },
  }).prompt();
}

export { isCancel };
