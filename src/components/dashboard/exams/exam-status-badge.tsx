"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  EXAM_STATUS_NAMES,
  EXAM_STATUS_COLORS,
  EXAM_RESULT_NAMES,
  EXAM_RESULT_COLORS,
} from "@/types";
import type { ExamStatus, ExamResult } from "@/generated/prisma";

interface ExamStatusBadgeProps {
  status: ExamStatus;
  className?: string;
}

export function ExamStatusBadge({ status, className }: ExamStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(EXAM_STATUS_COLORS[status], className)}
    >
      {EXAM_STATUS_NAMES[status]}
    </Badge>
  );
}

interface ExamResultBadgeProps {
  result: ExamResult;
  className?: string;
}

export function ExamResultBadge({ result, className }: ExamResultBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(EXAM_RESULT_COLORS[result], className)}
    >
      {EXAM_RESULT_NAMES[result]}
    </Badge>
  );
}
