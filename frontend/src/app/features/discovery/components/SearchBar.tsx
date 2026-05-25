// SearchBar.tsx
interface SearchBarProps {
  radius: number;
  setRadius: (r: number) => void;
}

export default function SearchBar({ radius, setRadius }: SearchBarProps) {
  return (
    <div style={{ padding: '10px', background: '#f5f5f5' }}>
      <label>Bán kính lọc: {radius} km</label>
      <input 
        type="range" min="1" max="20" value={radius} 
        onChange={(e) => setRadius(Number(e.target.value))}
        style={{ marginLeft: '10px' }}
      />
    </div>
  );
}