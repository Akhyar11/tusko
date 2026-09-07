/**
 * Mock authentication data, demo user accounts, and session helpers
 */

export const mockDemoUsers = [
  {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@tusko.com',
    password: 'password123',
    role: 'customer',
    phone: '0812-3456-7890',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Januari 2025',
    membershipTier: 'Gold Member',
    points: 1250,
    defaultAddress: {
      recipient_name: 'Budi Santoso',
      phone: '0812-3456-7890',
      full_address: 'Jl. Kemang Raya No. 45, RT 02 / RW 04, Bangka, Mampang Prapatan',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12730'
    }
  },
  {
    id: 2,
    name: 'Admin Tusko Official',
    email: 'admin@tusko.com',
    password: 'admin123',
    role: 'admin',
    phone: '0811-9876-5432',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Agustus 2024',
    membershipTier: 'Super Admin',
    points: 99999,
    defaultAddress: {
      recipient_name: 'Admin Tusko Hub',
      phone: '0811-9876-5432',
      full_address: 'Gudang Logistik Sentral Tusko, Jl. Industri Raya No. 88, Daan Mogot',
      city: 'Jakarta Barat',
      province: 'DKI Jakarta',
      postal_code: '11840'
    }
  }
];

export const initialAuthState = {
  user: null, // null when guest, or one of mockDemoUsers
  isAuthenticated: false,
  token: null,
};
