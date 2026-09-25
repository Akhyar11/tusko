import React from 'react';
import MenuForm from './organisms/MenuForm';

export default function MenuEditPage({
  menu = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  return (
    <MenuForm
      mode="edit"
      initialMenu={menu}
      onNavigateBack={onNavigateBack}
      onShowToast={onShowToast}
    />
  );
}
