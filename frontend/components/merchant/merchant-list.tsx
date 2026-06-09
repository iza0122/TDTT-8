"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMerchantsByOwner, MerchantResponse } from '../../lib/services/merchant';
import { useAuth } from '../../hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

export default function MerchantList() {
  const { token } = useAuth();
  const [merchants, setMerchants] = useState<MerchantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerchants = async () => {
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const fetchedMerchants = await getMerchantsByOwner(token);
        setMerchants(fetchedMerchants);
      } catch (err: any) {
        setError(err.message || "Failed to fetch merchants.");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  if (merchants.length === 0) {
    return (
      <div className="text-center py-4">
        <p>You don't own any restaurants yet.</p>
        <Link href="/merchant/add-restaurant">
          <Button className="mt-4">Add New Restaurant</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {merchants.map((merchant) => (
        <Link key={merchant.id} href={`/merchant/${merchant.id}`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{merchant.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{merchant.address}</p>
              <p className="text-sm text-gray-500">{merchant.category}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
