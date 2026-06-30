'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { getFirebaseClientAuth, hasFirebaseClientConfig } from './firebaseClient';

const ACTIVE_FAMILY_ID_KEY = 'urai_storytime_active_family_id';

export type CloudFamilyStatus =
  | 'unavailable_config'
  | 'signed_out'
  | 'needs_family'
  | 'ready_unverified_membership';

export type CloudFamilyState = {
  firebaseConfigured: boolean;
  loading: boolean;
  user: User | null;
  activeFamilyId: string;
  status: CloudFamilyStatus;
  setActiveFamilyId: (familyId: string) => void;
  clearActiveFamilyId: () => void;
};

function readActiveFamilyId(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ACTIVE_FAMILY_ID_KEY) || '';
}

function writeActiveFamilyId(familyId: string) {
  if (typeof window === 'undefined') return;
  const clean = familyId.trim();
  if (clean) {
    window.localStorage.setItem(ACTIVE_FAMILY_ID_KEY, clean);
  } else {
    window.localStorage.removeItem(ACTIVE_FAMILY_ID_KEY);
  }
}

export function useCloudFamily(): CloudFamilyState {
  const firebaseConfigured = hasFirebaseClientConfig();
  const [loading, setLoading] = useState(firebaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [activeFamilyId, setActiveFamilyIdState] = useState('');

  useEffect(() => {
    setActiveFamilyIdState(readActiveFamilyId());

    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseClientAuth();
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, [firebaseConfigured]);

  const status = useMemo<CloudFamilyStatus>(() => {
    if (!firebaseConfigured) return 'unavailable_config';
    if (!user) return 'signed_out';
    if (!activeFamilyId) return 'needs_family';
    return 'ready_unverified_membership';
  }, [activeFamilyId, firebaseConfigured, user]);

  return {
    firebaseConfigured,
    loading,
    user,
    activeFamilyId,
    status,
    setActiveFamilyId: (familyId: string) => {
      writeActiveFamilyId(familyId);
      setActiveFamilyIdState(familyId.trim());
    },
    clearActiveFamilyId: () => {
      writeActiveFamilyId('');
      setActiveFamilyIdState('');
    }
  };
}

export function canAttemptCloudFamilyWrite(state: Pick<CloudFamilyState, 'status'>): boolean {
  return state.status === 'ready_unverified_membership';
}
