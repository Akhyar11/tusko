import React from 'react';
import RoleForm from './organisms/RoleForm';

export default function RoleEditPage({
  role = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  return (
    <RoleForm
      mode="edit"
      initialRole={role}
      onNavigateBack={onNavigateBack}
      onShowToast={onShowToast}
    />
  );
}
