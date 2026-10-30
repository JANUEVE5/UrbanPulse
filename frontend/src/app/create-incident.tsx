import React from 'react';
import { useRouter } from 'expo-router';
import CreateIncidentScreen from '../screens/CreateIncidentScreen';

export default function CreateIncidentRoute() {
  const router = useRouter();

  return (
    <CreateIncidentScreen
      onSuccess={() => {
        router.push('/incidents');
      }}
    />
  );
}

