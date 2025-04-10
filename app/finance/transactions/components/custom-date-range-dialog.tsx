"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function CustomDateRangeDialog({
  open,
  onOpenChange,
  onApply,
  initialStartDate,
  initialEndDate,
}: CustomDateRangeDialogProps) {
  const [startDate, setStartDate] = useState(initialStartDate || "");
  const [endDate, setEndDate] = useState(initialEndDate || "");

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Date Range</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-date" className="text-right">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-date" className="text-right">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleApply}
            disabled={!startDate || !endDate}
          >
            Apply Range
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 