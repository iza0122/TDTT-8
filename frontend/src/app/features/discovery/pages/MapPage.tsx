import { useState, useMemo } from 'react';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import { calculateDistance, Shop } from '../discovery-services';

const MOCK_SHOPS: Shop[] = [
  { id: '1', name: 'Quán ăn A', lat: 10.7769, lng: 106.7009 },
  { id: '2', name: 'Coffee B', lat: 10.7800, lng: 106.7050 }
];

export default function MapPage() {
  const [radius, setRadius] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const center: [number, number] = [10.7769, 106.7009];

  const filteredShops = useMemo(() => {
    return MOCK_SHOPS.filter(shop => 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      calculateDistance(center[0], center[1], shop.lat, shop.lng) <= radius
    );
  }, [radius, searchTerm]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '15px', background: '#333', color: '#fff' }}>
        <input 
          placeholder="Tìm quán ăn..." 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </header>
      <div style={{ display: 'flex', flexGrow: 1 }}>
        <main style={{ flexGrow: 1 }}><MapView shops={filteredShops} center={center} radius={radius} /></main>
        <aside style={{ width: '60px', background: '#eee' }}><SearchBar radius={radius} setRadius={setRadius} /></aside>
      </div>
    </div>
  );
}