import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, 
  MapPin, 
  Search, 
  LocateFixed, 
  Loader2, 
  Save, 
  Check, 
  Home, 
  Building, 
  Briefcase, 
  Navigation,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';
import SearchBar from './molecules/SearchBar';
import { locationService } from '../services/locationService';
import IconButton from './atoms/IconButton';
import FormTipsPanel from './organisms/FormTipsPanel';

// Custom athletic black & gold marker pin
const createCustomPin = () => {
  return L.divIcon({
    className: 'custom-tusko-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background-color: #0a0a0a; color: #fbbf24; border: 2.5px solid #fbbf24; border-radius: 9999px; padding: 7px; box-shadow: 0 10px 25px -3px rgba(0,0,0,0.6);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div style="width: 2.5px; height: 10px; background-color: #000;"></div>
        <div style="width: 12px; height: 5px; background-color: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1px);"></div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [0, 0]
  });
};

export default function AddressFormPage({
  addressToEdit = null,
  defaultRecipientName = '',
  defaultPhone = '',
  onSaveAddress = () => {},
  onCancel = () => {}
}) {
  const isEditMode = Boolean(addressToEdit && addressToEdit.id);

  // Form states
  const [label, setLabel] = useState(addressToEdit?.label || 'Rumah');
  const [recipientName, setRecipientName] = useState(addressToEdit?.recipient_name || defaultRecipientName || '');
  const [phone, setPhone] = useState(addressToEdit?.phone || defaultPhone || '');
  const [fullAddress, setFullAddress] = useState(addressToEdit?.full_address || '');
  const [city, setCity] = useState(addressToEdit?.city || '');
  const [province, setProvince] = useState(addressToEdit?.province || '');
  const [district, setDistrict] = useState(addressToEdit?.district || '');
  const [provinceCode, setProvinceCode] = useState(addressToEdit?.province_code || '');
  const [cityCode, setCityCode] = useState(addressToEdit?.city_code || '');
  const [districtCode, setDistrictCode] = useState(addressToEdit?.district_code || '');
  const [subdistrictCode, setSubdistrictCode] = useState(addressToEdit?.subdistrict_code || '');
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [formError, setFormError] = useState('');
  const regionSelectedRef = useRef(false);
  const formRef = useRef(null);
  const [postalCode, setPostalCode] = useState(addressToEdit?.postal_code || '');
  const [isDefault, setIsDefault] = useState(addressToEdit?.is_default || false);

  // Coordinates state
  const [coords, setCoords] = useState({
    lat: addressToEdit?.lat || -6.2615,
    lng: addressToEdit?.lng || 106.8106
  });
  const [hasPinned, setHasPinned] = useState(Boolean(addressToEdit?.lat && addressToEdit?.lng));
  const [isFromGps, setIsFromGps] = useState(false);
  const [lastFilledSource, setLastFilledSource] = useState(null);

  // Map and Search states
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedStreetName, setGeocodedStreetName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Fallback preset locations
  const presetLocations = [
    { name: 'Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan', lat: -6.2615, lng: 106.8106, city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12730' },
    { name: 'Kawasan SCBD, Jl. Jend. Sudirman Kav. 52-53, Senayan', lat: -6.2289, lng: 106.8272, city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12950' },
    { name: 'Jl. Asia Afrika No. 19, Gelora, Senayan', lat: -6.2272, lng: 106.7972, city: 'Jakarta Pusat', province: 'DKI Jakarta', postalCode: '10270' },
    { name: 'Jl. Metro Pondok Indah Blok 3B, Pondok Pinang', lat: -6.2657, lng: 106.7845, city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12310' },
    { name: 'Jl. Ir. H. Juanda No. 120, Dago, Coblong', lat: -6.8856, lng: 107.6136, city: 'Bandung', province: 'Jawa Barat', postalCode: '40135' },
    { name: 'Jl. Embong Malang No. 7-21, Tegalsari', lat: -7.2619, lng: 112.7388, city: 'Surabaya', province: 'Jawa Timur', postalCode: '60275' }
  ];

  // Reverse geocode lat, lng to road, city, province, postal code & OTOMATIS ISI FORM
  const reverseGeocode = async (lat, lng, forceUpdate = true, source = 'map') => {
    setIsGeocoding(true);
    setLastFilledSource(source);
    if (source === 'gps') {
      setIsFromGps(true);
      setStatusMessage('📡 Mengambil detail alamat dari koordinat GPS Anda...');
    } else {
      setStatusMessage('Mengambil detail alamat dari titik lokasi...');
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const road = addr.road || addr.pedestrian || addr.footway || addr.path || addr.residential || addr.street || '';
        const houseNumber = addr.house_number ? `No. ${addr.house_number.replace(/^No\.?\s*/i, '')}` : '';
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.hamlet || '';
        const subdistrict = addr.municipality || addr.subdistrict || addr.district || '';
        const detectedCity = addr.city || addr.town || addr.county || addr.city_district || 'Jakarta Selatan';
        const detectedProvince = addr.state || 'DKI Jakarta';
        const detectedPostal = addr.postcode || '';

        // Susun nama jalan dan area terstruktur
        const streetParts = [];
        if (road) {
          streetParts.push(houseNumber ? `${road} ${houseNumber}` : road);
        }
        if (neighbourhood && neighbourhood !== road) {
          streetParts.push(neighbourhood);
        }
        if (subdistrict && subdistrict !== neighbourhood && subdistrict !== detectedCity) {
          streetParts.push(subdistrict);
        }

        const autoStreet = streetParts.length > 0
          ? streetParts.join(', ')
          : (data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : `Jl. Lokasi Koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

        setGeocodedStreetName(autoStreet);

        // LANGSUNG OTOMATIS TERISI KE FORM
        if (forceUpdate) {
          setFullAddress(autoStreet);
          if (!regionSelectedRef.current) {
            if (detectedCity) setCity(detectedCity);
            if (detectedProvince) setProvince(detectedProvince);
            if (detectedPostal) setPostalCode(detectedPostal);
          }
        } else if (regionSelectedRef.current) {
          setFullAddress((prev) => prev || autoStreet);
        } else {
          // Gunakan functional update agar hasil geocode (async) TIDAK menimpa
          // pilihan manual pengguna (mis. dari dropdown wilayah) — T06.7b.
          setFullAddress((prev) => prev || autoStreet);
          if (detectedCity) setCity((prev) => prev || detectedCity);
          if (detectedProvince) setProvince((prev) => prev || detectedProvince);
          if (detectedPostal) setPostalCode((prev) => prev || detectedPostal);
        }

        setHasPinned(true);
        setStatusMessage(source === 'gps'
          ? '✓ Alamat & kota berhasil terisi otomatis dari GPS!'
          : '✓ Alamat otomatis terisi dari titik peta.');
      } else {
        throw new Error('Gagal merespon reverse geocoding');
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
      const fallbackStreet = `Titik Koordinat GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      setGeocodedStreetName(fallbackStreet);
      if (forceUpdate || !fullAddress) {
        setFullAddress(fallbackStreet);
      }
      setHasPinned(true);
      setStatusMessage(`✓ Titik koordinat GPS tersimpan (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Inisialisasi Leaflet Map
  useEffect(() => {
    const lat = coords.lat;
    const lng = coords.lng;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const pinIcon = createCustomPin();
      const marker = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      map.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        setCoords({ lat: newLat, lng: newLng });
        setIsFromGps(false);
        reverseGeocode(newLat, newLng, true, 'map');
      });

      marker.on('dragend', () => {
        const p = marker.getLatLng();
        setCoords({ lat: p.lat, lng: p.lng });
        setIsFromGps(false);
        reverseGeocode(p.lat, p.lng, true, 'map');
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      map.invalidateSize();

      // Trigger initial reverse geocode if no street name yet and not edit mode
      if (!geocodedStreetName && !isEditMode) {
        reverseGeocode(lat, lng, true, 'map');
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Pencarian Lokasi
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setStatusMessage('');

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&countrycodes=id&limit=5&addressdetails=1`
      );

      if (!res.ok) throw new Error('Gagal melakukan pencarian');

      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        const filtered = presetLocations.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          setSearchResults(filtered.map(p => ({
            display_name: p.name,
            lat: p.lat,
            lon: p.lng,
            address: { city: p.city, state: p.province, postcode: p.postalCode }
          })));
        } else {
          setStatusMessage('Lokasi tidak ditemukan. Coba gunakan nama jalan atau area yang lebih umum.');
        }
      }
    } catch (err) {
      console.warn('Search geocode error:', err);
      const filtered = presetLocations.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered.map(p => ({
        display_name: p.name,
        lat: p.lat,
        lon: p.lng,
        address: { city: p.city, state: p.province, postcode: p.postalCode }
      })));
    } finally {
      setIsSearching(false);
    }
  };

  // Pilih hasil pencarian
  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    setCoords({ lat, lng });
    setIsFromGps(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    setSearchResults([]);
    setSearchQuery('');
    reverseGeocode(lat, lng, true, 'search');
  };

  // Pilih preset lokasi cepat
  const handleSelectPreset = (preset) => {
    setCoords({ lat: preset.lat, lng: preset.lng });
    setIsFromGps(false);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 16);
      markerRef.current.setLatLng([preset.lat, preset.lng]);
    }

    setFullAddress(preset.name);
    setCity(preset.city);
    setProvince(preset.province);
    setPostalCode(preset.postalCode);
    setGeocodedStreetName(preset.name);
    setHasPinned(true);
    setLastFilledSource('preset');
    setStatusMessage(`✓ Alamat "${preset.name}" langsung terisi ke formulir!`);
  };

  // Handle GPS Geolokasi - Langsung Isi Otomatis Alamat ke Form
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    setIsGeocoding(true);
    setStatusMessage('📡 Mengaktifkan sensor GPS & mencari titik lokasi Anda...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCoords({ lat, lng });
        setIsFromGps(true);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }

        // Langsung otomatis isi semua field form dari GPS!
        reverseGeocode(lat, lng, true, 'gps');
      },
      (err) => {
        setIsGeocoding(false);
        console.warn('GPS error:', err);
        let errorReason = 'Izin GPS belum aktif.';
        if (err.code === 1) errorReason = 'Akses lokasi ditolak di browser. Mohon izinkan akses GPS.';
        if (err.code === 2) errorReason = 'Sinyal GPS tidak terdeteksi.';
        if (err.code === 3) errorReason = 'Waktu pencarian GPS habis.';
        setStatusMessage(`${errorReason} Anda juga bisa memilih kota cepat atau klik langsung di peta.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const loadProvinces = async (search) => {
    const list = await locationService.getProvinces();
    const q = (search || '').toLowerCase();
    return {
      options: list.filter((p) => !q || (p.name || '').toLowerCase().includes(q)).map((p) => ({ value: String(p.id), label: p.name })),
      hasMore: false,
    };
  };

  const loadCities = async (search) => {
    if (!provinceCode) return { options: [], hasMore: false };
    const list = await locationService.getCities(provinceCode);
    const q = (search || '').toLowerCase();
    return {
      options: list.filter((c) => !q || (c.name || '').toLowerCase().includes(q)).map((c) => ({ value: String(c.id), label: c.name })),
      hasMore: false,
    };
  };

  const loadDistricts = async (search) => {
    if (!cityCode) return { options: [], hasMore: false };
    const list = await locationService.getDistricts(cityCode);
    const q = (search || '').toLowerCase();
    return {
      options: list.filter((d) => !q || (d.name || '').toLowerCase().includes(q)).map((d) => ({ value: String(d.id), label: d.name })),
      hasMore: false,
    };
  };

  const loadSubdistricts = async (search) => {
    if (!districtCode) return { options: [], hasMore: false };
    const list = await locationService.getSubdistricts(districtCode);
    const q = (search || '').toLowerCase();
    return {
      options: list.filter((s) => !q || (s.name || '').toLowerCase().includes(q)).map((s) => ({ value: String(s.id), label: s.name })),
      hasMore: false,
    };
  };

  // T11.2: fallback input manual bila API kode wilayah (KiriminAja) kosong/tak tersedia.
  useEffect(() => {
    locationService.getProvinces()
      .then((list) => { if (!Array.isArray(list) || list.length === 0) setIsManualLocation(true); })
      .catch(() => setIsManualLocation(true));
  }, []);

  const handleProvinceChange = (value, option) => {
    regionSelectedRef.current = true;
    setProvinceCode(value || '');
    setProvince(option?.label || '');
    setCityCode(''); setCity(''); setDistrictCode(''); setDistrict(''); setSubdistrictCode('');
  };

  const handleCityChange = (value, option) => {
    regionSelectedRef.current = true;
    setCityCode(value || '');
    setCity(option?.label || '');
    setDistrictCode(''); setDistrict(''); setSubdistrictCode('');
  };

  const handleDistrictChange = (value, option) => {
    setDistrictCode(value || '');
    setDistrict(option?.label || '');
    setSubdistrictCode('');
  };

  const handleSubdistrictChange = (value) => {
    setSubdistrictCode(value || '');
  };

  // Submit Form Alamat
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!recipientName.trim()) { setFormError('Nama penerima wajib diisi.'); return; }
    if (!phone.trim()) { setFormError('Nomor telepon penerima wajib diisi.'); return; }
    if (!fullAddress.trim()) { setFormError('Alamat lengkap wajib diisi.'); return; }
    if (!city.trim()) { setFormError('Kota / Kabupaten wajib diisi.'); return; }

    const payload = {
      id: addressToEdit?.id || Date.now(),
      label,
      recipient_name: recipientName.trim(),
      phone: phone.trim(),
      full_address: fullAddress.trim(),
      district: district.trim(),
      city: city.trim(),
      province: province.trim() || 'DKI Jakarta',
      province_code: provinceCode || null,
      city_code: cityCode || null,
      district_code: districtCode || null,
      subdistrict_code: subdistrictCode || null,
      postal_code: postalCode.trim() || '12730',
      lat: coords.lat,
      lng: coords.lng,
      is_default: isDefault
    };

    onSaveAddress(payload);
  };

  const labelOptions = [
    { value: 'Rumah', icon: Home },
    { value: 'Kantor', icon: Building },
    { value: 'Apartemen', icon: Briefcase },
    { value: 'Kos / Kontrakan', icon: MapPin }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Header form kanonis */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center gap-3">
            <IconButton icon={ArrowLeft} variant="outline" tooltip="Kembali ke Daftar Alamat" onClick={onCancel} />
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              {isEditMode ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Pengiriman'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <IconButton icon={X} variant="secondary" tooltip="Batal" onClick={onCancel} />
            <IconButton icon={Save} variant="primary" tooltip="Simpan Alamat" onClick={() => formRef.current?.requestSubmit()} />
          </div>
        </div>

        {/* Main Grid Layout: form 3/4 + tips 1/4 */}
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* Kolom Kiri: PETA INTERAKTIF */}
          <div className="space-y-4">
            <div className="bg-white border border-neutral-300 shadow-sm overflow-hidden">
              
              {/* Map Search Bar */}
              <div className="p-3.5 bg-neutral-900 border-b border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-300 font-bold uppercase mb-2">
                  <span className="flex items-center gap-1.5 text-white">
                    <Navigation size={13} className="text-amber-400" />
                    Peta Lokasi Interaktif
                  </span>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    disabled={isGeocoding}
                    className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-sport font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Gunakan titik GPS saat ini & isi form otomatis"
                  >
                    {isGeocoding ? (
                      <Loader2 size={13} className="animate-spin text-black" />
                    ) : (
                      <LocateFixed size={13} className="text-black" />
                    )}
                    <span>GPS Saya (Isi Otomatis)</span>
                  </button>
                </div>

                <div className="flex gap-2 relative">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Ketik nama jalan, gedung, mall (cth: Kemang)..."
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-black font-sport font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 rounded-none"
                  >
                    {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'Cari'}
                  </button>
                </div>

                {/* Tombol Pilihan Kota Cepat */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 pb-1 text-[11px]">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">Kota Cepat:</span>
                  {presetLocations.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-black text-neutral-300 hover:text-white border border-neutral-700 text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                      title={p.name}
                    >
                      {p.city.replace('Kota ', '')}
                    </button>
                  ))}
                </div>

                {/* Dropdown Hasil Pencarian */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-neutral-800 border border-neutral-700 divide-y divide-neutral-700 max-h-44 overflow-y-auto text-xs text-white">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left p-2.5 hover:bg-neutral-700 flex items-start gap-2 cursor-pointer transition-colors"
                      >
                        <MapPin size={13} className="text-amber-400 shrink-0 mt-0.5" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {statusMessage && (
                  <p className="mt-2 text-[11px] text-amber-300 flex items-center gap-1.5 bg-neutral-800/80 p-2 border border-neutral-700">
                    <AlertCircle size={13} className="shrink-0 text-amber-400" />
                    <span>{statusMessage}</span>
                  </p>
                )}
              </div>

              {/* Leaflet Map Canvas */}
              <div className="relative h-[300px] sm:h-[360px] w-full bg-neutral-200">
                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
                
                {isGeocoding && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/85 text-white text-[11px] font-bold py-1.5 px-3.5 shadow-xl flex items-center gap-2 pointer-events-none">
                    <Loader2 size={13} className="animate-spin text-amber-400" />
                    <span>Mendeteksi alamat titik...</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono font-bold text-black border border-neutral-300 shadow-md">
                  Geser pin 📍 untuk ubah lokasi
                </div>
              </div>

              {/* Status Pinpoint Bar */}
              <div className="p-3.5 bg-neutral-50 border-t border-neutral-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Titik Koordinat
                  </span>
                  <span className="font-mono text-[10px] font-bold text-neutral-700">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0" />
                  <span className="truncate">{geocodedStreetName || 'Titik peta aktif'}</span>
                </div>
              </div>

            </div>

            {/* Hint Box */}
            <div className="p-4 bg-amber-500/10 border border-amber-400/40 text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
              <MapPin size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tips Pengiriman Akurat:</strong> Titik koordinat yang Anda tentukan di peta di atas akan membantu kurir ekspedisi (JNE, SiCepat, GoSend) menemukan lokasi tanpa perlu tersesat.
              </div>
            </div>
          </div>

          {/* Kolom Kanan: FORMULIR IDENTITAS & ALAMAT */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">

            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <MapPin size={16} className="text-amber-500" />
              <span>Detail Lengkap Alamat</span>
            </h2>

            {/* Notifikasi Status Terisi Otomatis dari GPS / Peta */}
            {hasPinned && (
              <div className="p-3.5 bg-amber-50 border border-amber-400 flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-950 flex flex-wrap items-center gap-2">
                    <span>Alamat Terisi Otomatis dari {isFromGps ? 'GPS Perangkat' : 'Titik Peta'}</span>
                    <span className="text-[10px] bg-amber-600 text-white font-mono px-2 py-0.5 font-bold">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    {isFromGps 
                      ? '✓ Alamat lengkap, kota, provinsi, dan kode pos telah diisi otomatis sesuai koordinat GPS Anda. Anda dapat melengkapi nomor rumah atau patokan di bawah jika diperlukan.'
                      : '✓ Kolom alamat telah disinkronkan otomatis dengan titik lokasi yang dipilih di peta.'}
                  </p>
                </div>
              </div>
            )}

            {/* 1. Label Alamat (Chip selector) */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Label Alamat <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {labelOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = label === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLabel(opt.value)}
                      className={`px-3 py-2.5 text-xs font-sport font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        active
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon size={13} className={active ? 'text-amber-400' : 'text-neutral-500'} />
                      <span className="truncate">{opt.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Nama & Telepon Penerima */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nama Penerima <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  type="text"
                  value={recipientName}
                  onChange={setRecipientName}
                  placeholder="Nama lengkap penerima..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nomor Handphone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="0812-xxxx-xxxx"
                  required
                />
              </div>
            </div>

            {/* 3. Alamat Lengkap & Patokan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan) <span className="text-rose-500">*</span>
                </label>
                {hasPinned && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 flex items-center gap-1">
                    <Check size={11} /> Terisi Otomatis dari {isFromGps ? 'GPS' : 'Peta'}
                  </span>
                )}
              </div>
              <TextArea
                rows={3}
                value={fullAddress}
                onChange={setFullAddress}
                placeholder="Contoh: Jl. Kemang Raya No. 45, RT 02 / RW 04, Bangka, Mampang Prapatan (Pagar hitam, samping mini market)"
                required
              />
            </div>

            {/* 4. Wilayah (kode KiriminAja) & Kode Pos */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  {isManualLocation ? (
                    <TextInput
                      value={province}
                      onChange={setProvince}
                      placeholder="Ketik provinsi..."
                      weight="bold"
                    />
                  ) : (
                    <ServerSideSelect
                      value={provinceCode}
                      onChange={handleProvinceChange}
                      loadOptions={loadProvinces}
                      placeholder="Pilih provinsi..."
                      isClearable
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kota / Kabupaten <span className="text-rose-500">*</span>
                  </label>
                  {isManualLocation ? (
                    <TextInput
                      value={city}
                      onChange={setCity}
                      placeholder="Ketik kota/kabupaten..."
                      weight="bold"
                    />
                  ) : (
                    <ServerSideSelect
                      value={cityCode}
                      onChange={handleCityChange}
                      loadOptions={loadCities}
                      placeholder="Pilih kota/kabupaten..."
                      disabled={!provinceCode}
                      isClearable
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kecamatan
                  </label>
                  {isManualLocation ? (
                    <TextInput
                      value={district}
                      onChange={setDistrict}
                      placeholder="Ketik kecamatan..."
                    />
                  ) : (
                    <ServerSideSelect
                      value={districtCode}
                      onChange={handleDistrictChange}
                      loadOptions={loadDistricts}
                      placeholder="Pilih kecamatan..."
                      disabled={!cityCode}
                      isClearable
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kelurahan
                  </label>
                  <ServerSideSelect
                    value={subdistrictCode}
                    onChange={handleSubdistrictChange}
                    loadOptions={loadSubdistricts}
                    placeholder="Pilih kelurahan..."
                    disabled={!districtCode}
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kode Pos
                  </label>
                  <TextInput
                    type="text"
                    value={postalCode}
                    onChange={setPostalCode}
                    placeholder="12730"
                    weight="mono"
                  />
                </div>
              </div>

              {!provinceCode && (
                <p className="text-[10px] text-neutral-500 font-medium">
                  Pilih wilayah dari daftar agar ongkir dapat dihitung akurat (kode wilayah KiriminAja).
                </p>
              )}
            </div>

            {/* 5. Checkbox Alamat Utama */}
            <div className="pt-3 border-t border-neutral-200">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <Checkbox
                  checked={isDefault}
                  onChange={setIsDefault}
                  ariaLabel="Jadikan alamat utama"
                />
                <span className="text-xs font-bold text-neutral-800">
                  Jadikan sebagai alamat pengiriman utama
                </span>
              </label>
            </div>

            {formError && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600" />
                  <span className="text-xs font-sport font-bold uppercase">{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError('')}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
                  title="Tutup pesan"
                >
                  <AlertCircle size={15} />
                </button>
              </div>
            )}

            {/* 6. Action Buttons */}
            <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
              >
                Batal
              </button>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isEditMode ? 'Perbarui Alamat' : 'Simpan Alamat'}</span>
              </button>
            </div>

          </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <FormTipsPanel
              title="Panduan Mengisi Alamat"
              tips={[
                { icon: MapPin, heading: 'Tandai Titik Peta', text: 'Geser pin atau pakai GPS agar kurir menemukan lokasi tepat.' },
                { icon: Navigation, heading: 'Cari Alamat', text: 'Ketik nama jalan/gedung lalu tekan Cari untuk memindah pin.' },
                { icon: CheckCircle2, heading: 'Pilih Wilayah', text: 'Pilih provinsi, kota, kecamatan, kelurahan agar ongkir akurat.' },
                { icon: Save, heading: 'Simpan', text: 'Lengkapi nomor rumah/patokan, lalu simpan alamat pengiriman.' },
              ]}
            />
          </div>

        </form>
    </div>
  );
}
