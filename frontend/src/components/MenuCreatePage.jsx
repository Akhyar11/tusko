import React from 'react';
import MenuForm from './organisms/MenuForm';

export default function MenuCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  return (
    <MenuForm
      mode="create"
      onNavigateBack={onNavigateBack}
      onShowToast={onShowToast}
    />
  );
}
