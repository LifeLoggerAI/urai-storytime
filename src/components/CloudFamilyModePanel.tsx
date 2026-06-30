'use client';

import type { FormEvent } from 'react';
import type { CloudFamilyState } from '../lib/cloudFamilyContext';

export function CloudFamilyModePanel({ cloud }: { cloud: CloudFamilyState }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    cloud.setActiveFamilyId(String(formData.get('familyId') || ''));
  }

  return (
    <aside className="notice">
      <strong>Mode:</strong>{' '}
      {cloud.status === 'ready_unverified_membership' ? 'Cloud Family Mode ready to try' : 'Local Demo Mode active'}

      <p>
        Local Demo Mode saves stories in this browser. Cloud Family Mode requires Firebase config,
        sign-in, and an active family ID. Membership is enforced by Firestore rules and backend Functions.
      </p>

      {cloud.status === 'unavailable_config' && (
        <p>Cloud Family Mode is unavailable because Firebase client config is not present.</p>
      )}

      {cloud.status === 'signed_out' && (
        <p>Cloud Family Mode is prepared, but this browser is not signed in yet.</p>
      )}

      {cloud.user && (
        <form className="form" onSubmit={submit}>
          <label>
            Active family ID
            <input name="familyId" defaultValue={cloud.activeFamilyId} placeholder="families document ID" />
          </label>
          <button className="btn secondary" type="submit">Use family ID</button>
          {cloud.activeFamilyId && (
            <button className="btn secondary" type="button" onClick={cloud.clearActiveFamilyId}>
              Clear family ID
            </button>
          )}
        </form>
      )}

      {cloud.status === 'ready_unverified_membership' && (
        <p>
          Cloud writes will be attempted for family <code>{cloud.activeFamilyId}</code>.
          If membership is missing, Firebase will reject the request and Local Demo Mode remains available.
        </p>
      )}
    </aside>
  );
}
