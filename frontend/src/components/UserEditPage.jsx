import React from 'react';
import UserForm from './organisms/UserForm';

export default function UserEditPage({
  user = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  return (
    <UserForm
      mode="edit"
      initialUser={user}
      onNavigateBack={onNavigateBack}
      onShowToast={onShowToast}
    />
  );
}
