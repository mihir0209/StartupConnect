
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS, LANGUAGES } from "@/lib/constants";
import type { User, ProfileData, ProfileField, FounderProfile, InvestorProfile, ExpertProfile, BaseProfile } from "@/lib/types";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";


// Schemas for validation
const BaseProfileSchemaClient = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  bio: z.string().optional().default(""),
  location: z.string().optional().default(""),
  website: z.string().url().optional().or(z.literal('')).default(""),
  profilePictureUrl: z.string().url().optional().or(z.literal('')).default(""),
  language: z.string().optional().default("en"),
});

const FounderProfileSchemaClient = BaseProfileSchemaClient.extend({
  startupName: z.string().min(1, "Startup name is required").default(""),
  industry: z.string().refine(val => INDUSTRIES.includes(val) || val === "", "Industry is required").default(INDUSTRIES[0]),
  fundingStage: z.string().refine(val => FUNDING_STAGES.includes(val) || val === "", "Funding stage is required").default(FUNDING_STAGES[0]),
  traction: z.string().optional().default(""),
  needs: z.string().optional().default(""),
});

const InvestorProfileSchemaClient = BaseProfileSchemaClient.extend({
  investmentFocus: z.array(z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry")).min(1, "At least one investment focus is required").default([]),
  fundingRange: z.string().optional().default(""),
  portfolioHighlights: z.string().optional().default(""),
  fundSize: z.string().optional().default(""),
  preferredFundingStages: z.array(z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage")).optional().default([]),
});

const ExpertProfileSchemaClient = BaseProfileSchemaClient.extend({
  areaOfExpertise: z.string().refine(val => EXPERTISE_AREAS.includes(val) || val === "", "Area of expertise is required").default(EXPERTISE_AREAS[0]),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative").default(0),
  servicesOffered: z.string().optional().default(""),
});

const getValidationSchema = (role: UserRole) => {
  switch (role) {
    case UserRole.Founder: return FounderProfileSchemaClient;
    case UserRole.AngelInvestor:
    case UserRole.VC: return InvestorProfileSchemaClient;
    case UserRole.IndustryExpert: return ExpertProfileSchemaClient;
    default: return BaseProfileSchemaClient;
  }
};

const getProfileFields = (role: UserRole): ProfileField[] => {
   const commonFields: ProfileField[] = [
    { name: "name", label: "Full Name", type: "text", required: true },
    { name: "bio", label: "Bio / About You", type: "textarea" },
    { name: "location", label: "Location (e.g., City, Country)", type: "text" },
    { name: "website", label: "Website/LinkedIn URL", type: "text" },
    { name: "profilePictureUrl", label: "Profile Picture URL", type: "text" },
    { name: "language", label: "Preferred Language", type: "select", options: LANGUAGES.map(l => l.name) },
  ];

  switch (role) {
    case UserRole.Founder:
      return [
        ...commonFields,
        { name: "startupName", label: "Startup Name", type: "text", required: true },
        { name: "industry", label: "Industry", type: "select", options: INDUSTRIES, required: true },
        { name: "fundingStage", label: "Funding Stage", type: "select", options: FUNDING_STAGES, required: true },
        { name: "traction", label: "Traction (e.g., users, revenue)", type: "text" },
        { name: "needs", label: "Current Needs (e.g., seeking CTO, partnerships)", type: "textarea" },
      ];
    case UserRole.AngelInvestor:
    case UserRole.VC:
      const investorFields: ProfileField[] = [
        ...commonFields,
        { name: "investmentFocus", label: "Investment Focus (select multiple if applicable)", type: "multiselect", options: INDUSTRIES, required: true },
        { name: "fundingRange", label: "Typical Funding Range (e.g., $50k - $250k)", type: "text" },
        { name: "portfolioHighlights", label: "Portfolio Highlights", type: "textarea" },
      ];
      if (role === UserRole.VC) {
        investorFields.push(
          { name: "fundSize", label: "Fund Size", type: "text" },
          { name: "preferredFundingStages", label: "Preferred Funding Stages", type: "multiselect", options: FUNDING_STAGES }
        );
      }
      return investorFields;
    case UserRole.IndustryExpert:
      return [
        ...commonFields,
        { name: "areaOfExpertise", label: "Area of Expertise", type: "select", options: EXPERTISE_AREAS, required: true },
        { name: "yearsOfExperience", label: "Years of Experience", type: "number", required: true },
        { name: "servicesOffered", label: "Services Offered", type: "textarea" },
      ];
    default:
      return commonFields;
  }
};


export default function ProfileSettingsPage() {
  const { user, isLoading, updateUserInContext } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const validationSchema = user ? getValidationSchema(user.role) : BaseProfileSchemaClient;
  const profileFields = user ? getProfileFields(user.role) : [];

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(validationSchema),
    defaultValues: {}, // Initialize with empty object, reset will populate it
  });

  useEffect(() => {
    if (user) {
      // Construct defaultFormData from user data, providing fallbacks for potentially missing fields
      // This avoids calling validationSchema.parse({}) on an empty object.
      const currentProfile = user.profile || {};
      const defaultFormData: Partial<User & ProfileData> = {
        name: user.name,
        email: user.email, // Email is part of the form but typically not directly editable here if from Auth
        
        // Base profile fields
        bio: currentProfile.bio ?? "",
        location: currentProfile.location ?? "",
        website: currentProfile.website ?? "",
        profilePictureUrl: currentProfile.profilePictureUrl ?? "",
        language: (currentProfile as BaseProfile).language || 'en',

        // Role-specific fields from user.profile or defaults
        ...(user.role === UserRole.Founder && {
          startupName: (currentProfile as FounderProfile).startupName ?? "",
          industry: (currentProfile as FounderProfile).industry ?? INDUSTRIES[0],
          fundingStage: (currentProfile as FounderProfile).fundingStage ?? FUNDING_STAGES[0],
          traction: (currentProfile as FounderProfile).traction ?? "",
          needs: (currentProfile as FounderProfile).needs ?? "",
        }),
        ...( (user.role === UserRole.AngelInvestor || user.role === UserRole.VC) && {
          investmentFocus: Array.isArray((currentProfile as InvestorProfile).investmentFocus) ? (currentProfile as InvestorProfile).investmentFocus : [],
          fundingRange: (currentProfile as InvestorProfile).fundingRange ?? "",
          portfolioHighlights: (currentProfile as InvestorProfile).portfolioHighlights ?? "",
          ...(user.role === UserRole.VC && {
            fundSize: (currentProfile as InvestorProfile).fundSize ?? "",
            preferredFundingStages: Array.isArray((currentProfile as InvestorProfile).preferredFundingStages) ? (currentProfile as InvestorProfile).preferredFundingStages : [],
          }),
        }),
        ...(user.role === UserRole.IndustryExpert && {
          areaOfExpertise: (currentProfile as ExpertProfile).areaOfExpertise ?? EXPERTISE_AREAS[0],
          yearsOfExperience: (currentProfile as ExpertProfile).yearsOfExperience ?? 0,
          servicesOffered: (currentProfile as ExpertProfile).servicesOffered ?? "",
        }),
      };
      reset(defaultFormData);
    }
  }, [user, reset]);

  const onSubmit: SubmitHandler<any> = async (data) => {
    if (!user) return;

    const { name: formName, email: formEmail, ...profileDataFromForm } = data;

    // Ensure profile data is clean of top-level name/email which are part of User, not ProfileData
    const cleanProfileData = { ...profileDataFromForm };
    delete cleanProfileData.name;
    delete cleanProfileData.email;

    const updatedUserPartial: Partial<User> = {
      name: formName,
      profile: {
        ...(user.profile as ProfileData),
        ...cleanProfileData,
      } as ProfileData,
    };

    const result = await updateUserInContext(updatedUserPartial);
    if (result.success) {
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      router.push(`/profile/${user.id}`);
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error || "Could not update profile." });
    }
  };

  if (isLoading || !user) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
            if (field.name === "email") {
              return <Input id={field.name} {...controllerField} value={controllerField.value || ''} readOnly className="bg-muted/50" />;
            }
            if (field.type === "textarea") {
              return <Textarea id={field.name} {...controllerField} value={controllerField.value || ''} placeholder={`Enter ${field.label.toLowerCase()}`}/>;
            }
            if (field.type === "number") {
              return <Input id={field.name} type="number" {...controllerField} onChange={e => controllerField.onChange(parseInt(e.target.value, 10) || 0)} value={controllerField.value || ''} placeholder={`Enter ${field.label.toLowerCase()}`}/>;
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
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
            <CardDescription>Keep your information up to date to make the best connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {profileFields.map(renderField)}
            <div className="space-y-2">
                <Label htmlFor="email">Email (Read-only)</Label>
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => <Input id="email" {...field} value={field.value || ''} readOnly className="bg-muted/50" />}
                />
                 {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label>Language Preferences</Label>
                <p className="text-sm text-muted-foreground">Localization for Hindi and Tamil is planned for future updates.</p>
            </div>
            <div>
                <Label>Change Password</Label>
                <Button variant="outline" className="mt-1">Set New Password</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    