'use server';

import { Creator } from '@/client/types';
import { updateCreatorProfileServer } from '@/lib/api/server/creators';
import { revalidatePath } from 'next/cache';

/**
 * Server action to update a creator's profile and revalidate the path
 */
export async function updateCreatorProfileAction(
  username: string,
  profileData: Partial<Creator>
) {
  try {
    const response = await updateCreatorProfileServer(username, profileData);
    
    if (response.success) {
      // Revalidate the current creator's path
      revalidatePath(`/${username}`, 'layout');
      
      // Also revalidate the specific page
      revalidatePath(`/${username}`);
      
      // If username was changed, also revalidate the new path
      if (profileData.username && profileData.username !== username) {
        revalidatePath(`/${profileData.username}`, 'layout');
      }
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.error || 'Failed to update profile',
        error: response.error
      };
    }
  } catch (error: any) {
    console.error('Error in updateCreatorProfileAction:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: error.message
    };
  }
} 