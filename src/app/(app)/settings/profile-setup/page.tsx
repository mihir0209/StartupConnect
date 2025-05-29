
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS, LANGUAGES, USER_ROLES, APP_NAME } from "@/lib/constants";
import type { ProfileData, ProfileField, FounderProfile, InvestorProfile, ExpertProfile, BaseProfile, UserRole as AppUserRole } from "@/lib/types";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

// Schemas for validation (can be shared with actual profile settings page if identical)
const BaseProfileSchemaSetup = z.object({
  bio: z.string().optional().default(""),
  location: z.string().optional().default(""),
  website: z.string().url().optional().or(z.literal('')).default(""),
  profilePictureUrl: z.string().url().optional().or(z.literal('')).default(""),
  language: z.string().optional().default("en"),
});

const FounderProfileSchemaSetup = BaseProfileSchemaSetup.extend({
  startupName: z.string().min(1, "Startup name is required").default(""),
  industry: z.string().refine(val => INDUSTRIES.includes(val) || val === "", "Industry is required").default(INDUSTRIES[0]),
  fundingStage: z.string().refine(val => FUNDING_STAGES.includes(val) || val === "", "Funding stage is required").default(FUNDING_STAGES[0]),
  traction: z.string().optional().default(""),
  needs: z.string().optional().default(""),
});

const InvestorProfileSchemaSetup = BaseProfileSchemaSetup.extend({
  investmentFocus: z.array(z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry")).min(1, "At least one investment focus is required").default([]),
  fundingRange: z.string().optional().default(""),
  portfolioHighlights: z.string().optional().default(""),
  fundSize: z.string().optional().default(""),
  preferredFundingStages: z.array(z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage")).optional().default([]),
});

const ExpertProfileSchemaSetup = BaseProfileSchemaSetup.extend({
  areaOfExpertise: z.string().refine(val => EXPERTISE_AREAS.includes(val) || val === "", "Area of expertise is required").default(EXPERTISE_AREAS[0]),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative").default(0),
  servicesOffered: z.string().optional().default(""),
});

const ProfileSetupFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Please select a role." }) }),
  // Profile data will be dynamically added based on role
}).catchall(z.any()); // Allow extra fields for role-specific profile data


const getProfileFieldsForRole = (role: AppUserRole): ProfileField[] => {
   const commonFields: ProfileField[] = [
    { name: "bio", label: "Bio / About You", type: "textarea" },
    { name: "location", label: "Location (e.g., City, Country)", type: "text" },
    { name: "website", label: "Website/LinkedIn URL", type: "text" },
    { name: "profilePictureUrl", label: "Profile Picture URL", type: "text" },
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
        investorFields.unshift( 
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
    default: // Should not happen if role is selected
      return commonFields;
  }
};

const getValidationSchemaForRole = (role?: AppUserRole) => {
  if (!role) return BaseProfileSchemaSetup; // Fallback, though role should be selected
  switch (role) {
    case UserRole.Founder: return FounderProfileSchemaSetup;
    case UserRole.AngelInvestor:
    case UserRole.VC: return InvestorProfileSchemaSetup;
    case UserRole.IndustryExpert: return ExpertProfileSchemaSetup;
    default: return BaseProfileSchemaSetup;
  }
};


export default function ProfileSetupPage() {
  const { pendingNewUserInfo, completeNewUserProfile, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AppUserRole | undefined>(undefined);
  const [currentProfileFields, setCurrentProfileFields] = useState<ProfileField[]>([]);

  const CombinedSchema = ProfileSetupFormSchema.and(
    selectedRole ? getValidationSchemaForRole(selectedRole) : z.object({})
  );

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(CombinedSchema),
    defaultValues: {
      name: pendingNewUserInfo?.displayName || "",
      email: pendingNewUserInfo?.email || "", // Display only
      role: undefined,
      // profileData defaults will be set by Zod .default() or by watching role
    },
  });
  
  const watchedRole = watch("role");

  useEffect(() => {
    if (user && !authLoading) { // If user becomes available (profile completed), redirect
      router.replace('/home');
    }
    if (!pendingNewUserInfo && !authLoading && !user) { // If no pending user and no active user, redirect to login
      router.replace('/login');
    }
  }, [user, pendingNewUserInfo, authLoading, router]);

  useEffect(() => {
    if (watchedRole) {
      setSelectedRole(watchedRole);
      setCurrentProfileFields(getProfileFieldsForRole(watchedRole));
      // Reset with defaults for the new role
      const defaultProfileValues = getValidationSchemaForRole(watchedRole).parse({});
      reset({
        name: control._formValues.name || pendingNewUserInfo?.displayName || "",
        email: pendingNewUserInfo?.email || "",
        role: watchedRole,
        ...defaultProfileValues
      });
    } else {
      setCurrentProfileFields([]);
    }
  }, [watchedRole, reset, pendingNewUserInfo, control._formValues.name]);


  const onSubmit: SubmitHandler<any> = async (data) => {
    if (!pendingNewUserInfo) {
      toast({ variant: "destructive", title: "Error", description: "Session error. Please try logging in again." });
      router.push('/login');
      return;
    }
    if (!data.role) {
      toast({ variant: "destructive", title: "Error", description: "Please select a role."});
      return;
    }

    const { name, role, ...profileDataFromForm } = data;
    delete profileDataFromForm.email; // email is not part of profileData

    const result = await completeNewUserProfile({
      name,
      role,
      profileData: profileDataFromForm as Partial<ProfileData>
    });

    if (result.success) {
      toast({ title: "Profile Setup Complete!", description: `Welcome to ${APP_NAME}, ${name}!` });
      router.push('/home'); 
    } else {
      toast({ variant: "destructive", title: "Setup Failed", description: result.error || "Could not complete profile setup." });
    }
  };

  if (authLoading || (!pendingNewUserInfo && !user)) { // Show loader if auth is loading OR no pending/active user
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Welcome to {APP_NAME}! Just a few more details to get you started.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email (from provider)</Label>
              <Input id="email" value={pendingNewUserInfo?.email || "Not provided"} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} placeholder="Your full name" />}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Select Your Role <span className="text-destructive">*</span></Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Choose your role in the startup ecosystem" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message as string}</p>}
            </div>
            
            {selectedRole && currentProfileFields.length > 0 && (
              <>
                <hr className="my-4"/>
                <h3 className="text-lg font-medium text-muted-foreground">Role Specific Details ({selectedRole})</h3>
                {currentProfileFields.map(renderField)}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !selectedRole} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finishing Up...</> : "Complete Profile & Enter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
