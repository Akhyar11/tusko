import React from 'react';
import UserForm from './organisms/UserForm';

export default function UserCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  return (
    <UserForm
      mode="create"
      onNavigateBack={onNavigateBack}
      onShowToast={onShowToast}
    />
  );
}
