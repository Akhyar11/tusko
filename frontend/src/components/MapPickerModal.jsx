import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, 
  MapPin, 
  X, 
  Check, 
  Loader2, 
  AlertCircle,
  LocateFixed
} from 'lucide-react';

// Custom athletic black & gold marker pin
const createCustomPin = () => {
  return L.divIcon({
    className: 'custom-tusko-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background-color: #0a0a0a; color: #fbbf24; border: 2.5px solid #fbbf24; border-radius: 9999px; padding: 7px; box-shadow: 0 10px 25px -3px rgba(0,0,0,0.6);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
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

export default function MapPickerModal({
  isOpen,
  onClose,
  initialLat = -6.2615,
  initialLng = 106.8106,
  onSelectLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [currentCoords, setCurrentCoords] = useState({
    lat: initialLat || -6.2615,
    lng: initialLng || 106.8106
  });

  const [addressDetails, setAddressDetails] = useState({
    formattedAddress: '',
    city: '',
    province: '',
    postalCode: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fallback preset landmarks populer jika offline/rate limited
  const presetLocations = [
    { name: 'Kemang, Jakarta Selatan', lat: -6.2615, lng: 106.8106, city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12730' },
    { name: 'Mega Kuningan, Jakarta Selatan', lat: -6.2289, lng: 106.8272, city: 'Jakarta Selatan', province: 'DKI Jakarta', postalCode: '12950' },
    { name: 'Senayan City, Jakarta Pusat', lat: -6.2272, lng: 106.7972, city: 'Jakarta Pusat', province: 'DKI Jakarta', postalCode: '10270' },
    { name: 'Dago, Bandung', lat: -6.8856, lng: 107.6136, city: 'Bandung', province: 'Jawa Barat', postalCode: '40135' },
    { name: 'Tunjungan, Surabaya', lat: -7.2619, lng: 112.7388, city: 'Surabaya', province: 'Jawa Timur', postalCode: '60275' }
  ];

  // Reverse geocode koordinat ke nama jalan & kota
  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id'
          }
        }
      );

      if (!response.ok) throw new Error('Gagal mengambil data alamat');

      const data = await response.json();
      const addr = data.address || {};

      // Parse komponen alamat Indonesia
      const road = addr.road || addr.pedestrian || addr.footway || addr.suburb || '';
      const houseNumber = addr.house_number ? `No. ${addr.house_number}, ` : '';
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || '';
      const city = addr.city || addr.town || addr.municipality || addr.city_district || 'Jakarta Selatan';
      const province = addr.state || 'DKI Jakarta';
      const postalCode = addr.postcode || '';

      const fullStreet = [houseNumber ? `${road} ${houseNumber}` : road, neighbourhood]
        .filter(Boolean)
        .join(', ') || data.display_name.split(',').slice(0, 3).join(',');

      setAddressDetails({
        formattedAddress: fullStreet || 'Jl. Lokasi Terpilih',
        city,
        province,
        postalCode
      });
    } catch (err) {
      console.warn('Reverse geocode error, using fallback:', err);
      // Cari preset terdekat
      setAddressDetails(prev => ({
        formattedAddress: prev.formattedAddress || `Titik Peta (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        city: prev.city || 'Jakarta Selatan',
        province: prev.province || 'DKI Jakarta',
        postalCode: prev.postalCode || '12730'
      }));
    } finally {
      setIsGeocoding(false);
    }
  };

  // Inisialisasi Map Leaflet saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const lat = initialLat || -6.2615;
    const lng = initialLng || 106.8106;
    setCurrentCoords({ lat, lng });

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Hapus map lama jika ada
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Buat Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false
      });

      // Tambahkan zoom control di kanan bawah
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Gunakan Tile OpenStreetMap standar
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Tambahkan Pin Kustom
      const pinIcon = createCustomPin();
      const marker = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(map);

      // Event klik di map untuk memindahkan pin
      map.on('click', (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        setCurrentCoords({ lat: newLat, lng: newLng });
        reverseGeocode(newLat, newLng);
      });

      // Event drag marker
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCurrentCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size agar tile tidak abu-abu
      map.invalidateSize();

      // Trigger initial reverse geocoding
      reverseGeocode(lat, lng);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLng]);

  // Handle Cari Alamat di Input Pencarian
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setErrorMessage('');

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
        // Fallback filter preset
        const filtered = presetLocations.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          setSearchResults(filtered.map(p => ({
            display_name: p.name,
            lat: p.lat,
            lon: p.lng,
            address: {
              city: p.city,
              state: p.province,
              postcode: p.postalCode
            }
          })));
        } else {
          setErrorMessage('Lokasi tidak ditemukan. Coba gunakan kata kunci jalan atau area lain.');
        }
      }
    } catch (err) {
      console.warn('Search geocode error:', err);
      // Fallback ke preset
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
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setCurrentCoords({ lat, lng });

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    setSearchResults([]);
    setSearchQuery('');
    reverseGeocode(lat, lng);
  };

  // Handle Dapatkan Lokasi GPS Saat Ini
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCurrentCoords({ lat, lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsGeocoding(false);
        setErrorMessage('Izin akses lokasi ditolak atau GPS tidak aktif. Silakan pilih titik langsung di peta.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Konfirmasi dan Kirim data kembali ke form alamat
  const handleConfirmLocation = () => {
    onSelectLocation({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      fullAddress: addressDetails.formattedAddress,
      city: addressDetails.city,
      province: addressDetails.province,
      postalCode: addressDetails.postalCode
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-60 p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-neutral-800 max-w-2xl w-full flex flex-col max-h-[94vh] shadow-2xl overflow-hidden relative">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-amber-400" />
              <h3 className="font-sport font-black text-base sm:text-lg uppercase tracking-wider text-white">
                Pilih Titik Lokasi Pengiriman
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Klik atau geser pin di peta untuk menentukan lokasi tujuan kurir secara akurat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & GPS Quick Trigger */}
        <div className="p-3 bg-neutral-50 border-b border-neutral-200 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jalan, gedung, mall, atau area (cth: Kemang, Senayan)..."
                className="w-full bg-white border border-neutral-300 pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-sport font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-neutral-400 shrink-0"
            >
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'Cari'}
            </button>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              title="Gunakan Lokasi GPS Saya"
              className="px-2.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              <LocateFixed size={14} className="text-amber-500" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">GPS Saya</span>
            </button>
          </form>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 sm:left-4 sm:right-4 mt-1 bg-white border border-neutral-300 shadow-xl z-50 max-h-48 overflow-y-auto text-xs divide-y divide-neutral-100">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left p-2.5 hover:bg-amber-50 flex items-start gap-2 text-neutral-800 cursor-pointer transition-colors"
                >
                  <MapPin size={13} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="mt-2 text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Map Canvas Container */}
        <div className="relative flex-1 min-h-[280px] sm:min-h-[340px] w-full bg-neutral-200">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
          
          {/* Overlay Geocoding Badge */}
          {isGeocoding && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/80 text-white text-[11px] font-bold py-1 px-3 shadow-lg flex items-center gap-1.5 pointer-events-none">
              <Loader2 size={12} className="animate-spin text-amber-400" />
              <span>Memperbarui detail alamat...</span>
            </div>
          )}
        </div>

        {/* Bottom Address Info & Confirmation */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-neutral-200 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-1.5 py-0.5 border border-neutral-200">
                  Titik Terpilih
                </span>
                <span className="font-mono text-[10px] text-neutral-400 truncate">
                  {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                </span>
              </div>
              <p className="font-bold text-xs sm:text-sm text-black truncate">
                {addressDetails.formattedAddress || 'Memilih alamat pada peta...'}
              </p>
              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                {[addressDetails.city, addressDetails.province, addressDetails.postalCode].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-sport font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmLocation}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check size={14} className="text-amber-400" />
              <span>Gunakan Titik Lokasi Ini</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
