"use client";

import type { SignupFormData, ProfileField, FounderProfile, InvestorProfile, ExpertProfile } from "@/lib/types";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS, LANGUAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface SignupStep3ProfileProps {
  onComplete: (data: Partial<SignupFormData>) => void;
  onBack: () => void;
  role: UserRole;
  defaultValues?: Partial<SignupFormData>;
}

const BaseProfileSchema = z.object({
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  // profilePictureUrl: z.string().url().optional().or(z.literal('')), // Handled by server action if not provided
  language: z.string().optional(),
});

const FounderProfileSchemaDef = BaseProfileSchema.extend({
  startupName: z.string().min(1, "Startup name is required"),
  industry: z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry"),
  fundingStage: z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage"),
  traction: z.string().optional(),
  needs: z.string().optional(),
});

const InvestorProfileSchemaDef = BaseProfileSchema.extend({
  investmentFocus: z.array(z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry")).min(1, "At least one investment focus is required"),
  fundingRange: z.string().optional(),
  portfolioHighlights: z.string().optional(),
  fundSize: z.string().optional(),
  preferredFundingStages: z.array(z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage")).optional(),
});

const ExpertProfileSchemaDef = BaseProfileSchema.extend({
  areaOfExpertise: z.string().refine(val => EXPERTISE_AREAS.includes(val), "Invalid expertise area"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative"),
  servicesOffered: z.string().optional(),
});


const getProfileFields = (role: UserRole): ProfileField[] => {
  const commonFields: ProfileField[] = [
    { name: "bio", label: "Bio / About You", type: "textarea" },
    { name: "location", label: "Location (e.g., City, Country)", type: "text" },
    { name: "website", label: "Website/LinkedIn URL", type: "text" },
    { name: "language", label: "Preferred Language", type: "select", options: LANGUAGES.map(l => l.name) },
  ];

  switch (role) {
    case UserRole.Founder:
      return [
        { name: "startupName", label: "Startup Name", type: "text", required: true },
        { name: "industry", label: "Industry", type: "select", options: INDUSTRIES, required: true },
        { name: "fundingStage", label: "Funding Stage", type: "select", options: FUNDING_STAGES, required: true },
        { name: "traction", label: "Traction (e.g., users, revenue)", type: "text" },
        { name: "needs", label: "Current Needs (e.g., seeking CTO, partnerships)", type: "textarea" },
        ...commonFields,
      ];
    case UserRole.AngelInvestor:
    case UserRole.VC:
      const investorFields: ProfileField[] = [
        { name: "investmentFocus", label: "Investment Focus (select multiple if applicable)", type: "multiselect", options: INDUSTRIES, required: true },
        { name: "fundingRange", label: "Typical Funding Range (e.g., $50k - $250k)", type: "text" },
        { name: "portfolioHighlights", label: "Portfolio Highlights", type: "textarea" },
        ...commonFields,
      ];
      if (role === UserRole.VC) {
        investorFields.unshift(
          { name: "fundSize", label: "Fund Size", type: "text" },
          { name: "preferredFundingStages", label: "Preferred Funding Stages", type: "multiselect", options: FUNDING_STAGES }
        );
      }
      return investorFields;
    case UserRole.IndustryExpert:
      return [
        { name: "areaOfExpertise", label: "Area of Expertise", type: "select", options: EXPERTISE_AREAS, required: true },
        { name: "yearsOfExperience", label: "Years of Experience", type: "number", required: true },
        { name: "servicesOffered", label: "Services Offered", type: "textarea" },
        ...commonFields,
      ];
    default:
      return commonFields;
  }
};

const getValidationSchema = (role: UserRole) => {
  switch (role) {
    case UserRole.Founder: return FounderProfileSchemaDef;
    case UserRole.AngelInvestor:
    case UserRole.VC: return InvestorProfileSchemaDef;
    case UserRole.IndustryExpert: return ExpertProfileSchemaDef;
    default: return BaseProfileSchema;
  }
};


export function SignupStep3Profile({ onComplete, onBack, role, defaultValues }: SignupStep3ProfileProps) {
  const profileFields = getProfileFields(role);
  const validationSchema = getValidationSchema(role);
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues?.profileData || {},
  });

  const onSubmit = (data: any) => { // Data will be one of FounderProfile, InvestorProfile, etc.
    onComplete({ profileData: data });
  };
  
  const renderField = (field: ProfileField) => {
    const error = errors[field.name as keyof typeof errors];
    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>{field.label}{field.required && <span className="text-destructive">*</span>}</Label>
        <Controller
          name={field.name as any}
          control={control}
          render={({ field: controllerField }) => {
            if (field.type === "textarea") {
              return <Textarea id={field.name} {...controllerField} value={controllerField.value || ''} placeholder={`Enter ${field.label.toLowerCase()}`}/>;
            }
            if (field.type === "number") {
              return <Input id={field.name} type="number" {...controllerField} value={controllerField.value || ''} placeholder={`Enter ${field.label.toLowerCase()}`}/>;
            }
            if (field.type === "select") {
              return (
                <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }
             if (field.type === "multiselect") { // Basic multiselect, can be improved with a proper component
              return (
                <div className="space-y-2">
                  {field.options?.map(option => (
                    <Label key={option} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/50">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                        checked={(controllerField.value as string[] || []).includes(option)}
                        onChange={e => {
                          const currentValue = controllerField.value as string[] || [];
                          if (e.target.checked) {
                            controllerField.onChange([...currentValue, option]);
                          } else {
                            controllerField.onChange(currentValue.filter(item => item !== option));
                          }
                        }}
                      />
                      <span>{option}</span>
                    </Label>
                  ))}
                </div>
              );
            }
            return <Input id={field.name} {...controllerField} value={controllerField.value || ''} placeholder={`Enter ${field.label.toLowerCase()}`}/>;
          }}
        />
        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-xl font-semibold text-center">Tell us more about yourself as a {role}</h3>
      {profileFields.map(renderField)}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isSubmitting ? "Completing..." : "Complete Signup"}
        </Button>
      </div>
    </form>
  );
}
