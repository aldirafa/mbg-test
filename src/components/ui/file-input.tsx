"use client";

import { Button, Caption1, mergeClasses, makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { DismissRegular, DocumentArrowUpRegular, ImageAddRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    ...shorthands.border(tokens.strokeWidthThin, "dashed", tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    cursor: "pointer",
    transitionProperty: "background-color, border-color",
    transitionDuration: tokens.durationFaster,
    transitionTimingFunction: tokens.curveEasyEase,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
    ":focus-within": {
      outlineWidth: tokens.strokeWidthThick,
      outlineStyle: "solid",
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: "1px",
    },
  },
  filled: {
    ...shorthands.borderStyle("solid"),
    ...shorthands.borderColor(tokens.colorBrandStroke2),
    backgroundColor: tokens.colorBrandBackground2,
  },
  disabled: {
    cursor: "not-allowed",
    opacity: 0.6,
    ":hover": { backgroundColor: tokens.colorNeutralBackground1, ...shorthands.borderColor(tokens.colorNeutralStroke1) },
  },
  icon: { fontSize: "24px", color: tokens.colorBrandForeground1, flexShrink: 0 },
  input: { position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden" },
});

function formatUkuran(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Dropzone upload file bergaya Fluent. Dipakai ulang di semua form upload.
export function FileInput({
  file,
  onChange,
  placeholder,
  accept = "image/*",
  icon = "foto",
  disabled,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  placeholder: string;
  accept?: string;
  icon?: "foto" | "dokumen";
  disabled?: boolean;
}) {
  const s = useStyles();
  const Icon = icon === "dokumen" ? DocumentArrowUpRegular : ImageAddRegular;
  return (
    <div className="flex items-stretch gap-2">
      <label className={mergeClasses(s.root, file ? s.filled : undefined, disabled ? s.disabled : undefined, "relative flex-1 min-w-0")}>
        <Icon className={s.icon} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{file ? file.name : placeholder}</span>
          <Caption1 className="text-fg3">
            {file ? formatUkuran(file.size) : "Klik untuk memilih file"}
          </Caption1>
        </span>
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className={s.input}
        />
      </label>
      {file && !disabled && (
        <Button
          appearance="subtle"
          icon={<DismissRegular />}
          aria-label="Hapus file"
          onClick={() => onChange(null)}
        />
      )}
    </div>
  );
}
