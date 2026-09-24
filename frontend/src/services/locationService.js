/**
 * Location Service for Tusko Performance
 * Wrapper peta kode wilayah (province/city/district/subdistrict) dari backend
 * (proxy KiriminAja coverage).
 */

import { apiClient } from './apiClient';

export const locationService = {
  async getProvinces() {
    const response = await apiClient.get('/api/locations/provinces');
    return response.data || [];
  },

  async getCities(provinceId) {
    const response = await apiClient.get(`/api/locations/cities?province_id=${encodeURIComponent(provinceId)}`);
    return response.data || [];
  },

  async getDistricts(cityId) {
    const response = await apiClient.get(`/api/locations/districts?city_id=${encodeURIComponent(cityId)}`);
    return response.data || [];
  },

  async getSubdistricts(districtId) {
    const response = await apiClient.get(`/api/locations/subdistricts?district_id=${encodeURIComponent(districtId)}`);
    return response.data || [];
  },
};
