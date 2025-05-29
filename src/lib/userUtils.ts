
import type { User, FounderProfile, InvestorProfile, ExpertProfile } from './types';
import { UserRole } from './constants';

/**
 * Gets a display string for a user's primary domains (industry, investment focus, or expertise).
 * @param user The user object.
 * @returns A string like "(Domain1, Domain2)" or "(Domain)" or an empty string if no domains are applicable/found.
 */
export const getUserDisplayDomains = (user?: User | null): string => {
  if (!user || !user.profile) return "";

  let domains: string[] = [];
  const profile = user.profile;

  switch (user.role) {
    case UserRole.Founder:
      if ((profile as FounderProfile).industry) {
        domains.push((profile as FounderProfile).industry);
      }
      break;
    case UserRole.AngelInvestor:
    case UserRole.VC:
      if ((profile as InvestorProfile).investmentFocus && (profile as InvestorProfile).investmentFocus.length > 0) {
        // Take up to 2 for display brevity if many are listed
        domains = [...(profile as InvestorProfile).investmentFocus.slice(0, 2)]; 
      }
      break;
    case UserRole.IndustryExpert:
      if ((profile as ExpertProfile).areaOfExpertise) {
        domains.push((profile as ExpertProfile).areaOfExpertise);
      }
      break;
    default:
      break;
  }

  if (domains.length === 0) return "";
  return `(${domains.join(', ')})`;
};
