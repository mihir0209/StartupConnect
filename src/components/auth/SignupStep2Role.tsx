"use client";

import type { SignupFormData } from "@/lib/types";
import { UserRole, USER_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface SignupStep2RoleProps {
  onNext: (data: Partial<SignupFormData>) => void;
  onBack: () => void;
  defaultValues?: Partial<SignupFormData>;
}

export function SignupStep2Role({ onNext, onBack, defaultValues }: SignupStep2RoleProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(defaultValues?.role);

  const handleNext = () => {
    if (selectedRole) {
      onNext({ role: selectedRole });
    }
  };

  return (
    <div className="space-y-6">
      <RadioGroup
        value={selectedRole}
        onValueChange={(value) => setSelectedRole(value as UserRole)}
        className="space-y-3"
      >
        {USER_ROLES.map((role) => (
          <div key={role} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer has-[:checked]:bg-accent has-[:checked]:text-accent-foreground">
            <RadioGroupItem value={role} id={role} />
            <Label htmlFor={role} className="font-medium text-base cursor-pointer flex-1">{role}</Label>
          </div>
        ))}
      </RadioGroup>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={!selectedRole} className="bg-primary hover:bg-primary/90">
          Next
        </Button>
      </div>
    </div>
  );
}
