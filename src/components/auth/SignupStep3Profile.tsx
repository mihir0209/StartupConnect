
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
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import { Loader2 } from "lucide-react";


interface SignupStep3ProfileProps {
  onComplete: (data: Partial<SignupFormData>) => void;
  onBack: () => void;
  role: UserRole;
  defaultValues?: Partial<SignupFormData>;
  isSubmitting: boolean; // Added isSubmitting prop
}

const BaseProfileSchema = z.object({
  bio: z.string().optional().default(""),
  location: z.string().optional().default(""),
  website: z.string().url().optional().or(z.literal('')).default(""),
  profilePictureUrl: z.string().url().optional().or(z.literal('')).default(""),
  language: z.string().optional().default(""),
});

const FounderProfileSchemaDef = BaseProfileSchema.extend({
  startupName: z.string().min(1, "Startup name is required"),
  industry: z.string().refine(val => INDUSTRIES.includes(val), "Industry is required"),
  fundingStage: z.string().refine(val => FUNDING_STAGES.includes(val), "Funding stage is required"),
  traction: z.string().optional().default(""),
  needs: z.string().optional().default(""),
});

const InvestorProfileSchemaDef = BaseProfileSchema.extend({
  investmentFocus: z.array(z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry")).min(1, "At least one investment focus is required"),
  fundingRange: z.string().optional().default(""),
  portfolioHighlights: z.string().optional().default(""),
  fundSize: z.string().optional().default(""),
  preferredFundingStages: z.array(z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage")).optional().default([]),
});

const ExpertProfileSchemaDef = BaseProfileSchema.extend({
  areaOfExpertise: z.string().refine(val => EXPERTISE_AREAS.includes(val), "Area of expertise is required"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative"),
  servicesOffered: z.string().optional().default(""),
});


const getProfileFields = (role: UserRole): ProfileField[] => {
  const commonFields: ProfileField[] = [
    { name: "bio", label: "Bio / About You", type: "textarea" },
    { name: "location", label: "Location (e.g., City, Country)", type: "text" },
    { name: "website", label: "Website/LinkedIn URL", type: "text" },
    { name: "profilePictureUrl", label: "Profile Picture URL (Optional)", type: "text" },
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
        { name: "investmentFocus", label: "Investment Focus (select multiple)", type: "multiselect", options: INDUSTRIES, required: true },
        { name: "fundingRange", label: "Typical Funding Range (e.g., $50k - $250k)", type: "text" },
        { name: "portfolioHighlights", label: "Portfolio Highlights", type: "textarea" },
        ...commonFields,
      ];
      if (role === UserRole.VC) {
        investorFields.unshift( // Add to beginning for VCs
          { name: "fundSize", label: "Fund Size", type: "text" },
          { name: "preferredFundingStages", label: "Preferred Funding Stages (select multiple)", type: "multiselect", options: FUNDING_STAGES }
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


export function SignupStep3Profile({ onComplete, onBack, role, defaultValues, isSubmitting }: SignupStep3ProfileProps) {
  const profileFields = getProfileFields(role);
  const validationSchema = getValidationSchema(role);
  
  const { control, handleSubmit, formState: { errors } } = useForm({ // Removed isSubmitting from here as it's passed via props
    resolver: zodResolver(validationSchema),
    defaultValues: {
      // Initialize with schema defaults then override with any existing profileData
      ...validationSchema.parse({}), // This applies Zod .default() values
      ...(defaultValues?.profileData || {}),
      // Ensure multiselects are arrays, Zod default([]) handles this if schema is correct
      investmentFocus: (defaultValues?.profileData as InvestorProfile)?.investmentFocus || [],
      preferredFundingStages: (defaultValues?.profileData as InvestorProfile)?.preferredFundingStages || [],
    }
  });

  const onSubmit = (data: any) => { 
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
              return <Input id={field.name} type="number" {...controllerField} onChange={e => controllerField.onChange(parseInt(e.target.value,10) || 0)} value={controllerField.value || ''} placeholder={`Enter ${field.label.toLowerCase()}`}/>;
            }
            if (field.type === "select") {
              return (
                <Select onValueChange={controllerField.onChange} value={controllerField.value || undefined}>
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
             if (field.type === "multiselect") {
              return (
                <div className="space-y-2 p-2 border rounded-md max-h-48 overflow-y-auto">
                  {field.options?.map(option => (
                    <Label key={option} className="flex items-center space-x-2 p-1 hover:bg-accent/20 rounded-sm cursor-pointer">
                      <Checkbox
                        id={`${field.name}-${option}`}
                        checked={(controllerField.value as string[] || []).includes(option)}
                        onCheckedChange={checked => {
                          const currentValue = controllerField.value as string[] || [];
                          if (checked) {
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
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Completing...</> : "Complete Signup"}
        </Button>
      </div>
    </form>
  );
}
