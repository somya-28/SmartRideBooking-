import React, { useState } from 'react';
import { GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

export default function InteractiveMap({ pickup, drop }) {
  const [directions, setDirections] = useState(null);

  return (
    <GoogleMap
      zoom={13}
      mapContainerStyle={{ height: '400px', borderRadius: '8px' }}
    >
      {pickup && drop && (
        <DirectionsService
          options={{
            destination: drop,
            origin: pickup,
            travelMode: 'DRIVING'
          }}
          callback={result => setDirections(result)}
        />
      )}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
}
