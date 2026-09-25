import React from 'react';
import RoleForm from './organisms/RoleForm';

export default function RoleCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  return (
    <RoleForm
      mode="create"
      onNavigateBack={onNavigateBack}
      onShowToast={onShowToast}
    />
  );
}
