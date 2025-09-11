interface MemoryPalaceProps {
  drawings: Array<{
    id: string;
    imageData: string;
    username: string;
    votes: { voteType: 'best' | 'funniest' }[];
  }>;
}

export const MemoryPalace: React.FC<MemoryPalaceProps> = ({ drawings }) => {
  if (drawings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🏛️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Memory Palace</h3>
        <p className="text-gray-600">
          This is where the best community drawings are preserved for posterity.
          Submit your drawings to see them displayed here!
        </p>
      </div>
    );
  }

  const topDrawings = drawings
    .map(drawing => ({
      ...drawing,
      score: drawing.votes.length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 9);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🏛️ Memory Palace</h3>
        <p className="text-gray-600">Hall of Famous Drawings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topDrawings.map((drawing, index) => (
          <div key={drawing.id} className="relative group">
            <div className={`
              rounded-lg overflow-hidden transition-transform hover:scale-105
              ${index === 0 ? 'ring-4 ring-yellow-400' : ''}
              ${index === 1 ? 'ring-2 ring-gray-400' : ''}
              ${index === 2 ? 'ring-2 ring-orange-400' : ''}
            `}>
              <img
                src={drawing.imageData}
                alt={`Drawing by ${drawing.username}`}
                className="w-full h-32 object-cover bg-gray-100"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold">{drawing.username}</p>
                  <p className="text-xs">{drawing.score} votes</p>
                </div>
              </div>
              {index < 3 && (
                <div className="absolute top-2 right-2">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
