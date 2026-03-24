/**
 * Identity Management Service
 * Merging, deduplication, and Soft-Linking logic for social accounts.
 */

import { UserProfile } from "@/lib/types";

export interface IdentityMergeResult {
    isNewUser: boolean;
    requiresLink: boolean;
    existingIds?: string[];
    linkedProfile?: Partial<UserProfile>;
}

/**
 * Checks for existing identities with the same attributes (e.g. Email/Phone)
 * Implementing "Email-based Soft-Link" as per architectural strategy.
 */
export async function checkIdentityMerge(newUser: Partial<UserProfile>, allUsers: UserProfile[]): Promise<IdentityMergeResult> {
    const { phone, id: providerId } = newUser;
    
    // 1. Phone based duplicate check (HCTC system primary key)
    const existing = allUsers.find(u => u.phone === phone);
    
    if (existing) {
        // [Merge Strategy] Soft-Link
        // Don't merge automatically, mark for operator approval
        if (existing.id !== providerId) {
            return {
                isNewUser: false,
                requiresLink: true,
                existingIds: [existing.id],
                linkedProfile: {
                    ...existing,
                    // Track that this provider is trying to link to this existing profile
                    pendingLinkId: providerId
                }
            };
        }
    }

    return {
        isNewUser: !existing,
        requiresLink: false,
        linkedProfile: existing || newUser
    };
}
